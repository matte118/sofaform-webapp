// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PanelMenuModule } from 'primeng/panelmenu';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { routes } from './app.routes';
import { environment } from '../environments/environments';

export const appConfig: ApplicationConfig = {
  providers: [
    // Firebase core
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions()),

    // Routing
    importProvidersFrom(
      RouterModule.forRoot(routes, {
        scrollPositionRestoration: 'enabled',
        initialNavigation: 'enabledBlocking',
      })
    ),

    // Animations e PrimeNG
    importProvidersFrom(BrowserAnimationsModule, PanelMenuModule),
  ],
};
