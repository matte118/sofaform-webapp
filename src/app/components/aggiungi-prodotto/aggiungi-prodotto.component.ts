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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';

import { SofaProduct } from '../../../models/sofa-product.model';
import { Variant } from '../../../models/variant.model';
import { Component as ComponentModel } from '../../../models/component.model';
import { Supplier } from '../../../models/supplier.model';
import { ComponentType } from '../../../models/component-type.model';
import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { ComponentService } from '../../../services/component.service';
import { SupplierService } from '../../../services/supplier.service';
import { PhotoUploadService } from '../../../services/upload.service';
import { FileUploadEvent, FileUploadModule } from 'primeng/fileupload';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

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
    DialogModule,
    FileUploadModule,
    HttpClientModule,
    ProgressSpinnerModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './aggiungi-prodotto.component.html',
  styleUrls: ['./aggiungi-prodotto.component.scss'],
})
export class AggiungiProdottoComponent implements OnInit {
  steps: MenuItem[] = [
    { label: 'Informazioni Prodotto' },
    { label: 'Varianti' },
    { label: 'Componenti' },
  ];

  currentStep = 0;

  value1 = 1; // Cambiato da 0 a 1 per inizializzare con il valore minimo

  // Product basic information
  newSofaProduct = new SofaProduct('', '', '');

  // Variants management
  variants: Variant[] = [];
  newVariant: Variant = new Variant('', '', '', 0);
  selectedVariant?: Variant;
  editingVariantIndex: number = -1;

  // Components management
  availableComponents: ComponentModel[] = [];
  selectedComponent?: ComponentModel;
  newComponent: ComponentModel = new ComponentModel('', '', 0, [], undefined);
  editingComponentIndex: number = -1;

  // Suppliers
  availableSuppliers: Supplier[] = [];
  selectedSuppliers: Supplier[] = [];

  // Component types
  componentTypes: ComponentType[] = [];
  selectedComponentType?: ComponentType; // Single component type

  // Markup and pricing
  markupPercentage: number = 30; // Default markup
  finalPrices: Map<string, number> = new Map(); // Variant ID to final price

  // Supplier dialog
  showAddSupplierDialog = false;
  newSupplier: Supplier = new Supplier('', '', '');

  // Image upload properties
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading: boolean = false;
  uploadComplete: boolean = false;

  // Save product loading properties
  isSavingProduct: boolean = false;
  saveProgress: string = '';

  // Dialogs visibility
  showSedutaDialog = false;
  showSchienaleDialog = false;
  showMeccanicaDialog = false;
  showMaterassoDialog = false;

  // Add form state tracking
  formSubmitted: boolean = false;
  formValid: boolean = true;
  variantFormSubmitted: boolean = false;
  variantFormValid: boolean = true;
  componentFormSubmitted: boolean = false;
  componentFormValid: boolean = true;

  isBrowser: boolean;

  // Add a map to track component quantities
  componentQuantities: Map<string, number> = new Map();

