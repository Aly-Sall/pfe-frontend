// src/app/core/services/role-redirect.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleRedirectService {
  constructor(private router: Router, private authService: AuthService) {}

  /**
   * Redirige l'utilisateur vers la page appropriée selon son rôle
   */
  redirectToDefaultPage(): void {
    const user = this.authService.currentUserValue;

    if (!user || !this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.userRole) {
      case UserRole.Administrator:
        this.router.navigate(['/dashboard']);
        break;
      case UserRole.Candidate:
        this.router.navigate(['/candidate-tests']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une route spécifique
   */
  canAccessRoute(routePath: string): boolean {
    const user = this.authService.currentUserValue;

    if (!user || !this.authService.isLoggedIn) {
      return false;
    }

    // Routes réservées aux admins
    const adminOnlyRoutes = [
      '/dashboard',
      '/tests',
      '/candidates',
      '/questions',
      '/question-management',
    ];

    // Routes réservées aux candidats
    const candidateOnlyRoutes = ['/candidate-tests'];

    // Routes partagées
    const sharedRoutes = ['/take-test', '/test-result'];

    if (user.userRole === UserRole.Administrator) {
      // Admin peut accéder à tout sauf aux routes candidat
      return !candidateOnlyRoutes.some((route) => routePath.startsWith(route));
    } else if (user.userRole === UserRole.Candidate) {
      // Candidat ne peut accéder qu'aux routes candidat et partagées
      return (
        candidateOnlyRoutes.some((route) => routePath.startsWith(route)) ||
        sharedRoutes.some((route) => routePath.startsWith(route))
      );
    }

    return false;
  }

  /**
   * Redirige si l'utilisateur n'a pas les permissions pour la route actuelle
   */
  enforceRoleBasedRedirect(currentRoute: string): void {
    if (!this.canAccessRoute(currentRoute)) {
      this.redirectToDefaultPage();
    }
  }
}
