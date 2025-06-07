import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ModificaProdottoComponent } from './modifica-prodotto/modifica-prodotto.component';
import { AggiungiProdottoComponent } from './aggiungi-prodotto/aggiungi-prodotto.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'modifica-prodotto', component: ModificaProdottoComponent },
  { path: 'aggiungi-prodotto', component: AggiungiProdottoComponent },
  { path: '**', redirectTo: 'home' }
];
