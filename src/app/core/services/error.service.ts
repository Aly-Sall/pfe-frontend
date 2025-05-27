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

// src/app/core/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ErrorService } from '../services/error.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Auto logout si 401 Unauthorized
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        return this.errorService.handleError(error);
      })
    );
  }
}

// src/app/core/interceptors/loading.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Commencer le loading
    this.loadingService.setLoading(true);

    return next.handle(request).pipe(
      finalize(() => {
        // Arrêter le loading quand la requête est terminée
        this.loadingService.setLoading(false);
      })
    );
  }
}

// src/app/core/services/loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequests = 0;

  loading$ = this.loadingSubject.asObservable();

  setLoading(loading: boolean): void {
    if (loading) {
      this.activeRequests++;
    } else {
      this.activeRequests--;
      if (this.activeRequests < 0) {
        this.activeRequests = 0;
      }
    }

    this.loadingSubject.next(this.activeRequests > 0);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
