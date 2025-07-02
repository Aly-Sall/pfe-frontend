// src/app/shared/components/candidate-tests/candidate-tests.component.ts - VERSION CORRIGÉE TYPES
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, TestDto } from '../../../core/services/auth.service';
import { TestAttemptService } from '../../../core/services/test-attempt.service';
import {
  TestService,
  TestDto as ApiTestDto,
} from '../../../core/services/test.service';

@Component({
  selector: 'app-candidate-tests',
  templateUrl: './candidate-tests.component.html',
  styleUrls: ['./candidate-tests.component.scss'],
})
export class CandidateTestsComponent implements OnInit {
  availableTests: TestDto[] = []; // ✅ Utiliser TestDto d'AuthService
  loading = true;
  error = '';
  candidateInfo: any = null;

  constructor(
    private authService: AuthService,
    private testAttemptService: TestAttemptService,
    private testService: TestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier que l'utilisateur est bien un candidat
    if (!this.authService.isCandidate) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCandidateData();
    this.loadAvailableTests();
  }

  private loadCandidateData(): void {
    this.candidateInfo = this.authService.currentUserValue;
    console.log('📋 Candidate info:', this.candidateInfo);
  }

  // ✅ NOUVELLE MÉTHODE : Charger les tests disponibles
  private loadAvailableTests(): void {
    this.loading = true;
    this.error = '';

    // D'abord essayer de récupérer depuis AuthService
    const testsFromAuth = this.authService.availableTests;
    if (testsFromAuth && testsFromAuth.length > 0) {
      this.availableTests = testsFromAuth;
      this.loading = false;
      console.log('📝 Tests loaded from AuthService:', this.availableTests);
      return;
    }

    // Sinon, charger depuis l'API et convertir les types
    console.log('🔍 Loading tests from API...');
    this.testService.getAllTests().subscribe({
      next: (apiTests: ApiTestDto[]) => {
        // ✅ CONVERSION : ApiTestDto vers AuthService.TestDto
        this.availableTests = apiTests
          .filter((test) => test.id !== undefined && test.id > 0) // Filtrer les tests avec ID valide
          .map((test) => this.convertApiTestToAuthTest(test));

        this.loading = false;
        console.log(
          '✅ Tests loaded and converted from API:',
          this.availableTests
        );
      },
      error: (error) => {
        console.error('❌ Error loading tests:', error);
        this.error = 'Erreur lors du chargement des tests disponibles';
        this.loading = false;

        // ✅ FALLBACK : Créer des tests de démonstration
        this.createDemoTests();
      },
    });
  }

  // ✅ MÉTHODE DE CONVERSION : ApiTestDto vers AuthService.TestDto
  private convertApiTestToAuthTest(apiTest: ApiTestDto): TestDto {
    return {
      id: apiTest.id!, // Non-null assertion car on a filtré plus haut
      title: apiTest.title,
      description:
        this.getCategoryDescription(apiTest.category) +
        ` - ${this.getModeDescription(apiTest.mode)}`,
      duration: apiTest.duration || 5, // Durée par défaut : 5 minutes
    };
  }

  // ✅ MÉTHODES UTILITAIRES pour les descriptions
  private getCategoryDescription(category: number): string {
    switch (category) {
      case 0:
        return 'Aucune catégorie';
      case 1:
        return 'Test général';
      case 2:
        return 'Test technique';
      default:
        return 'Catégorie inconnue';
    }
  }

  private getModeDescription(mode: number): string {
    switch (mode) {
      case 0:
        return 'Mode entraînement';
      case 1:
        return 'Mode recrutement';
      default:
        return 'Mode inconnu';
    }
  }

  // ✅ MÉTHODE DE FALLBACK : Tests de démonstration
  private createDemoTests(): void {
    this.availableTests = [
      {
        id: 1,
        title: 'Test de Logique',
        description: 'Évaluation des capacités de raisonnement logique',
        duration: 5,
      },
      {
        id: 2,
        title: 'Test Technique JavaScript',
        description: 'Connaissances en programmation JavaScript',
        duration: 10,
      },
      {
        id: 3,
        title: 'Test de Personnalité',
        description: 'Évaluation des traits de personnalité',
        duration: 5,
      },
    ];
    this.loading = false;
    console.log('📝 Demo tests created:', this.availableTests);
  }

  startTest(test: TestDto): void {
    console.log('🚀 Starting test:', test);

    // Démarrer une tentative de test
    this.loading = true;

    this.testAttemptService.startTest(test.id).subscribe({
      next: (attempt) => {
        console.log('✅ Test attempt created:', attempt);
        // Rediriger vers la page de passage de test
        this.router.navigate(['/take-test', test.id], {
          queryParams: { attemptId: attempt.id },
        });
      },
      error: (error) => {
        console.error('❌ Error starting test:', error);
        this.error = 'Erreur lors du démarrage du test';
        this.loading = false;

        // ✅ FALLBACK : Redirection directe pour les tests de démo
        console.log('🔄 Redirecting to test without attempt ID...');
        this.router.navigate(['/take-test', test.id]);
      },
    });
  }

  // ✅ NOUVELLE MÉTHODE : Recharger les tests
  refreshTests(): void {
    this.loadAvailableTests();
  }

  logout(): void {
    this.authService.logout();
  }

  getDurationText(duration: number): string {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  // Fonction trackBy pour optimiser le rendu de la liste
  trackByTestId(index: number, test: TestDto): number {
    return test.id;
  }
}