  constructor(
    private sofaProductService: SofaProductService,
    private variantService: VariantService,
    private componentService: ComponentService,
    private supplierService: SupplierService,
    private uploadService: PhotoUploadService,
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
    this.componentService.getComponents().subscribe((components) => {
      this.availableComponents = components;
    });

    this.supplierService.getSuppliers().subscribe((suppliers) => {
      this.availableSuppliers = suppliers;
    });
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      if (!this.validateCurrentStep()) {
        return;
      }
      if (this.currentStep === 3) {
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
            detail: 'Inserisci il nome del prodotto',
          });
          return false;
        }

        // Se un'immagine è in caricamento, impedisci l'avanzamento
        if (this.isUploading) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Attendere',
            detail: "Attendere il completamento del caricamento dell'immagine",
          });
          return false;
        }

        return true;

      case 1: // Variants
        if (this.variants.length === 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Aggiungi almeno una variante',
          });
          return false;
        }
        return true;

      case 2: // Components
        let allVariantsHaveComponents = true;
        this.variants.forEach((variant) => {
          if (variant.components.length === 0) {
            allVariantsHaveComponents = false;
          }
        });

        if (!allVariantsHaveComponents) {
          this.messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: 'Ogni variante deve avere almeno un componente',
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
    this.variantFormSubmitted = true;
    if (!this.newVariant.longName.trim()) {
      this.variantFormValid = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Completa tutti i campi obbligatori',
      });
      return;
    }
    this.variantFormValid = true;

    const variant = new Variant(
      '', // ID will be generated by Firebase
      this.newSofaProduct.id || '', // Will be updated when sofa is saved
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

    // Reset form
    this.newVariant = new Variant('', '', '', 0);
    this.variantFormSubmitted = false;
    this.variantFormValid = true;
  }

  editVariant(index: number): void {
    this.editingVariantIndex = index;
    const variant = this.variants[index];
    this.newVariant = new Variant(
      variant.id,
      variant.sofaId,
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
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-danger',
      accept: () => {
        const removedVariant = this.variants.splice(index, 1)[0];

        if (this.editingVariantIndex === index) {
          this.editingVariantIndex = -1;
          this.newVariant = new Variant('', '', '', 0);
        }
      },
    });
  }

  // Component management
  selectVariantForComponents(variant: Variant): void {
    this.selectedVariant = variant;

    // Reset and rebuild the component quantities map for this variant
    this.componentQuantities.clear();

    // Group components by ID or name and count them
    const componentCounts = new Map<string, number>();
    variant.components.forEach(comp => {
      const key = comp.id || comp.name;
      componentCounts.set(key, (componentCounts.get(key) || 0) + 1);
    });

    // Store unique components with their counts
    const uniqueComponents = new Map<string, ComponentModel>();
    variant.components.forEach(comp => {
      const key = comp.id || comp.name;
      if (!uniqueComponents.has(key)) {
        uniqueComponents.set(key, comp);
        // Set the quantity in our tracking map
        this.componentQuantities.set(key, componentCounts.get(key) || 0);
      }
    });
  }

  // Update the addComponentToVariant method to handle quantities correctly
  addComponentToVariant(component: ComponentModel): void {
    if (!this.selectedVariant || !component) return;
    const qty = this.value1;

    // Aggiungi `qty` volte lo stesso componente nell'array
    for (let i = 0; i < qty; i++) {
      this.selectedVariant.components.push(component);
    }

    // Aggiorna il prezzo
    this.selectedVariant.updatePrice();

    this.messageService.add({
      severity: 'success',
      summary: 'Componente aggiunto',
      detail: `${component.name} ×${qty}`
    });

    // Reset quantità a 1
    this.value1 = 1;
  }

  get groupedComponents(): { component: ComponentModel; quantity: number }[] {
    if (!this.selectedVariant) {
      return [];
    }
    const map = new Map<string, { component: ComponentModel; quantity: number }>();

    for (const comp of this.selectedVariant.components) {
      const key = comp.id || comp.name;
      if (!map.has(key)) {
        map.set(key, { component: comp, quantity: 1 });
      } else {
        map.get(key)!.quantity++;
      }
    }

    return Array.from(map.values());
  }

  removeComponentGroup(component: ComponentModel): void {
    if (!this.selectedVariant) return;
    // Filtra fuori tutte le occorrenze
    this.selectedVariant.components = this.selectedVariant.components
      .filter(c => (c.id || c.name) !== (component.id || component.name));

    // Ricalcola prezzo
    this.selectedVariant.updatePrice();

    this.messageService.add({
      severity: 'info',
      summary: 'Componente rimosso',
      detail: `Tutte le istanze di ${component.name} sono state eliminate`
    });
  }

  // Update getComponentQuantity to use the quantity map
  getComponentQuantity(comp: ComponentModel): number {
    if (!this.selectedVariant) return 0;

    const componentKey = comp.id || comp.name;
    return this.componentQuantities.get(componentKey) || 0;
  }

  // Update the removeComponentFromVariant method to also clean up from the quantities map
  removeComponentFromVariant(variantIndex: number, componentIdentifier: string): void {
    if (!this.selectedVariant) return;

    const variant = this.variants[variantIndex];
    const component = variant.components.find(c =>
      c.id === componentIdentifier || c.name === componentIdentifier
    );

    if (component) {
      // Remove from components array
      variant.components = variant.components.filter(c =>
        (c.id && c.id !== componentIdentifier) ||
        (!c.id && c.name !== componentIdentifier)
      );

      // Remove from quantities map
      this.componentQuantities.delete(componentIdentifier);

      // Update variant price
      variant.updatePrice();

      // Show confirmation message
      this.messageService.add({
        severity: 'info',
        summary: 'Componente rimosso',
        detail: `${component.name} rimosso dalla variante`
      });
    }
  }

  // Create new component
  createComponent(): void {
    this.componentFormSubmitted = true;
    if (!this.newComponent.name.trim()) {
      this.componentFormValid = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Inserisci il nome del componente',
      });
      return;
    }
    this.componentFormValid = true;

    // Ensure selectedSuppliers is an array
    const suppliersList = Array.isArray(this.selectedSuppliers) ? this.selectedSuppliers : [];

    const component = new ComponentModel(
      '', // ID will be generated by Firebase
      this.newComponent.name,
      this.newComponent.price,
      suppliersList, // Ensure it's an array
      this.selectedComponentType?.id
    );

    if (this.editingComponentIndex >= 0) {
      // Update existing component
      this.componentService
        .updateComponent(component.id, component)
        .subscribe(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Successo',
            detail: 'Componente aggiornato',
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
          detail: 'Nuovo componente creato',
        });
        this.loadInitialData(); // Refresh components list
      });
    }

    // Reset form
    this.newComponent = new ComponentModel('', '', 0, [], undefined);
    this.selectedSuppliers = [];
    this.selectedComponentType = undefined;
    this.componentFormSubmitted = false;
    this.componentFormValid = true;
  }
  // Price calculations
  // Update calculateComponentCost to use the variant's own method
  calculateComponentCost(variant: Variant): number {
    return variant.calculatePriceFromComponents();
  }

  calculateFinalPrices(): void {
    this.finalPrices.clear();

    this.variants.forEach((variant) => {
      // Ensure variant price is up to date with its components
      variant.updatePrice();
      const componentCost = variant.price; // Use the calculated price directly

      // Apply markup: price = cost / ((100 - markup) / 100)
      const finalPrice = componentCost / ((100 - this.markupPercentage) / 100);
      this.finalPrices.set(
        variant.longName,
        Math.round(finalPrice * 100) / 100
      ); // Round to 2 decimals
    });
  }
  // Save complete product
  saveProduct(): void {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.isSavingProduct = true;
    this.saveProgress = 'Preparazione dati...';

    // First create the sofa product and get its ID
    this.sofaProductService.createProduct(this.newSofaProduct).subscribe(
      (productId) => {
        // Update the product ID
        this.newSofaProduct.id = productId;
        this.saveProgress = 'Prodotto creato, rinominando immagine...';

        // If we have an uploaded image, rename it with the product ID
        if (this.newSofaProduct.photoUrl && this.selectedFile) {
          this.uploadService.renameProductImage(this.newSofaProduct.photoUrl, productId, this.selectedFile).subscribe({
            next: (newUrl) => {
              this.newSofaProduct.photoUrl = newUrl;
              // Update the product with the new image URL
              this.sofaProductService.updateProduct(productId, this.newSofaProduct).subscribe(() => {
                this.saveProgress = 'Immagine aggiornata, creazione varianti...';
                this.createVariants(productId);
              });
            },
            error: (error) => {
              console.error('Error renaming image:', error);
              // Continue with variants creation even if image rename fails
              this.saveProgress = 'Creazione varianti...';
              this.createVariants(productId);
            }
          });
        } else {
          this.saveProgress = 'Creazione varianti...';
          this.createVariants(productId);
        }
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante il salvataggio del prodotto',
        });
        console.error('Error saving product:', error);
        this.isSavingProduct = false;
        this.saveProgress = '';
      }
    );
  }

  private createVariants(productId: string): void {
    // Create variants and collect their observables
    const variantObservables = this.variants.map((variant) => {
      // Update variant with final price and sofa ID
      variant.price = this.finalPrices.get(variant.longName) || 0;
      variant.sofaId = productId;

      return this.variantService.createVariant(variant);
    });

    // Wait for all variants to be created using forkJoin
    forkJoin(variantObservables).subscribe(
      (variantIds) => {
        this.saveProgress = 'Collegamento varianti al prodotto...';
        // Update the product with variant IDs
        this.sofaProductService
          .updateProductVariants(productId, variantIds)
          .subscribe(
            () => {
              this.saveProgress = 'Completamento...';
              this.messageService.add({
                severity: 'success',
                summary: 'Successo',
                detail: 'Prodotto salvato con successo',
              });

              // Small delay to show completion message
              setTimeout(() => {
                this.isSavingProduct = false;
                this.saveProgress = '';
                // Navigate to products list page
                this.router.navigate(['/prodotti']);
              }, 1000);
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Errore',
                detail: `Errore durante l'associazione delle varianti: ${error.message || 'Verifica la connessione'}`,
              });
              console.error('Error updating product variants:', error);
              this.isSavingProduct = false;
              this.saveProgress = '';

              // Offer retry option
              this.confirmationService.confirm({
                message: 'Vuoi riprovare ad associare le varianti al prodotto?',
                header: 'Riprova',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Sì, riprova',
                rejectLabel: 'No, torna alla lista prodotti',
                accept: () => {
                  // Retry updating product variants
                  this.isSavingProduct = true;
                  this.saveProgress = 'Riprovo collegamento varianti...';
                  this.sofaProductService
                    .updateProductVariants(productId, variantIds)
                    .subscribe(
                      () => {
                        this.messageService.add({
                          severity: 'success',
                          summary: 'Successo',
                          detail: 'Prodotto salvato con successo',
                        });
                        this.isSavingProduct = false;
                        this.saveProgress = '';
                        this.router.navigate(['/prodotti']);
                      },
                      (error) => {
                        this.messageService.add({
                          severity: 'error',
                          summary: 'Errore',
                          detail: 'Errore persistente, prova più tardi',
                        });
                        this.isSavingProduct = false;
                        this.saveProgress = '';
                      }
                    );
                },
                reject: () => {
                  // Navigate to products list even if save was incomplete
                  this.router.navigate(['/prodotti']);
                }
              });
            }
          );
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: `Errore durante la creazione delle varianti: ${error.message || 'Controlla i dati inseriti'}`,
        });
        console.error('Error creating variants:', error);
        this.isSavingProduct = false;
        this.saveProgress = '';

        // Offer option to navigate away or try again
        this.confirmationService.confirm({
          message: 'Le varianti non sono state create correttamente. Vuoi riprovare?',
          header: 'Errore Salvataggio',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Riprova',
          rejectLabel: 'Torna alla lista prodotti',
          accept: () => {
            // Retry variant creation
            this.createVariants(productId);
          },
          reject: () => {
            // Navigate to products list
            this.router.navigate(['/prodotti']);
          }
        });
      }
    );
  }

  // Image upload methods
  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Carica immediatamente l'immagine
      this.uploadImageImmediately(file);
    }
  }

  private uploadImageImmediately(file: File): void {
    // Genera un ID temporaneo per il prodotto se non esiste
    const tempProductId = this.newSofaProduct.id || `temp_${Date.now()}`;

    this.isUploading = true;
    this.uploadComplete = false;

    this.uploadService.uploadProductImage(file, tempProductId).subscribe({
      next: (result) => {
        // Se abbiamo ricevuto l'URL di download, l'upload è completato
        if (result.downloadURL) {
          this.newSofaProduct.photoUrl = result.downloadURL;
          this.uploadComplete = true;
          this.isUploading = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Successo',
            detail: 'Immagine caricata con successo',
          });
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.uploadComplete = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: "Errore durante il caricamento dell'immagine",
        });
        console.error('Error uploading image:', error);
      },
    });
  }

  removeImage(): void {
    // Se l'immagine è già stata caricata, eliminala da Firebase Storage
    if (this.newSofaProduct.photoUrl) {
      this.uploadService.deleteImage(this.newSofaProduct.photoUrl).subscribe({
        next: () => {
          console.log('Image deleted from Firebase Storage');
        },
        error: (error) => {
          console.error('Error deleting image:', error);
        },
      });
    }

    this.selectedFile = null;
    this.imagePreview = null;
    this.newSofaProduct.photoUrl = '';
    this.isUploading = false;
    this.uploadComplete = false;
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
        detail: 'Il nome del fornitore è obbligatorio',
      });
      return;
    }

    this.supplierService.addSupplier(this.newSupplier).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Successo',
          detail: 'Fornitore aggiunto con successo',
        });

        // Reload suppliers and add the new one to the selected list
        this.supplierService.getSuppliers().subscribe((suppliers) => {
          this.availableSuppliers = suppliers;

          // Find the newly added supplier (it should be the one with the same name)
          const addedSupplier = suppliers.find(
            (s) => s.name === this.newSupplier.name
          );
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
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Errore durante il salvataggio del fornitore',
        });
        console.error('Error saving supplier:', error);
      }
    );
  }

  // Handle file upload from p-fileUpload component
  async onUpload(event: any) {
    // This method can be used for alternative upload handling if needed
    console.log('Upload event:', event);
  }

  // Add methods to check field errors
  shouldShowProductFieldError(fieldValue: any): boolean {
    return this.formSubmitted && !this.formValid && !fieldValue?.trim();
  }

  shouldShowVariantFieldError(fieldValue: any): boolean {
    return this.variantFormSubmitted && !this.variantFormValid && !fieldValue?.trim();
  }

  shouldShowComponentFieldError(fieldValue: any): boolean {
    return this.componentFormSubmitted && !this.componentFormValid && !fieldValue?.trim();
  }
}


