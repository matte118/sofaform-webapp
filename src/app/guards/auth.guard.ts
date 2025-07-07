import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, map, switchMap, first, timer, tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user-role.model';

// Base auth guard to check if user is authenticated
export const AuthGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait a short time to ensure Firebase auth has initialized
  return timer(300).pipe(
    switchMap(() => authService.isAuthenticated()),
    tap((authenticated) =>
      console.log('AuthGuard - User authenticated:', authenticated)
    ),
    first(),
    map((authenticated) => {
      if (!authenticated) {
        console.log('User not authenticated, redirecting to login');
        router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
};

// Role-based guard for manager and above
export const ManagerGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait a short time to ensure Firebase auth and user role have initialized
  return timer(300).pipe(
    switchMap(() => authService.hasRole(UserRole.MANAGER)),
    tap((hasRole) =>
      console.log('ManagerGuard - User has manager role:', hasRole)
    ),
    first(),
    map((hasRole) => {
      if (!hasRole) {
        console.log(
          'User does not have manager role, redirecting to access-denied'
        );
        router.navigate(['/access-denied']);
        return false;
      }
      return true;
    })
  );
};

// Role-based guard for founder only
export const FounderGuard = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait a short time to ensure Firebase auth and user role have initialized
  return timer(300).pipe(
    switchMap(() => authService.hasRole(UserRole.FOUNDER)),
    first(),
    map((hasRole) => {
      if (!hasRole) {
        console.log(
          'User does not have founder role, redirecting to access-denied'
        );
        router.navigate(['/access-denied']);
        return false;
      }
      return true;
    })
  );
};
