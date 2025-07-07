import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule],
  template: `
    <div class="access-denied-container">
      <p-card styleClass="error-card">
        <ng-template pTemplate="header">
          <div class="error-header">
            <i class="pi pi-lock"></i>
            <h1>Accesso Negato</h1>
          </div>
        </ng-template>

        <div class="error-content">
          <p>Non hai i permessi necessari per accedere a questa pagina.</p>
          <p>Contatta un amministratore per richiedere l'accesso.</p>
        </div>

        <ng-template pTemplate="footer">
          <div class="button-container">
            <button
              pButton
              type="button"
              label="Torna alla Home"
              icon="pi pi-home"
              routerLink="/home"
            ></button>
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: [
    `
      .access-denied-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
        padding: 1rem;
      }

      .error-card {
        width: 100%;
        max-width: 500px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .error-header {
        text-align: center;
        padding: 1rem;

        i {
          font-size: 3rem;
          color: #f44336;
          margin-bottom: 1rem;
          display: block;
        }

        h1 {
          margin: 0;
          color: #f44336;
        }
      }

      .error-content {
        text-align: center;
        padding: 1rem;

        p {
          margin: 0.5rem 0;
          color: var(--text-color-secondary);
          font-size: 1.1rem;
        }
      }

      .button-container {
        display: flex;
        justify-content: center;
      }
    `,
  ],
})
export class AccessDeniedComponent {}
