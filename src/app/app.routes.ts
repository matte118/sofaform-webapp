import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AggiungiProdottoComponent } from './components/aggiungi-prodotto/aggiungi-prodotto.component';
import { GestioneComponentiComponent } from './components/gestione-componenti/gestione-componenti.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'aggiungi-prodotto', component: AggiungiProdottoComponent },
  { path: 'gestione-componenti', component: GestioneComponentiComponent },
  { path: '**', redirectTo: 'home' }
];
