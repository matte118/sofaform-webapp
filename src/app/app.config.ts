// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { routes } from './app.routes';
import { environment } from '../environments/environments';

export const appConfig: ApplicationConfig = {
  providers: [
    // Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),
    // Basic router configuration for fallback
    importProvidersFrom(
      RouterModule.forRoot(routes, {
        scrollPositionRestoration: 'enabled',
        initialNavigation: 'enabledBlocking'
      })
    ),
    // animations necessarie per molti componenti PrimeNG
    importProvidersFrom(BrowserAnimationsModule),
    // importa il modulo PrimeNG che ti serve
    importProvidersFrom(PanelMenuModule),
  ]
};
