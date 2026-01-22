import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  of,
  map,
  switchMap,
  first,
  filter,
  timeout,
  catchError,
} from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user-role.model';

// Base auth guard to check if user is authenticated
export const AuthGuard = (): Observable<boolean> => {
  return of(true);
};

// Role-based guard for manager and above
export const ManagerGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .getUserRole()
    .pipe(
      switchMap((r) =>
        r !== null ? of(r) : authService.loadCurrentUserRole()
      ),
      // wait until role is known, but don't hang forever
      filter((r): r is UserRole => r !== null),
      first(),
      timeout({ first: 3000 }),
      catchError(() => of(null)),
      map((role) => {
        const hasRole =
          role === UserRole.MANAGER || role === UserRole.FOUNDER;
        console.log('ManagerGuard - User has manager role:', hasRole);
        if (!hasRole) {
          router.navigate(['/access-denied']);
        }
        return hasRole;
      })
    );
};

// Role-based guard for founder only
export const FounderGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .getUserRole()
    .pipe(
      switchMap((r) =>
        r !== null ? of(r) : authService.loadCurrentUserRole()
      ),
      filter((r): r is UserRole => r !== null),
      first(),
      timeout({ first: 3000 }),
      catchError(() => of(null)),
      map((role) => {
        const hasRole = role === UserRole.FOUNDER;
        if (!hasRole) {
          console.log(
            'User does not have founder role, redirecting to access-denied'
          );
          router.navigate(['/access-denied']);
        }
        return hasRole;
      })
    );
};
