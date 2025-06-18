import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { StepsModule } from 'primeng/steps';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { SofaProduct } from '../../../models/sofa-product.model';
import { Variant } from '../../../models/variant.model';
import { Component as ComponentModel } from '../../../models/component.model';
import { Supplier } from '../../../models/supplier.model';
import { ComponentType } from '../../../models/component-type.model';
import { Rivestimento } from '../../../models/rivestimento.model';
import { RivestimentoType } from '../../../models/rivestimento-type.model';

import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { ComponentService } from '../../../services/component.service';
import { SupplierService } from '../../../services/supplier.service';
import { RivestimentoService } from '../../../services/rivestimento.service';
import { Router } from '@angular/router';

interface LanguageFields {
  it: string;
  en: string;
  fr: string;
}

@Component({
  selector: 'app-aggiungi-prodotto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    StepsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    DividerModule,
    TableModule, 
    FloatLabelModule,
    ConfirmDialogModule,
    DropdownModule,
    InputTextareaModule,
    ToastModule,
    DialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './aggiungi-prodotto.component.html',
  styleUrls: ['./aggiungi-prodotto.component.scss']
})
export class AggiungiProdottoComponent implements OnInit {
  steps: MenuItem[] = [
    { label: 'Informazioni Prodotto' },
    { label: 'Varianti' },
    { label: 'Componenti' },
    { label: 'Rivestimento' },
    { label: 'Ricarico e Prezzi' },
    { label: 'Traduzione e Conferma' }
  ];
  
  currentStep = 0;

  // Product basic information
  newSofaProduct = new SofaProduct('', '', '');
  
  // Variants management
  variants: Variant[] = [];
  newVariant: Variant = new Variant('', '', '', '', 0);
  selectedVariant?: Variant;
  editingVariantIndex: number = -1;
  
  // Components management
  availableComponents: ComponentModel[] = [];
  selectedComponent?: ComponentModel;
  newComponent: ComponentModel = new ComponentModel('', '', 0, [], []);
  editingComponentIndex: number = -1;
  
  // Suppliers
  availableSuppliers: Supplier[] = [];
  selectedSuppliers: Supplier[] = [];
  
  // Component types
  componentTypes: ComponentType[] = [];
  selectedComponentTypes: ComponentType[] = [];
  
  // Rivestimento (upholstery)
  availableRivestimenti: Rivestimento[] = [];
  selectedRivestimento?: Rivestimento;
  metersOfRivestimento: number = 0;
  
  // Markup and pricing
  markupPercentage: number = 30; // Default markup
  finalPrices: Map<string, number> = new Map(); // Variant ID to final price
  
  // Translations
  nameTranslations: LanguageFields = { it: '', en: '', fr: '' };
  descriptionTranslations: LanguageFields = { it: '', en: '', fr: '' };
  variantTranslations: Map<string, LanguageFields> = new Map(); // Variant ID to translations
  
  rivestimentoTypes = Object.values(RivestimentoType);

  // Supplier dialog
  showAddSupplierDialog = false;
  newSupplier: Supplier = new Supplier('', '', '');

  isBrowser: boolean;

  constructor(
    private sofaProductService: SofaProductService,
    private variantService: VariantService,
    private componentService: ComponentService,
    private supplierService: SupplierService,
    private rivestimentoService: RivestimentoService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // Only load data on the browser
    if (this.isBrowser) {
      this.loadInitialData();
    }
  }

