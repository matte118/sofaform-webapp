// src/app/services/upload.service.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PhotoUploadService {
  private storage: FirebaseStorage | null = null;
  private isBrowser: boolean;

  constructor(
    private app: FirebaseApp,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Inizializza Firebase Storage SOLO se siamo in ambiente browser
    if (this.isBrowser) {
      this.storage = getStorage(this.app);
    }
  }

  /**
   * Carica il file su Firebase Storage, emettendo sia il progresso (0–100)
   * sia, al termine, l’URL di download.
   *
   * @param file      Il file da caricare
   * @param productId L’ID del prodotto (per organizzare le cartelle)
   */
  uploadProductImage(
    file: File,
    productId: string
  ): Observable<{ progress: number; downloadURL?: string }> {
    if (!this.isBrowser || !this.storage) {
      throw new Error('Firebase Storage non disponibile (SSR o non-browser)');
    }

    const timestamp = Date.now();
    const filePath = `products/${productId}/${timestamp}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const task = uploadBytesResumable(storageRef, file);

    return new Observable((observer) => {
      task.on(
        'state_changed',
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({ progress: Math.round(prog) });
        },
        (error) => observer.error(error),
        () => {
          getDownloadURL(storageRef)
            .then((url) => {
              observer.next({ progress: 100, downloadURL: url });
              observer.complete();
            })
            .catch((err) => observer.error(err));
        }
      );
    });
  }

  /**
   * Elimina un’immagine dato il suo URL pubblico (https://…)
   * oppure un URI gs://… Se passi l’URL completo,
   * `ref()` lo risolve automaticamente.
   *
   * @param imageUrl URL completo o URI gs://
   */
  deleteImage(imageUrl: string): Observable<void> {
    if (!this.isBrowser || !this.storage) {
      throw new Error('Firebase Storage non disponibile (SSR o non-browser)');
    }

    const storageRef = ref(this.storage, imageUrl);
    return new Observable((observer) => {
      deleteObject(storageRef)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  /**
   * Ottiene l'URL dell'immagine del prodotto se esiste
   * @param product Il prodotto di cui ottenere l'immagine
   */
  getProductImageUrl(product: any): string | null {
    return product.photoUrl || null;
  }

  /**
   * Verifica se un prodotto ha un'immagine
   * @param product Il prodotto da verificare
   */
  hasProductImage(product: any): boolean {
    return !!(product.photoUrl && product.photoUrl.trim());
  }
}
