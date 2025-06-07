import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="sidebar">
      <ul>
        <li><a (click)="navigateTo('home')">Home</a></li>
        <li><a (click)="navigateTo('aggiungi-prodotto')">Aggiungi Prodotto</a></li>
      </ul>
    </nav>
  `
})
export class NavbarComponent {
  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
