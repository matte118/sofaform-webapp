import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { User as FirebaseUser } from '@angular/fire/auth';
import { User } from '../../../models/user.model';
import { UserRole } from '../../../models/user-role.model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-gestione-utenti',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    TooltipModule,
    ProgressSpinnerModule,
    DropdownModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestione-utenti.component.html',
  styleUrls: ['./gestione-utenti.component.scss'],
})
export class GestioneUtentiComponent implements OnInit {
  users: User[] = [];
  currentUser: FirebaseUser | null = null;
  currentUserRole: UserRole | null = null;

  showNewUserDialog = false;
  saving = false;

  newUser = {
    email: '',
    password: '',
    displayName: '',
    role: UserRole.OPERATOR,
  };

  roleOptions = [
    { label: 'Fondatore', value: UserRole.FOUNDER },
    { label: 'Manager', value: UserRole.MANAGER },
    { label: 'Operatore', value: UserRole.OPERATOR },
  ];

  loading = true;

  constructor(
    private authSvc: AuthService,
    private msg: MessageService,
    private confirm: ConfirmationService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private plt: Object
  ) {}

  ngOnInit() {
    this.authSvc
      .getCurrentUser()
      .pipe(tap((u) => (this.currentUser = u)))
      .subscribe();
    this.authSvc
      .getUserRole()
      .pipe(tap((r) => (this.currentUserRole = r)))
      .subscribe();

    if (isPlatformBrowser(this.plt)) {
      this.loadUsers();
    } else {
      this.loading = false;
    }
  }

  private loadUsers() {
    this.loading = true;
    this.authSvc
      .getAllUsers()
      .pipe(
        tap((us) => {
          const order = {
            [UserRole.FOUNDER]: 1,
            [UserRole.MANAGER]: 2,
            [UserRole.OPERATOR]: 3,
          };
          this.users = us.sort((a, b) =>
            a.role !== b.role
              ? order[a.role] - order[b.role]
              : a.email.localeCompare(b.email)
          );
        }),
        catchError((err) => {
          this.msg.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Impossibile caricare utenti',
          });
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe();
  }

  openNewUserDialog() {
    this.newUser = {
      email: '',
      password: '',
      displayName: '',
      role: UserRole.OPERATOR,
    };
    this.showNewUserDialog = true;
  }

  createUser() {
    if (!this.newUser.email || this.newUser.password.length < 6) {
      this.msg.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Email o password non validi',
      });
      return;
    }

    this.saving = true;
    this.showNewUserDialog = false;

    this.authSvc
      .createUserLocally(
        this.newUser.email,
        this.newUser.password,
        this.newUser.displayName,
        this.newUser.role
      )
      .subscribe({
        next: () => {
          this.msg.add({
            severity: 'success',
            summary: 'Utente creato',
            detail: `${this.newUser.email} creato con successo.`,
          });
          this.loadUsers();
        },
        error: (err) => {
          this.msg.add({
            severity: 'error',
            summary: 'Errore creazione',
            detail: err.message || err,
          });
        },
        complete: () => {
          this.saving = false;
        },
      });
  }

  deleteUser(u: User) {
    if (
      this.currentUser?.uid === u.id ||
      (this.currentUserRole !== UserRole.FOUNDER &&
        (u.role === UserRole.FOUNDER || u.role === UserRole.MANAGER))
    ) {
      this.msg.add({
        severity: 'error',
        summary: 'Permesso negato',
        detail: 'Non puoi eliminare questo utente',
      });
      return;
    }

    this.confirm.confirm({
      message: `Eliminare ${u.email}?`,
      accept: () => {
        this.authSvc.deleteUserRecord(u.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Utente eliminato' });
            this.loadUsers();
          },
          error: (err) => {
            this.msg.add({
              severity: 'error',
              summary: 'Errore',
              detail: err.message,
            });
          },
        });
      },
    });
  }

  changeUserRole(u: User, newRole: UserRole) {
    if (
      this.currentUser?.uid === u.id ||
      (this.currentUserRole === UserRole.MANAGER &&
        newRole !== UserRole.OPERATOR) ||
      (u.role === UserRole.FOUNDER && this.currentUserRole !== UserRole.FOUNDER)
    ) {
      this.msg.add({
        severity: 'error',
        summary: 'Permesso negato',
        detail: 'Non puoi cambiare questo ruolo',
      });
      return;
    }

    this.confirm.confirm({
      message: `Imposta ruolo di ${u.email} a ${newRole}?`,
      accept: () => {
        this.authSvc.updateUserRoleRecord(u.id, newRole).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Ruolo aggiornato' });
            u.role = newRole;
          },
          error: (err) => {
            this.msg.add({
              severity: 'error',
              summary: 'Errore',
              detail: err.message,
            });
          },
        });
      },
    });
  }

  formatDate(d?: string): string {
    return d ? new Date(d).toLocaleString('it-IT') : 'N/D';
  }

  isCurrentUser(uid: string): boolean {
    return this.currentUser?.uid === uid;
  }

  canManageUser(u: User): boolean {
    if (this.currentUserRole === UserRole.FOUNDER) return true;
    if (this.currentUserRole === UserRole.MANAGER)
      return u.role === UserRole.OPERATOR;
    return false;
  }

  canChangeRole(u: User): boolean {
    if (this.isCurrentUser(u.id)) return false;
    if (
      u.role === UserRole.FOUNDER &&
      this.currentUserRole !== UserRole.FOUNDER
    )
      return false;
    if (
      this.currentUserRole === UserRole.MANAGER &&
      u.role !== UserRole.OPERATOR
    )
      return false;
    return this.canManageUser(u);
  }

  getRoleName(r: UserRole): string {
    switch (r) {
      case UserRole.FOUNDER:
        return 'Fondatore';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.OPERATOR:
        return 'Operatore';
      default:
        return 'Sconosciuto';
    }
  }

  getRoleClass(r: UserRole): string {
    switch (r) {
      case UserRole.FOUNDER:
        return 'role-founder';
      case UserRole.MANAGER:
        return 'role-manager';
      case UserRole.OPERATOR:
        return 'role-operator';
      default:
        return '';
    }
  }
}
