// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // abilita il router con le tue rotte
    importProvidersFrom(
      RouterModule.forRoot(routes, {
        scrollPositionRestoration: 'enabled',
        initialNavigation: 'enabledBlocking'
      })
    ),
    // animations necessarie per molti componenti PrimeNG
    importProvidersFrom(BrowserAnimationsModule),
    // importa il modulo PrimeNG che ti serve
    importProvidersFrom(PanelMenuModule)
  ]
};
