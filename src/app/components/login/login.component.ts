import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { take } from 'rxjs/operators';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    MessagesModule,
    MessageModule,
    ToastModule,
    DividerModule,
    RippleModule,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  isLoggingIn: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Check if user is already authenticated
    
    this.authService
      .isAuthenticated()
      .pipe(take(1)) // Take only the first emission
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          // User is already authenticated, redirect to home
          this.router.navigate(['/home']);
        }
      });
  }

  login() {
    this.errorMessage = '';
    this.isLoggingIn = true;

    if (!this.email || !this.password) {
      this.errorMessage = 'Inserisci email e password';
      this.isLoggingIn = false;
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoggingIn = false;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoggingIn = false;
        console.error('Login error:', error);

        // Handle specific Firebase auth error codes
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            this.errorMessage = 'Email o password non validi';
            break;
          case 'auth/too-many-requests':
            this.errorMessage = 'Troppi tentativi falliti. Riprova più tardi';
            break;
          default:
            this.errorMessage = "Si è verificato un errore durante l'accesso";
            break;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Errore di accesso',
          detail: this.errorMessage,
        });
      },
    });
  }
}
