// src/app/core/services/error.service.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "Une erreur inconnue s'est produite";

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = this.handleBadRequest(error);
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous connecter.';
          break;
        case 403:
          errorMessage =
            "Accès interdit. Vous n'avez pas les permissions nécessaires.";
          break;
        case 404:
          errorMessage = 'Ressource non trouvée.';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    console.error('HTTP Error:', error);
    console.error('Error Message:', errorMessage);

    return throwError(() => new Error(errorMessage));
  }

  private handleBadRequest(error: HttpErrorResponse): string {
    if (error.error?.errors) {
      // Validation errors from .NET API
      const validationErrors = Object.values(error.error.errors).flat();
      return validationErrors.join(', ');
    } else if (error.error?.error) {
      return error.error.error;
    } else if (error.error?.message) {
      return error.error.message;
    }
    return 'Données invalides.';
  }
}
