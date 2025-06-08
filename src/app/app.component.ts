import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule }     from '@angular/router';
import { PanelMenuModule }  from 'primeng/panelmenu';
import { MenuItem }         from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,       // per routerLink e router-outlet
    PanelMenuModule     // per il sidebar menu
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  items!: MenuItem[];

  ngOnInit() {
    this.items = [
      { label: 'Home', icon: 'pi pi-home', routerLink: '/home' },
      { label: 'Aggiungi Prodotto', icon: 'pi pi-plus', routerLink: '/aggiungi-prodotto' },
      { label: 'Gestione Componenti', icon: 'pi pi-cog', routerLink: '/gestione-componenti' }
    ];
  }
}
