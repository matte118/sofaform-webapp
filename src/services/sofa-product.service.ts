import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, from, of, switchMap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { RealtimeDbService } from './realtime-db.service';
import { PhotoUploadService } from './upload.service';
import { SofaProduct } from '../models/sofa-product.model';

@Injectable({
  providedIn: 'root',
})
export class SofaProductService {
  private isBrowser: boolean;

  constructor(
    private dbService: RealtimeDbService,
    private uploadService: PhotoUploadService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  addSofaProduct(product: SofaProduct): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.addSofaProduct(product));
  }

  createProduct(product: SofaProduct): Observable<string> {
    if (!this.isBrowser) {
      return of('');
    }
    return from(this.dbService.createProduct(product));
  }

  updateProductVariants(
    productId: string,
    variantIds: string[]
  ): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.updateProductVariants(productId, variantIds));
  }

  getSofaProducts(): Observable<SofaProduct[]> {
    return new Observable((observer) => {
      this.dbService.getSofaProducts((products) => {
        const mappedProducts = products.map((p) => {
          console.log('Raw product data from DB:', p);
          const sofaProduct = new SofaProduct(
            p.id,
            p.data.name,
            p.data.description || '',
            p.data.variants || [],
            p.data.photoUrl || '',
            p.data.seduta || '',
            p.data.schienale || '',
            p.data.meccanica || '',
            p.data.materasso || '',
            p.data.materassiExtra || [],
            p.data.deliveryPrice ?? 0,
            p.data.ricarico ?? 30
          );
          console.log('Mapped SofaProduct:', sofaProduct);
          return sofaProduct;
        });
        console.log('SofaProductService: Mapped products', mappedProducts);
        observer.next(mappedProducts);
      });
    });
  }

  updateSofaProduct(id: string, product: SofaProduct): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }
    return from(this.dbService.updateSofaProduct(id, product));
  }

  updateProduct(id: string, product: SofaProduct): Observable<void> {
    return this.updateSofaProduct(id, product);
  }

  deleteSofaProduct(id: string): Observable<void> {
    if (!this.isBrowser) {
      return of(void 0);
    }

    return new Observable((observer) => {
      // First get the product to check if it has an image
      this.dbService.getSofaProducts((products) => {
        const product = products.find((p) => p.id === id);

        if (product?.data.photoUrl) {
          // Delete the image first, then delete the product
          this.uploadService.deleteImage(product.data.photoUrl).subscribe({
            next: () => {
              // Image deleted successfully, now delete the product
              from(this.dbService.deleteSofaProduct(id)).subscribe({
                next: () => {
                  observer.next();
                  observer.complete();
                },
                error: (error) => observer.error(error),
              });
            },
            error: (imageError) => {
              // Even if image deletion fails, still delete the product
              console.warn('Failed to delete product image:', imageError);
              from(this.dbService.deleteSofaProduct(id)).subscribe({
                next: () => {
                  observer.next();
                  observer.complete();
                },
                error: (error) => observer.error(error),
              });
            },
          });
        } else {
          // No image to delete, just delete the product
          from(this.dbService.deleteSofaProduct(id)).subscribe({
            next: () => {
              observer.next();
              observer.complete();
            },
            error: (error) => observer.error(error),
          });
        }
      });
    });
  }
}
