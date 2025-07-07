import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserRole } from '../models/user-role.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PanelMenuModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  title = 'sofaform-webapp';
  items: MenuItem[] = [];
  isLoggedIn = false;
  userEmail: string | null = null;
  userRole: UserRole | null = null;
  isLoggingOut = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Listen for authentication state changes
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.userEmail = user?.email || null;
      this.cdr.detectChanges();
    });

    // Listen for role changes
    this.authService.getUserRole().subscribe((role) => {
      this.userRole = role;
      this.setupMenuItems();
      this.cdr.detectChanges();
    });
  }

  setupMenuItems() {
    // Basic menu items for all users
    this.items = [
      { label: 'Home', icon: 'pi pi-home', routerLink: '/home' },
      {
        label: 'Aggiungi Prodotto',
        icon: 'pi pi-plus',
        routerLink: '/aggiungi-prodotto',
      },
      {
        label: 'Gestione Componenti',
        icon: 'pi pi-th-large',
        routerLink: '/gestione-componenti',
      },
      {
        label: 'Gestione Fornitori',
        icon: 'pi pi-briefcase',
        routerLink: '/gestione-fornitori',
      },
      {
        label: 'Gestione Tessuti',
        icon: 'pi pi-palette',
        routerLink: '/gestione-tessuti',
      },
    ];

    // Add user management for managers and founders
    const shouldShowUserManagement =
      this.userRole === UserRole.MANAGER || this.userRole === UserRole.FOUNDER;

    if (shouldShowUserManagement) {
      this.items.push({
        label: 'Gestione Utenti',
        icon: 'pi pi-users',
        routerLink: '/gestione-utenti',
      });
    }
  }

  logout() {
    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        // Navigation is handled by auth service
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Si è verificato un errore durante la disconnessione',
        });
        this.isLoggingOut = false;
        this.cdr.detectChanges();
      },
    });
  }

  getRoleLabel(): string {
    switch (this.userRole) {
      case UserRole.FOUNDER:
        return 'Fondatore';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.OPERATOR:
        return 'Operatore';
      default:
        return 'Utente';
    }
  }
}
