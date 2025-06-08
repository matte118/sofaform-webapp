import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AggiungiProdottoComponent } from './components/aggiungi-prodotto/aggiungi-prodotto.component';
import { GestioneComponentiComponent } from './components/gestione-componenti/gestione-componenti.component';
import { ModificaProdottoComponent } from './components/modifica-prodotto/modifica-prodotto.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'modifica-prodotto', component: ModificaProdottoComponent },
  { path: 'modifica-prodotto/:nome', component: ModificaProdottoComponent },
  { path: 'aggiungi-prodotto', component: AggiungiProdottoComponent },
  { path: 'gestione-componenti', component: GestioneComponentiComponent },
  { path: '**', redirectTo: 'home' }
];
