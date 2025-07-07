import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authState,
  deleteUser as firebaseDeleteUser,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from '@angular/fire/auth';
import { Database, ref, set, get, child, remove } from '@angular/fire/database';
import {
  Observable,
  from,
  of,
  switchMap,
  map,
  tap,
  BehaviorSubject,
  take,
  catchError,
  throwError,
} from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { UserRole } from '../models/user-role.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Database);
  private router = inject(Router);

  // Memorizzo credenziali manager per ristabilire sessione
  private managerEmail?: string;
  private managerPassword?: string;

  currentUser$ = authState(this.auth);
  private currentUserRole$ = new BehaviorSubject<UserRole | null>(null);

  constructor() {
    // Ogni volta che cambia l’auth state, carico profilo + ruolo
    this.currentUser$
      .pipe(
        tap((u) => console.log('AuthState:', u?.email)),
        switchMap((u) => (u ? this.getUserProfile(u.uid) : of(null)))
      )
      .subscribe((profile) => {
        const role = profile?.role ?? null;
        this.currentUserRole$.next(role);
        console.log('Role impostato su:', role);
      });
  }

  /** Effettua login e memorizza credenziali manager */
  login(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      tap((cred) => {
        console.log('Login OK:', cred.user.uid);
        this.managerEmail = email;
        this.managerPassword = password;
        const lastLogin = new Date().toISOString();
        this.ensureUserProfileExists(cred.user, lastLogin);
      })
    );
  }

  /** Logout */
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.currentUserRole$.next(null);
        this.router.navigate(['/login']);
      }),
      catchError((err) => {
        console.error('Logout error:', err);
        return of(undefined);
      })
    );
  }

  /**
   * Crea un nuovo account Firebase **in locale**, salva il profilo
   * in RTDB, poi ri-logga il manager originale
   */
  createUserLocally(
    email: string,
    password: string,
    displayName = '',
    role: UserRole = UserRole.OPERATOR
  ): Observable<void> {
    if (!this.managerEmail || !this.managerPassword) {
      return throwError(() => new Error('Sessione manager non valida'));
    }
    // 1) crea utente
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      // 2) imposta displayName
      switchMap((cred) =>
        from(updateProfile(cred.user, { displayName })).pipe(map(() => cred))
      ),
      // 3) salva profilo in RealtimeDB
      switchMap((cred) => {
        const now = new Date().toISOString();
        const u = new User(
          cred.user.uid,
          email,
          displayName,
          role,
          now,
          now,
          false
        );
        return from(set(ref(this.db, `users/${u.id}`), u));
      }),
      // 4) fai logout dall’utente appena creato
      switchMap(() => from(signOut(this.auth))),
      // 5) riloggati come manager
      switchMap(() =>
        from(
          signInWithEmailAndPassword(
            this.auth,
            this.managerEmail!,
            this.managerPassword!
          )
        )
      ),
      map(() => void 0),
      catchError((err) => {
        console.error('createUserLocally error:', err);
        return throwError(() => err);
      })
    );
  }

  /** Elimina solo il record RTDB; trigger Cloud Function (onDelete) si occupa di Auth */
  deleteUserRecord(uid: string): Observable<void> {
    return from(remove(ref(this.db, `users/${uid}`))).pipe(map(() => void 0));
  }

  /** Aggiorna solo il ruolo in RTDB */
  updateUserRoleRecord(uid: string, newRole: UserRole): Observable<void> {
    return from(set(ref(this.db, `users/${uid}/role`), newRole)).pipe(
      map(() => void 0)
    );
  }

  /** Recupera profilo utente da RTDB */
  private getUserProfile(uid: string): Observable<User | null> {
    return from(get(child(ref(this.db), `users/${uid}`))).pipe(
      map((snap) => {
        if (!snap.exists()) return null;
        const d: any = snap.val();
        return new User(
          d.id || uid,
          d.email || '',
          d.displayName,
          d.role || UserRole.OPERATOR,
          d.creationDate,
          d.lastLoginDate,
          d.disabled
        );
      }),
      catchError((err) => {
        console.error('getUserProfile error:', err);
        return of(null);
      })
    );
  }

  /** Se manca il profilo RTDB la prima volta che fai login, lo crea */
  private ensureUserProfileExists(user: FirebaseUser, lastLoginDate: string) {
    this.getUserProfile(user.uid)
      .pipe(take(1))
      .subscribe(async (p) => {
        if (!p) {
          const role =
            user.email === 'visionhubglobal@gmail.com'
              ? UserRole.FOUNDER
              : UserRole.OPERATOR;
          const now = new Date().toISOString();
          const u = new User(
            user.uid,
            user.email ?? '',
            user.displayName ?? '',
            role,
            now,
            lastLoginDate,
            false
          );
          await set(ref(this.db, `users/${u.id}`), u);
          this.currentUserRole$.next(role);
        } else {
          await set(
            ref(this.db, `users/${user.uid}/lastLoginDate`),
            lastLoginDate
          );
        }
      });
  }

  /** Carica tutti gli utenti da RTDB */
  getAllUsers(): Observable<User[]> {
    return from(get(child(ref(this.db), 'users'))).pipe(
      map((snap) => {
        const arr: User[] = [];
        if (snap.exists()) {
          snap.forEach((cs) => {
            const d: any = cs.val();
            arr.push(
              new User(
                d.id || cs.key!,
                d.email || '',
                d.displayName,
                d.role || UserRole.OPERATOR,
                d.creationDate,
                d.lastLoginDate,
                d.disabled
              )
            );
          });
        }
        return arr;
      }),
      catchError((err) => {
        console.error('getAllUsers error:', err);
        return of([]);
      })
    );
  }

  // ── HELPERS PUBBLICI ───────────────────────────
  getCurrentUser() {
    return this.currentUser$;
  }
  getUserRole() {
    return this.currentUserRole$.asObservable();
  }
  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(map((u) => !!u));
  }
  hasRole(required: UserRole): Observable<boolean> {
    return this.currentUserRole$.pipe(
      map((r) => {
        if (!r) return false;
        if (required === UserRole.OPERATOR) return true;
        if (required === UserRole.MANAGER)
          return r === UserRole.MANAGER || r === UserRole.FOUNDER;
        return r === UserRole.FOUNDER;
      })
    );
  }

  /** Aggiorna displayName su Auth + RTDB */
  updateUserProfile(user: FirebaseUser, displayName: string): Observable<void> {
    return from(updateProfile(user, { displayName })).pipe(
      switchMap(() =>
        set(ref(this.db, `users/${user.uid}/displayName`), displayName)
      ),
      map(() => void 0)
    );
  }
}
