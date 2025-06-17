// src/app/shared/components/candidate-tests/candidate-tests.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, TestDto } from '../../../core/services/auth.service';
import { TestAttemptService } from '../../../core/services/test-attempt.service';

@Component({
  selector: 'app-candidate-tests',
  templateUrl: './candidate-tests.component.html',
  styleUrls: ['./candidate-tests.component.scss'],
})
export class CandidateTestsComponent implements OnInit {
  availableTests: TestDto[] = [];
  loading = false;
  error = '';
  candidateInfo: any = null;

  constructor(
    private authService: AuthService,
    private testAttemptService: TestAttemptService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier que l'utilisateur est bien un candidat
    if (!this.authService.isCandidate) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadCandidateData();
  }

  private loadCandidateData(): void {
    this.candidateInfo = this.authService.currentUserValue;
    this.availableTests = this.authService.availableTests;

    console.log('📋 Candidate info:', this.candidateInfo);
    console.log('📝 Available tests:', this.availableTests);
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
      },
    });
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
