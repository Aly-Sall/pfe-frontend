// src/app/shared/components/test-taking/test-taking.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TestService,
  TestDto,
  QuestionDto,
} from '../../../core/services/test.service';
import {
  TestAttemptService,
  TestAttemptDto,
} from '../../../core/services/test-attempt.service';
import { Subscription, interval } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-test-taking',
  templateUrl: './test-taking.component.html',
  styleUrls: ['./test-taking.component.scss'],
})
export class TestTakingComponent implements OnInit, OnDestroy {
  test: TestDto | null = null;
  questions: QuestionDto[] = [];
  currentQuestion: QuestionDto | null = null;
  currentQuestionIndex: number = 0;

  isLoading: boolean = true;
  isStarted: boolean = false;
  isCompleted: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  // Timer properties
  remainingTime: number = 0;
  formattedTime: string = '00:00';

  // Progress tracking
  answeredQuestions: Set<number> = new Set();

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService,
    public attemptService: TestAttemptService
  ) {}

  ngOnInit(): void {
    this.loadTest();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Stop the timer if active
    this.attemptService.stopTimer();
  }

  loadTest(): void {
    this.isLoading = true;
    this.hasError = false;

    // Get test ID from route parameter
    const testId = this.route.snapshot.paramMap.get('id');
    if (!testId) {
      this.handleError('Test ID is missing');
      return;
    }

    // Load test details
    this.testService.getTestById(Number(testId)).subscribe({
      next: (test) => {
        this.test = test;

        // Load questions for the test
        this.testService.getTestQuestions(Number(testId)).subscribe({
          next: (questions) => {
            this.questions = questions;

            if (this.questions.length === 0) {
              this.handleError('This test has no questions');
              return;
            }

            this.currentQuestionIndex = 0;
            this.currentQuestion = this.questions[0];

            // Check if there's a saved attempt
            if (this.attemptService.hasSavedAnswers(Number(testId))) {
              this.showRestorePrompt();
            }

            this.isLoading = false;
          },
          error: (error) => {
            this.handleError('Failed to load test questions');
          },
        });
      },
      error: (error) => {
        this.handleError('Failed to load test details');
      },
    });
  }

  startTest(): void {
    if (!this.test || !this.test.id) return;

    this.isLoading = true;

    this.attemptService.startTest(this.test.id).subscribe({
      next: (attempt) => {
        this.isStarted = true;
        this.isLoading = false;

        // Start timer if enabled
        if (this.test?.showTimer) {
          // For demo, set a 30-minute timer (adjust as needed)
          const duration = 30;
          this.attemptService.startTimer(duration);

          // Subscribe to timer updates
          const timerSub = this.attemptService.remainingTime$.subscribe(
            (time) => {
              this.remainingTime = time;
              this.formattedTime =
                this.attemptService.formatRemainingTime(time);
            }
          );
          this.subscriptions.push(timerSub);
        }

        // Setup automatic surveillance if needed (every minute)
        if (this.test?.mode === 1) {
          // Recruitment mode enables surveillance
          const surveillanceSub = interval(60000).subscribe(() => {
            this.captureSurveillance();
          });
          this.subscriptions.push(surveillanceSub);

          // Initial capture
          this.captureSurveillance();
        }
      },
      error: (error) => {
        this.handleError('Failed to start the test');
      },
    });
  }

  navigateToQuestion(index: number): void {
    if (index < 0 || index >= this.questions.length) return;

    this.currentQuestionIndex = index;
    this.currentQuestion = this.questions[index];
  }

  previousQuestion(): void {
    this.navigateToQuestion(this.currentQuestionIndex - 1);
  }

  nextQuestion(): void {
    this.navigateToQuestion(this.currentQuestionIndex + 1);
  }

  saveAnswer(questionId: number, answerIds: number[]): void {
    this.attemptService.saveAnswer(questionId, answerIds);
    this.answeredQuestions.add(questionId);
  }

  isQuestionAnswered(questionId: number): boolean {
    return this.answeredQuestions.has(questionId);
  }

  completeTest(): void {
    if (
      !confirm(
        'Are you sure you want to submit your test? You cannot change your answers afterward.'
      )
    ) {
      return;
    }

    this.isLoading = true;

    this.attemptService.completeTest().subscribe({
      next: (result) => {
        this.isCompleted = true;
        this.isLoading = false;
        this.router.navigate(['/test-result']);
      },
      error: (error) => {
        this.handleError('Failed to submit test');
      },
    });
  }

  private captureSurveillance(): void {
    // In a real application, this would capture the screen or use webcam
    // For this demo, we're just sending a placeholder
    const captureData = `data:image/png;base64,${this.generateDummyBase64()}`;

    this.attemptService.submitSurveillance(captureData).subscribe({
      error: (error) => {
        console.error('Failed to submit surveillance data', error);
      },
    });
  }

  private generateDummyBase64(): string {
    // Just a dummy string to represent a base64 image
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  }

  private showRestorePrompt(): void {
    if (
      confirm(
        'You have a saved test in progress. Do you want to continue where you left off?'
      )
    ) {
      const testId = this.test?.id || 0;
      // For demo, using a dummy tentative ID
      const tentativeId = 1;
      this.attemptService.restoreSavedAnswers(testId, tentativeId);
      this.isStarted = true;

      // Mark questions as answered
      this.questions.forEach((question) => {
        const answer = this.attemptService.getAnswer(question.id || 0);
        if (answer && answer.length > 0) {
          this.answeredQuestions.add(question.id || 0);
        }
      });
    }
  }

  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
  }

  // Helper method to get the progress percentage
  getProgressPercentage(): number {
    if (!this.questions.length) return 0;
    return Math.round(
      (this.answeredQuestions.size / this.questions.length) * 100
    );
  }
}
