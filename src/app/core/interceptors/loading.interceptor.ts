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
