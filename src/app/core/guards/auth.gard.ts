// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.currentUserValue;

    if (currentUser && this.authService.isLoggedIn) {
      // Vérifier les restrictions de rôle si spécifiées
      const expectedRoles = route.data['expectedRoles'] as UserRole[];

      if (expectedRoles && expectedRoles.length > 0) {
        if (!expectedRoles.includes(currentUser.userRole)) {
          // Rediriger selon le rôle
          if (currentUser.userRole === UserRole.Administrator) {
            this.router.navigate(['/dashboard']);
          } else if (currentUser.userRole === UserRole.Candidate) {
            this.router.navigate(['/candidate-tests']);
          }
          return false;
        }
      }

      return true;
    }

    // Pas connecté, rediriger vers la page de connexion
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAdmin) {
      return true;
    }

    // Rediriger selon le statut
    if (this.authService.isCandidate) {
      this.router.navigate(['/candidate-tests']);
    } else {
      this.router.navigate(['/login']);
    }
    return false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class CandidateGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isCandidate) {
      return true;
    }

    // Rediriger selon le statut
    if (this.authService.isAdmin) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
    return false;
  }
}
