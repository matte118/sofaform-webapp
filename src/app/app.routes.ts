import { Routes } from '@angular/router';
import { ManagerGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'aggiungi-prodotto',
    loadComponent: () =>
      import('./components/aggiungi-prodotto/aggiungi-prodotto.component').then(
        (m) => m.AggiungiProdottoComponent
      ),
  },
  {
    path: 'gestione-componenti',
    loadComponent: () =>
      import(
        './components/gestione-componenti/gestione-componenti.component'
      ).then((m) => m.GestioneComponentiComponent),
  },
  {
    path: 'gestione-fornitori',
    loadComponent: () =>
      import(
        './components/gestione-fornitori/gestione-fornitori.component'
      ).then((m) => m.GestioneFornitoriComponent),
  },
  {
    path: 'gestione-tessuti',
    loadComponent: () =>
      import('./components/gestione-tessuti/gestione-tessuti.component').then(
        (m) => m.GestioneTessutiComponent
      ),
  },
  {
    path: 'gestione-utenti',
    loadComponent: () =>
      import('./components/gestione-utenti/gestione-utenti.component').then(
        (m) => m.GestioneUtentiComponent
      ),
    canActivate: [() => ManagerGuard()], // Require manager role
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
