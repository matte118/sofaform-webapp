// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';

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
    importProvidersFrom(PanelMenuModule),
    provideFirebaseApp(() =>
      initializeApp({
        // ...your Firebase config...
        apiKey: 'your-api-key',
        authDomain: 'your-project-id.firebaseapp.com',
        databaseURL: 'https://your-project-id-default-rtdb.firebaseio.com',
        projectId: 'your-project-id',
        storageBucket: 'your-project-id.appspot.com',
        messagingSenderId: 'your-messaging-sender-id',
        appId: 'your-app-id'
      })
    ),
    provideDatabase(() => getDatabase())
  ]
};