  loadInitialData() {
    // Load components
    this.componentService.getComponents().subscribe(components => {
      this.availableComponents = components;
    });
    
    // Load suppliers
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.availableSuppliers = suppliers;
    });
    
    // Load rivestimenti
    this.rivestimentoService.getRivestimenti().subscribe(rivestimenti => {
      this.availableRivestimenti = rivestimenti;
    });
  }

  // Navigation methods
  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      // Validation for each step
      if (!this.validateCurrentStep()) {
        return;
      }
      
      // Special actions for specific steps
      if (this.currentStep === 4) { // Before going to final step
        this.calculateFinalPrices();
      }
      
      this.currentStep++;
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 0: // Product info
        if (!this.newSofaProduct.name.trim()) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Inserisci il nome del prodotto'
          });
          return false;
        }
        return true;
        
      case 1: // Variants
        if (this.variants.length === 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Aggiungi almeno una variante'
          });
          return false;
        }
        return true;
        
      case 2: // Components
        let allVariantsHaveComponents = true;
        this.variants.forEach(variant => {
          if (variant.components.length === 0) {
            allVariantsHaveComponents = false;
          }
        });
        
        if (!allVariantsHaveComponents) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Ogni variante deve avere almeno un componente'
          });
          return false;
        }
        return true;
        
      case 3: // Rivestimento
        if (!this.selectedRivestimento) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Seleziona un rivestimento'
          });
          return false;
        }
        if (this.metersOfRivestimento <= 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Inserisci la quantità di metri di rivestimento'
          });
          return false;
        }
        return true;
        
      case 4: // Markup
        if (this.markupPercentage <= 0 || this.markupPercentage >= 100) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Il ricarico deve essere tra 1% e 99%'
          });
          return false;
        }
        return true;
        
      case 5: // Translations
        if (!this.nameTranslations.it.trim() || 
            !this.nameTranslations.en.trim() || 
            !this.nameTranslations.fr.trim()) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Completa tutte le traduzioni del nome'
          });
          return false;
        }
        return true;
        
      default:
        return true;
    }
  }

  // Variant management
  addVariant(): void {
    if (!this.newVariant.code.trim() || !this.newVariant.longName.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Completa tutti i campi obbligatori'
      });
      return;
    }
    
    const variant = new Variant(
      '', // ID will be generated by Firebase
      this.newSofaProduct.id || '', // Will be updated when sofa is saved
      this.newVariant.code,
      this.newVariant.longName,
      this.newVariant.price,
      [], // Components will be added later
      this.newVariant.seatsCount,
      this.newVariant.mattressWidth
    );
    
    if (this.editingVariantIndex >= 0) {
      this.variants[this.editingVariantIndex] = variant;
      this.editingVariantIndex = -1;
    } else {
      this.variants.push(variant);
    }
    
    // Initialize translations for this variant
    this.variantTranslations.set(variant.code, { it: '', en: '', fr: '' });
    
    // Reset form
    this.newVariant = new Variant('', '', '', '', 0);
  }

  editVariant(index: number): void {
    this.editingVariantIndex = index;
    const variant = this.variants[index];
    this.newVariant = new Variant(
      variant.id,
      variant.sofaId,
      variant.code,
      variant.longName,
      variant.price,
      variant.components,
      variant.seatsCount,
      variant.mattressWidth
    );
  }

  deleteVariant(index: number): void {
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare questa variante?',
      accept: () => {
        const removedVariant = this.variants.splice(index, 1)[0];
        this.variantTranslations.delete(removedVariant.code);
        
        if (this.editingVariantIndex === index) {
          this.editingVariantIndex = -1;
          this.newVariant = new Variant('', '', '', '', 0);
        }
      }
    });
  }

  // Component management
  selectVariantForComponents(variant: Variant): void {
    this.selectedVariant = variant;
  }

  addComponentToVariant(component: ComponentModel): void {
    if (!this.selectedVariant) return;
    
    const existingIndex = this.selectedVariant.components.findIndex(c => c.id === component.id);
    
    if (existingIndex >= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attenzione',
        detail: 'Componente già presente nella variante'
      });
      return;
    }
    
    this.selectedVariant.components.push(component);
  }

  removeComponentFromVariant(variantIndex: number, componentIndex: number): void {
    this.variants[variantIndex].components.splice(componentIndex, 1);
  }

  // Create new component
  createComponent(): void {
    if (!this.newComponent.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Inserisci il nome del componente'
      });
      return;
    }
    
    const component = new ComponentModel(
      '', // ID will be generated by Firebase
      this.newComponent.name,
      this.newComponent.price,
      this.selectedSuppliers,
      this.selectedComponentTypes
    );
    
    if (this.editingComponentIndex >= 0) {
      // Update existing component
      this.componentService.updateComponent(component.id, component).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Componente aggiornato'
        });
        this.loadInitialData(); // Refresh components list
        this.editingComponentIndex = -1;
      });
    } else {
      // Create new component
      this.componentService.addComponent(component).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Nuovo componente creato'
        });
        this.loadInitialData(); // Refresh components list
      });
    }
    
    // Reset form
    this.newComponent = new ComponentModel('', '', 0, [], []);
    this.selectedSuppliers = [];
    this.selectedComponentTypes = [];
  }

  // Rivestimento management
  selectRivestimento(rivestimento: Rivestimento): void {
    this.selectedRivestimento = rivestimento;
  }

  // Price calculations
  calculateComponentCost(variant: Variant): number {
    return variant.components.reduce((sum, component) => sum + component.price, 0);
  }

  calculateRivestimentoCost(): number {
    if (!this.selectedRivestimento) return 0;
    return this.selectedRivestimento.mtPrice * this.metersOfRivestimento;
  }

  calculateFinalPrices(): void {
    this.finalPrices.clear();
    
    this.variants.forEach(variant => {
      const componentCost = this.calculateComponentCost(variant);
      const rivestimentoCost = this.calculateRivestimentoCost();
      const totalCost = componentCost + rivestimentoCost;
      
      // Apply markup: price = cost / ((100 - markup) / 100)
      const finalPrice = totalCost / ((100 - this.markupPercentage) / 100);
      this.finalPrices.set(variant.code, Math.round(finalPrice * 100) / 100); // Round to 2 decimals
    });
  }

  // Save complete product
  saveProduct(): void {
    if (!this.validateCurrentStep()) {
      return;
    }
    
    // Update sofa product with translations
    this.newSofaProduct.name = this.nameTranslations.it; // Primary language
    this.newSofaProduct.description = this.descriptionTranslations.it; // Primary language
    
    // First save the sofa product
    this.sofaProductService.addSofaProduct(this.newSofaProduct).subscribe(
      () => {
        // Then save each variant
        const saveVariantPromises = this.variants.map(variant => {
          // Update variant with final price
          variant.price = this.finalPrices.get(variant.code) || 0;
          // Update sofaId with the newly created sofa
          variant.sofaId = this.newSofaProduct.id;
          
          return this.variantService.addVariant(variant);
        });
        
        // Wait for all variants to be saved
        Promise.all(saveVariantPromises).then(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Successo',
            detail: 'Prodotto salvato con successo'
          });
          
          // Navigate to products list
          setTimeout(() => {
            this.router.navigate(['/prodotti']);
          }, 2000);
        });
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante il salvataggio del prodotto'
        });
        console.error('Error saving product:', error);
      }
    );
  }

  // Supplier management
  openAddSupplierDialog(): void {
    this.newSupplier = new Supplier('', '', '');
    this.showAddSupplierDialog = true;
  }
  
  cancelAddSupplier(): void {
    this.showAddSupplierDialog = false;
  }
  
  saveSupplier(): void {
    if (!this.newSupplier.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Il nome del fornitore è obbligatorio'
      });
      return;
    }
    
    this.supplierService.addSupplier(this.newSupplier).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Fornitore aggiunto con successo'
        });
        
        // Reload suppliers and add the new one to the selected list
        this.supplierService.getSuppliers().subscribe(suppliers => {
          this.availableSuppliers = suppliers;
          
          // Find the newly added supplier (it should be the one with the same name)
          const addedSupplier = suppliers.find(s => s.name === this.newSupplier.name);
          if (addedSupplier) {
            // Add to selected suppliers if any
            if (!this.selectedSuppliers) {
              this.selectedSuppliers = [];
            }
            this.selectedSuppliers.push(addedSupplier);
          }
        });
        
        this.showAddSupplierDialog = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante il salvataggio del fornitore'
        });
        console.error('Error saving supplier:', error);
      }
    );
  }
}
