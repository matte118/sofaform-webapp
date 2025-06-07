import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AggiungiProdottoComponent } from './aggiungi-prodotto/aggiungi-prodotto.component';
// import { SettingsComponent } from './features/settings/settings.component';  // se hai già creato Settings

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products', component: AggiungiProdottoComponent },
//   { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' }    // catch-all
];
