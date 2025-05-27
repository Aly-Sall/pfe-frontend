// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiry: string;
  nom?: string;
  prenom?: string;
  userName?: string;
  email?: string;
}

export interface ApiResult {
  isSuccess: boolean;
  error?: string;
  errors?: string[];
  id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Account`;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Check if token is still valid
      if (new Date(user.expiry) > new Date()) {
        this.currentUserSubject.next(user);
      } else {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          // Store user details and jwt token in local storage
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        })
      );
  }

  register(userData: RegisterRequest): Observable<ApiResult> {
    return this.http.post<ApiResult>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    // Remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return (
      !!this.currentUserValue &&
      new Date(this.currentUserValue.expiry) > new Date()
    );
  }

  get authToken(): string | null {
    return this.currentUserValue?.token || null;
  }
}

// HTTP Interceptor pour ajouter automatiquement le token JWT
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Add auth header with jwt if user is logged in and request is to api url
    const currentUser = this.authService.currentUserValue;
    const isApiUrl = request.url.startsWith(environment.apiUrl);

    if (currentUser && isApiUrl) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });
    }

    return next.handle(request);
  }
}
