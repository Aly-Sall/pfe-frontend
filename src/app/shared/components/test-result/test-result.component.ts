// src/app/shared/components/test-result/test-result.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  TestAttemptService,
  TestResultDto,
  QuestionResultDto,
} from '../../../core/services/test-attempt.service';

@Component({
  selector: 'app-test-result',
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.scss'],
})
export class TestResultComponent implements OnInit {
  result: TestResultDto | null = null;
  isLoading: boolean = true;
  showDetailedResults: boolean = false;

  constructor(
    private router: Router,
    private attemptService: TestAttemptService
  ) {}

  ngOnInit(): void {
    this.loadResults();
  }

  loadResults(): void {
    this.isLoading = true;

    // Subscribe to test results from the service
    this.attemptService.testResult$.subscribe((result) => {
      this.result = result;
      this.isLoading = false;

      // If no result available, redirect to dashboard
      if (!result) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  toggleDetailedResults(): void {
    this.showDetailedResults = !this.showDetailedResults;
  }

  // Get the CSS class for the score display based on the percentage
  getScoreClass(): string {
    if (!this.result) return '';

    const score = this.result.scorePercentage;
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  }

  // Get a message based on the score
  getScoreMessage(): string {
    if (!this.result) return '';

    const score = this.result.scorePercentage;
    if (score >= 80)
      return 'Excellent! You have a strong understanding of the material.';
    if (score >= 60)
      return 'Good job! You have a solid grasp of most concepts.';
    if (score >= 40) return "Not bad, but there's room for improvement.";
    return 'You might need additional study on this topic.';
  }

  // Return to dashboard
  returnToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
