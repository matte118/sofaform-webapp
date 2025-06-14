import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PanelModule } from 'primeng/panel';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { ComponentModel } from '../../../models/component.model';
import { ComponentService } from '../../../services/component.service';
import { Category } from '../../../models/component-category.model';

interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

@Component({
  selector: 'app-gestione-componenti',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ConfirmDialogModule,
    PanelModule,
    AutoCompleteModule
  ],
  providers: [ConfirmationService],
  templateUrl: './gestione-componenti.component.html',
  styleUrl: './gestione-componenti.component.scss'
})
export class GestioneComponentiComponent implements OnInit {
  components: ComponentModel[] = [];
  newComponent = new ComponentModel({
    nome: '',
    prezzo: 0,
    fornitore: '',
    quantita: 1,
    categoria: Category.Bedroom
  });

  editingComponent?: ComponentModel;
  originalEditingComponent?: ComponentModel; // Add this to track original

  categoryOptions = Object.entries(Category).map(([label, value]) => ({
    label,
    value
  }));

  priceRanges: PriceRange[] = [
    { label: 'Fino a 50€', min: 0, max: 50 },
    { label: '50€ - 100€', min: 50, max: 100 },
    { label: '100€ - 200€', min: 100, max: 200 },
    { label: '200€ - 500€', min: 200, max: 500 },
    { label: 'Oltre 500€', min: 500, max: null }
  ];

  searchFilters = {
    nome: '',
    priceRange: null as PriceRange | null,
    fornitore: '',
    categoria: null as Category | null
  };

  filtersExpanded = false;  // Add this property

  supplierSuggestions: string[] = [];

  constructor(
    private componentService: ComponentService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.componentService.getComponents().subscribe(components => {
      this.components = components;
    });
  }

  saveComponent() {
    if (this.editingComponent && this.originalEditingComponent) {
      this.componentService.updateComponentByOriginal(this.originalEditingComponent, this.newComponent);
    } else {
      this.componentService.addComponent(this.newComponent);
    }
    this.resetForm();
  }

  editComponent(component: ComponentModel) {
    this.editingComponent = component;
    this.originalEditingComponent = { ...component }; // Store original reference
    this.newComponent = new ComponentModel({ ...component });
  }

  deleteComponent(component: ComponentModel) {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questo componente?',
      accept: () => {
        this.componentService.deleteComponent(component.nome, component.categoria);
      }
    });
  }

  resetForm() {
    this.editingComponent = undefined;
    this.originalEditingComponent = undefined; // Reset original reference
    this.newComponent = new ComponentModel({
      nome: '',
      prezzo: 0,
      fornitore: '',
      quantita: 1,
      categoria: Category.Bedroom
    });
  }

  get filteredComponents(): ComponentModel[] {
    return this.components.filter(comp => {
      const matchesNome = this.searchFilters.nome ?
        comp.nome.toLowerCase().includes(this.searchFilters.nome.toLowerCase()) : true;

      const matchesPriceRange = this.searchFilters.priceRange ?
        comp.prezzo >= this.searchFilters.priceRange.min &&
        (this.searchFilters.priceRange.max === null ||
          comp.prezzo <= this.searchFilters.priceRange.max) : true;

      const matchesFornitore = this.searchFilters.fornitore ?
        comp.fornitore.toLowerCase().includes(this.searchFilters.fornitore.toLowerCase()) : true;

      const matchesCategoria = this.searchFilters.categoria ?
        comp.categoria === this.searchFilters.categoria : true;

      return matchesNome && matchesPriceRange && matchesFornitore && matchesCategoria;
    });
  }

  clearFilters() {
    this.searchFilters = {
      nome: '',
      priceRange: null,
      fornitore: '',
      categoria: null
    };
  }

  suggestSuppliers(event: { query: string }) {
    const query = event.query.toLowerCase();
    // Get unique suppliers from existing components
    const allSuppliers = [...new Set(this.components.map(c => c.fornitore))];
    this.supplierSuggestions = allSuppliers.filter(supplier =>
      supplier.toLowerCase().includes(query)
    );
  }
}
