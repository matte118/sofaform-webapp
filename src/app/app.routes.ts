import { Routes } from '@angular/router';
import { AuthGuard, ManagerGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [() => LoginGuard()], // Add the login guard
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
    canActivate: [() => AuthGuard()],
  },
  {
    path: 'aggiungi-prodotto',
    loadComponent: () =>
      import('./components/aggiungi-prodotto/aggiungi-prodotto.component').then(
        (m) => m.AggiungiProdottoComponent
      ),
    canActivate: [() => AuthGuard()],
  },
  {
    path: 'gestione-componenti',
    loadComponent: () =>
      import(
        './components/gestione-componenti/gestione-componenti.component'
      ).then((m) => m.GestioneComponentiComponent),
    canActivate: [() => AuthGuard()],
  },
  {
    path: 'gestione-fornitori',
    loadComponent: () =>
      import(
        './components/gestione-fornitori/gestione-fornitori.component'
      ).then((m) => m.GestioneFornitoriComponent),
    canActivate: [() => AuthGuard()],
  },
  {
    path: 'gestione-tessuti',
    loadComponent: () =>
      import('./components/gestione-tessuti/gestione-tessuti.component').then(
        (m) => m.GestioneTessutiComponent
      ),
    canActivate: [() => AuthGuard()],
  },
  {
    path: 'gestione-utenti',
    loadComponent: () =>
      import('./components/gestione-utenti/gestione-utenti.component').then(
        (m) => m.GestioneUtentiComponent
      ),
    canActivate: [() => AuthGuard(), () => ManagerGuard()], // Require manager role
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./components/access-denied/access-denied.component').then(
        (m) => m.AccessDeniedComponent
      ),
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' },
];
