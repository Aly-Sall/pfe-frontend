// src/app/shared/components/test-taking/test-taking.component.ts - Version avec surveillance
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
import { SurveillanceService } from '../../../core/services/surveillance.service';
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

  // Surveillance properties
  surveillanceEnabled: boolean = false;
  currentTentativeId: number | null = null;
  suspiciousActivityCount: number = 0;
  surveillancePermissions = { camera: false, screen: false };

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testService: TestService,
    public attemptService: TestAttemptService,
    private surveillanceService: SurveillanceService
  ) {}

  ngOnInit(): void {
    this.loadTest();
    this.setupSurveillanceSubscriptions();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Stop the timer if active
    this.attemptService.stopTimer();

    // Stop surveillance
    this.stopSurveillance();
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

        // Vérifier si la surveillance est requise (mode recrutement)
        this.surveillanceEnabled = test.mode === 1; // 1 = Recruitment

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

            // Vérifier les permissions de surveillance si nécessaire
            if (this.surveillanceEnabled) {
              this.checkSurveillancePermissions();
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
        this.currentTentativeId = attempt.id || null;
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

        // Démarrer la surveillance si activée et permissions accordées
        if (this.surveillanceEnabled && this.currentTentativeId) {
          this.startSurveillance();
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

    // Arrêter la surveillance avant de soumettre
    this.stopSurveillance();

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

  // ===============================
  // MÉTHODES DE SURVEILLANCE
  // ===============================

  private async checkSurveillancePermissions(): Promise<void> {
    try {
      this.surveillancePermissions =
        await this.surveillanceService.checkPermissions();
      console.log('📋 Surveillance permissions:', this.surveillancePermissions);
    } catch (error) {
      console.error('❌ Error checking surveillance permissions:', error);
    }
  }

  public async requestSurveillancePermissions(): Promise<boolean> {
    try {
      const granted = await this.surveillanceService.requestPermissions();
      if (granted) {
        await this.checkSurveillancePermissions();
      }
      return granted;
    } catch (error) {
      console.error('❌ Error requesting surveillance permissions:', error);
      return false;
    }
  }

  private startSurveillance(): void {
    if (!this.currentTentativeId) {
      console.warn('⚠️ Cannot start surveillance: no tentative ID');
      return;
    }

    console.log('🔍 Starting test surveillance');

    const config = {
      webcamEnabled: true,
      screenCaptureEnabled: true,
      focusMonitoringEnabled: true,
      captureInterval: 60, // Capture toutes les 60 secondes
      tentativeId: this.currentTentativeId,
    };

    this.surveillanceService.startMonitoring(config);
  }

  private stopSurveillance(): void {
    console.log('🛑 Stopping test surveillance');
    this.surveillanceService.stopMonitoring();
  }

  private setupSurveillanceSubscriptions(): void {
    // S'abonner au compteur d'activités suspectes
    const suspiciousSub =
      this.surveillanceService.suspiciousActivityCount$.subscribe((count) => {
        this.suspiciousActivityCount = count;

        // Alerter si trop d'activités suspectes
        if (count >= 3) {
          this.showSuspiciousActivityWarning();
        }
      });

    this.subscriptions.push(suspiciousSub);
  }

  private showSuspiciousActivityWarning(): void {
    const message = `
      ⚠️ ATTENTION ⚠️
      
      Un nombre élevé d'activités suspectes a été détecté (${this.suspiciousActivityCount}).
      
      Rappel des règles :
      - Ne quittez pas la fenêtre du test
      - Ne consultez pas d'autres sites web
      - Restez face à la caméra
      
      Continuez à respecter les consignes pour éviter l'invalidation de votre test.
    `;

    alert(message);
  }

  // Méthodes pour le composant webcam
  onSurveillanceEvent(event: any): void {
    console.log('📊 Surveillance event:', event);

    if (!event.success) {
      console.warn('⚠️ Surveillance event failed:', event.error);
    }
  }

  // Helper method to get the progress percentage
  getProgressPercentage(): number {
    if (!this.questions.length) return 0;
    return Math.round(
      (this.answeredQuestions.size / this.questions.length) * 100
    );
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

  // Getters pour le template
  get shouldShowSurveillanceWarning(): boolean {
    return (
      this.surveillanceEnabled &&
      !this.surveillancePermissions.camera &&
      this.isStarted
    );
  }

  get surveillanceStatus(): string {
    if (!this.surveillanceEnabled) return 'Désactivée';
    if (!this.surveillancePermissions.camera) return 'Permissions requises';
    if (this.isStarted) return 'Active';
    return 'En attente';
  }

  get canStartTest(): boolean {
    if (!this.surveillanceEnabled) return true;
    return this.surveillancePermissions.camera;
  }

  // Méthode pour demander les permissions avant de démarrer
  async prepareAndStartTest(): Promise<void> {
    if (this.surveillanceEnabled && !this.surveillancePermissions.camera) {
      const granted = await this.requestSurveillancePermissions();
      if (!granted) {
        alert(
          'Les permissions de surveillance sont requises pour ce test de recrutement.'
        );
        return;
      }
    }

    this.startTest();
  }
}
