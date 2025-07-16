import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, timer } from 'rxjs';
import { switchMap, first, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

// Guard to prevent authenticated users from accessing the login page
export const LoginGuard = (): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Wait a short time to ensure Firebase auth has initialized
  return timer(300).pipe(
    switchMap(() => authService.isAuthenticated()),
    first(),
    map(isAuthenticated => {
      if (isAuthenticated) {
        // User is already authenticated, redirect to home
        console.log('LoginGuard: User already authenticated, redirecting to home');
        return router.createUrlTree(['/home']);
      }
      // User is not authenticated, allow access to login page
      return true;
    })
  );
};
