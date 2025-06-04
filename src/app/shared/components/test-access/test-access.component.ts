// src/app/shared/components/test-access/test-access.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService } from '../../../core/services/test.service';

@Component({
  selector: 'app-test-access',
  templateUrl: './test-access.component.html',
  styleUrls: ['./test-access.component.scss'],
})
export class TestAccessComponent implements OnInit {
  token: string = '';
  isLoading = true;
  error: string | null = null;
  test: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (this.token) {
      this.validateTokenAndLoadTest();
    } else {
      this.error = "Token d'accès manquant";
      this.isLoading = false;
    }
  }

  validateTokenAndLoadTest(): void {
    this.testService.getTestByToken(this.token).subscribe({
      next: (test) => {
        this.test = test;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = "Lien d'invitation invalide ou expiré";
        this.isLoading = false;
      },
    });
  }

  startTest(): void {
    if (this.test?.id) {
      // Rediriger vers la page de passage de test avec le token
      this.router.navigate(['/take-test', this.test.id], {
        queryParams: { token: this.token },
      });
    }
  }
}
