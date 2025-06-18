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

interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

interface Fabric {
  nome: string;
  prezzoAlMetro: number;
}

@Component({
  selector: 'app-gestione-tessuti',
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
    PanelModule
  ],
  providers: [ConfirmationService],
  templateUrl: './gestione-tessuti.component.html',
  styleUrl: './gestione-tessuti.component.scss'
})
export class GestioneTessutiComponent implements OnInit {
  fabrics: Fabric[] = [];
  newFabric: Fabric = {
    nome: '',
    prezzoAlMetro: 0
  };

  editingFabric?: Fabric;

  priceRanges: PriceRange[] = [
    { label: 'Fino a 10€/m', min: 0, max: 10 },
    { label: '10€ - 25€/m', min: 10, max: 25 },
    { label: '25€ - 50€/m', min: 25, max: 50 },
    { label: '50€ - 100€/m', min: 50, max: 100 },
    { label: 'Oltre 100€/m', min: 100, max: null }
  ];

  searchFilters = {
    nome: '',
    priceRange: null as PriceRange | null
  };

  filtersExpanded = false;

  constructor(private confirmationService: ConfirmationService) { }

  ngOnInit() {
    // Initialize with sample data or load from service
  }

  saveFabric() {
    if (this.editingFabric) {
      // Update existing fabric logic
      const index = this.fabrics.findIndex(f => f === this.editingFabric);
      if (index !== -1) {
        this.fabrics[index] = { ...this.newFabric };
      }
    } else {
      // Add new fabric
      this.fabrics.push({ ...this.newFabric });
    }
    this.resetForm();
  }

  editFabric(fabric: Fabric) {
    this.editingFabric = fabric;
    this.newFabric = { ...fabric };
  }

  deleteFabric(fabric: Fabric) {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questo tessuto?',
      accept: () => {
        const index = this.fabrics.findIndex(f => f === fabric);
        if (index !== -1) {
          this.fabrics.splice(index, 1);
        }
      }
    });
  }

  resetForm() {
    this.editingFabric = undefined;
    this.newFabric = {
      nome: '',
      prezzoAlMetro: 0
    };
  }

  get filteredFabrics(): Fabric[] {
    return this.fabrics.filter(fabric => {
      const matchesNome = this.searchFilters.nome ?
        fabric.nome.toLowerCase().includes(this.searchFilters.nome.toLowerCase()) : true;

      const matchesPriceRange = this.searchFilters.priceRange ?
        fabric.prezzoAlMetro >= this.searchFilters.priceRange.min &&
        (this.searchFilters.priceRange.max === null ||
          fabric.prezzoAlMetro <= this.searchFilters.priceRange.max) : true;

      return matchesNome && matchesPriceRange;
    });
  }

  clearFilters() {
    this.searchFilters = {
      nome: '',
      priceRange: null
    };
  }
}
