import { bootstrapApplication } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideRouter } from '@angular/router';            // 👈 importa provideRouter
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';                   // 👈 importa il tuo array di rotte
import { environment } from './environments/environments';

bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideDatabase(() => getDatabase()),

    provideRouter(routes),
  ],
}).catch(err => console.error(err));
