import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface TranslationResponse {
  translations: { [key: string]: string };
  warning?: string;
  error?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // URL della Firebase Function per le traduzioni
  private readonly TRANSLATION_FUNCTION_URL = 'https://europe-west1-sofaform-59f6f.cloudfunctions.net/translateTexts';

  // Static labels that should NOT be sent to ChatGPT (now handled by I18nService)
  private readonly STATIC_LABELS = [
    'Scheda Tecnica', 'Caratteristica', 'Dettaglio',
    'Seduta', 'Schienale', 'Meccanica', 'Materasso',
    'Rivestimento', 'Prezzo', 'Servizio', 'Servizi Aggiuntivi',
    'Modello', 'Consegna',
    'Materassi Extra a Scelta', 'Meccanismi Extra a Scelta',
    'Nessun rivestimento configurato per questa variante'
  ];

  constructor(private http: HttpClient) {}

  getAvailableLanguages(): LanguageOption[] {
    return [
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' }
    ];
  }

  translateTexts(texts: string[], targetLanguage: string): Observable<{ [key: string]: string }> {
    const sanitizedTexts = Array.from(new Set(
      (texts || [])
        .map(t => (t || '').trim())
        .filter(t => t.length > 0)
    ));

    console.log('TranslationService: Starting translation', { textsCount: sanitizedTexts.length, targetLanguage });

    if (targetLanguage === 'it') {
      // No translation needed for Italian - return Observable
      const translations: { [key: string]: string } = {};
      sanitizedTexts.forEach(text => translations[text] = text);
      console.log('TranslationService: Italian detected, returning identity mapping');
      return of(translations);
    }

    // Filter out static labels - they are handled by I18nService
    const textsToTranslate = sanitizedTexts.filter(text => !this.STATIC_LABELS.includes(text));
    
    if (textsToTranslate.length === 0) {
      console.log('TranslationService: No texts to translate after filtering static labels');
      const translations: { [key: string]: string } = {};
      sanitizedTexts.forEach(text => translations[text] = text);
      return of(translations);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const payload = {
      texts: textsToTranslate, // Send only filtered texts
      targetLanguage
    };

    console.log('TranslationService: Making HTTP request to', this.TRANSLATION_FUNCTION_URL, 'with', textsToTranslate.length, 'texts');

    return this.http.post(this.TRANSLATION_FUNCTION_URL, payload, {
      headers,
      observe: 'response',
      responseType: 'text'
    })
      .pipe(
        timeout(60000), // 60 second timeout
        map(response => {
          console.log('TranslationService: Received response', response.status);

          const rawBody = response.body || '';
          let body: TranslationResponse | null = null;

          if (rawBody) {
            try {
              body = JSON.parse(rawBody);
            } catch (parseError) {
              console.warn('TranslationService: Failed to parse translation response, using fallback', parseError);
            }
          }

          if (body?.warning) console.warn('Translation warning:', body.warning);
          if (body?.error) console.warn('Translation error from server:', body.error);

          // Combine filtered translations with identity mapping for technical labels
          const combinedTranslations: { [key: string]: string } = {};
          
          // Add identity mapping for technical labels
          this.STATIC_LABELS.forEach(label => {
            if (sanitizedTexts.includes(label)) {
              combinedTranslations[label] = label;
            }
          });
          
          // Add translated texts
          Object.assign(combinedTranslations, body?.translations || {});
          
          return combinedTranslations;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('TranslationService: HTTP Error', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url,
            error: error.error
          });

          // Diagnose the error type
          let errorMessage = 'Translation failed';
          if (error.status === 0) {
            errorMessage = 'Network error or CORS issue - unable to reach translation service';
          } else if (error.status === 404) {
            errorMessage = 'Translation service not found - function may not be deployed';
          } else if (error.status >= 500) {
            errorMessage = 'Translation service error - server issue';
          }

          console.warn(`TranslationService: ${errorMessage}, using fallback`);

          // Fallback: return original texts as Observable
          const fallback: { [key: string]: string } = {};
          sanitizedTexts.forEach(text => fallback[text] = text);
          return of(fallback);
        })
      );
  }
}
