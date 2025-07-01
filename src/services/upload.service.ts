import { Injectable } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PhotoUploadService {
  constructor(private storage: Storage) {}

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
    const timestamp = Date.now();
    const filePath = `products/${productId}/${timestamp}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    const task = uploadBytesResumable(storageRef, file);

    return new Observable(observer => {
      task.on(
        'state_changed',
        snapshot => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({ progress: Math.round(prog) });
        },
        error => {
          observer.error(error);
        },
        () => {
          // Al termine del caricamento, recupera l’URL di download
          getDownloadURL(storageRef).then(url => {
            observer.next({ progress: 100, downloadURL: url });
            observer.complete();
          });
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
    const storageRef = ref(this.storage, imageUrl);
    return new Observable(observer => {
      deleteObject(storageRef)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(err => observer.error(err));
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
