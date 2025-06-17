// src/app/core/services/auth.service.ts - Version mise à jour pour Admin/Candidat
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
  userRole: UserRole; // 0 = Administrator, 1 = Candidate
}

export interface AuthResponseExtended {
  token?: string;
  expiry?: string;
  userRole?: UserRole;
  email?: string;
  nom?: string;
  prenom?: string;
  message?: string;
  requiresEmailInvitation?: boolean;
  availableTests?: TestDto[];
}

export interface TestDto {
  id: number;
  title: string;
  description?: string;
  duration: number;
}

export interface VerifyCandidateAccessRequest {
  token: string;
}

export enum UserRole {
  Administrator = 0,
  Candidate = 1,
}

export interface CurrentUser {
  token: string;
  expiry: string;
  userRole: UserRole;
  email: string;
  nom?: string;
  prenom?: string;
  availableTests?: TestDto[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Auth`;
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Vérifier si l'utilisateur est déjà connecté
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Vérifier si le token est encore valide
      if (new Date(user.expiry) > new Date()) {
        this.currentUserSubject.next(user);
      } else {
        this.logout();
      }
    }
  }

  // Nouvelle méthode de connexion avec rôle
  loginWithRole(
    email: string,
    password: string,
    userRole: UserRole
  ): Observable<AuthResponseExtended> {
    const credentials: LoginRequest = { email, password, userRole };

    return this.http
      .post<AuthResponseExtended>(`${this.apiUrl}/login-with-role`, credentials)
      .pipe(
        tap((response) => {
          console.log('🔍 Login response:', response);

          if (userRole === UserRole.Administrator && response.token) {
            // Admin - stocker le token et rediriger vers dashboard
            const user: CurrentUser = {
              token: response.token,
              expiry: response.expiry!,
              userRole: UserRole.Administrator,
              email: response.email!,
              nom: response.nom,
              prenom: response.prenom,
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);

            console.log('✅ Admin login successful, redirecting to dashboard');
            this.router.navigate(['/dashboard']);
          } else if (
            userRole === UserRole.Candidate &&
            response.requiresEmailInvitation
          ) {
            // Candidat - email envoyé, afficher message
            console.log('📧 Candidate email sent:', response.message);
            // Ne pas stocker de token, juste afficher le message
          }
        })
      );
  }

  // Vérification d'accès candidat via token d'invitation
  verifyCandidateAccess(token: string): Observable<AuthResponseExtended> {
    const request: VerifyCandidateAccessRequest = { token };

    return this.http
      .post<AuthResponseExtended>(
        `${this.apiUrl}/verify-candidate-access`,
        request
      )
      .pipe(
        tap((response) => {
          console.log('🔍 Candidate access response:', response);

          if (response.token) {
            // Stocker les informations du candidat
            const user: CurrentUser = {
              token: response.token,
              expiry: response.expiry!,
              userRole: UserRole.Candidate,
              email: response.email!,
              nom: response.nom,
              prenom: response.prenom,
              availableTests: response.availableTests,
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);

            console.log('✅ Candidate access verified, redirecting to tests');
            this.router.navigate(['/candidate-tests']);
          }
        })
      );
  }

  // Méthode de connexion classique (rétrocompatibilité)
  login(credentials: { email: string; password: string }): Observable<any> {
    // Par défaut, essayer en tant qu'admin
    return this.loginWithRole(
      credentials.email,
      credentials.password,
      UserRole.Administrator
    );
  }

  logout(): void {
    console.log('🚪 Logging out user');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get currentUserValue(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    const user = this.currentUserValue;
    return !!user && new Date(user.expiry) > new Date();
  }

  get isAdmin(): boolean {
    const user = this.currentUserValue;
    return this.isLoggedIn && user?.userRole === UserRole.Administrator;
  }

  get isCandidate(): boolean {
    const user = this.currentUserValue;
    return this.isLoggedIn && user?.userRole === UserRole.Candidate;
  }

  get authToken(): string | null {
    return this.currentUserValue?.token || null;
  }

  get availableTests(): TestDto[] {
    return this.currentUserValue?.availableTests || [];
  }
}
