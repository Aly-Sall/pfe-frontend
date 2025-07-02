// src/app/shared/components/test-taking/test-taking.component.ts - Version corrigée avec surveillance obligatoire
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
  error: string | null = null; // ✅ Ajouté pour les erreurs de permissions

  // Timer properties
  remainingTime: number = 0;
  formattedTime: string = '00:00';

  // Progress tracking
  answeredQuestions: Set<number> = new Set();

  // ✅ Propriétés de surveillance OBLIGATOIRE
  readonly surveillanceEnabled: boolean = true; // Toujours activée
  readonly isSurveillanceActive: boolean = true; // Contrôle l'état de surveillance
  currentTentativeId: number | null = null;
  suspiciousActivityCount: number = 0;
  surveillancePermissions = { camera: false, screen: false };

  // ✅ Accès à l'objet window
  window = window;

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

    // Stop surveillance (sera automatique à la fin du test)
    this.stopSurveillance();
  }

  loadTest(): void {
    this.isLoading = true;
    this.hasError = false;
    this.error = null;

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

        // ✅ Surveillance OBLIGATOIRE pour tous les modes
        console.log(
          '🔒 Surveillance obligatoire activée pour le test:',
          test.title
        );

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

            // ✅ Vérifier les permissions de surveillance (OBLIGATOIRE)
            this.checkSurveillancePermissions();

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

  // ✅ Vérification OBLIGATOIRE des permissions de surveillance
  private async checkSurveillancePermissions(): Promise<void> {
    try {
      this.surveillancePermissions =
        await this.surveillanceService.checkPermissions();
      console.log(
        '📋 Permissions de surveillance:',
        this.surveillancePermissions
      );

      if (!this.surveillancePermissions.camera) {
        this.error =
          'Camera access is required for all tests. Surveillance is mandatory and cannot be disabled.';
        console.warn('⚠️ Permissions caméra manquantes - Test bloqué');
      } else {
        this.error = null;
        console.log('✅ Permissions accordées - Test peut commencer');
      }
    } catch (error) {
      console.error(
        '❌ Erreur lors de la vérification des permissions:',
        error
      );
      this.error =
        'Failed to check camera permissions. Please refresh and try again.';
    }
  }

  // ✅ Demande AUTOMATIQUE des permissions
  public async requestSurveillancePermissions(): Promise<boolean> {
    try {
      console.log('📲 Demande de permissions de surveillance...');
      const granted = await this.surveillanceService.requestPermissions();

      if (granted) {
        await this.checkSurveillancePermissions();
        console.log('✅ Permissions accordées');
      } else {
        this.error =
          'Camera permissions denied. This test cannot proceed without surveillance.';
        console.error('❌ Permissions refusées');
      }

      return granted;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permissions:', error);
      this.error = 'Error requesting camera permissions. Please try again.';
      return false;
    }
  }

  // Dans TestTakingComponent, modifiez la méthode startTest() :

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
          // ✅ CORRECTION : Utiliser la vraie durée du test au lieu de 30 minutes
          const duration = this.test.duration || 5; // Utiliser la durée du test, ou 5 minutes par défaut
          console.log(`🕐 Démarrage du timer pour ${duration} minutes`);

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

        // ✅ Démarrer la surveillance OBLIGATOIRE
        console.log('🔍 Démarrage de la surveillance obligatoire');
        this.startSurveillance();
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

    // ✅ Arrêter la surveillance AUTOMATIQUEMENT
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
  // ✅ MÉTHODES DE SURVEILLANCE OBLIGATOIRE
  // ===============================

  private startSurveillance(): void {
    if (!this.currentTentativeId) {
      console.warn(
        "⚠️ Impossible de démarrer la surveillance: pas d'ID tentative"
      );
      return;
    }

    if (!this.surveillancePermissions.camera) {
      console.error(
        '❌ Impossible de démarrer la surveillance: permissions caméra manquantes'
      );
      this.error =
        'Camera permissions required. Cannot start test without surveillance.';
      return;
    }

    console.log('🔍 Démarrage de la surveillance obligatoire');

    const config = {
      webcamEnabled: true,
      screenCaptureEnabled: true,
      focusMonitoringEnabled: true,
      captureInterval: 45, // 45 secondes
      tentativeId: this.currentTentativeId,
    };

    this.surveillanceService.startMonitoring(config);
  }

  private stopSurveillance(): void {
    console.log('🛑 Arrêt de la surveillance');
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

        // Terminer le test automatiquement si trop de violations
        if (count >= 10) {
          this.terminateTestForViolations();
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
      - N'utilisez pas d'aides externes
      
      Continuez à respecter les consignes pour éviter l'invalidation de votre test.
    `;

    alert(message);
  }

  // ✅ Terminaison automatique du test en cas de violations multiples
  private terminateTestForViolations(): void {
    alert(`
      🚨 TEST TERMINATED 🚨
      
      Your test has been automatically terminated due to multiple violations (${this.suspiciousActivityCount}).
      
      This action has been logged and reported.
    `);

    // Arrêter la surveillance et retourner au dashboard
    this.stopSurveillance();
    this.router.navigate(['/dashboard']);
  }

  // ✅ Gestion des événements de surveillance
  onSurveillanceEvent(event: any): void {
    console.log('📊 Événement de surveillance:', event);

    if (!event.success) {
      console.warn("⚠️ Échec d'événement de surveillance:", event.error);

      // Incrémenter le compteur d'activités suspectes
      this.suspiciousActivityCount++;
    }

    // Traitement spécifique par type d'événement
    switch (event.type) {
      case 'webcam_capture':
        if (event.success) {
          console.log('✅ Capture webcam réussie');
        } else {
          console.error('❌ Échec capture webcam:', event.error);
        }
        break;

      case 'screen_capture':
        if (event.success) {
          console.log("✅ Capture d'écran réussie");
        } else {
          console.error("❌ Échec capture d'écran:", event.error);
        }
        break;

      case 'focus_lost':
        console.warn('⚠️ Focus perdu - Activité suspecte');
        this.suspiciousActivityCount++;
        break;

      case 'suspicious_activity':
        console.warn('⚠️ Activité suspecte détectée:', event.data);
        break;
    }
  }

  // Helper method to get the progress percentage
  getProgressPercentage(): number {
    if (!this.questions.length) return 0;
    return Math.round(
      (this.answeredQuestions.size / this.questions.length) * 100
    );
  }

  // ✅ Propriétés calculées pour le template
  get canStartTest(): boolean {
    return this.surveillancePermissions.camera;
  }

  get surveillanceStatus(): string {
    if (!this.surveillancePermissions.camera) return 'Permissions Required';
    if (!this.isStarted) return 'Ready to Monitor';
    return 'Actively Monitoring';
  }

  get surveillanceStatusClass(): string {
    if (!this.surveillancePermissions.camera) return 'status-error';
    if (!this.isStarted) return 'status-warning';
    return 'status-active';
  }

  get surveillanceIconClass(): string {
    if (!this.surveillancePermissions.camera) return 'fa-camera-slash';
    if (!this.isStarted) return 'fa-clock';
    return 'fa-shield-alt';
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
    this.error = message;
    this.isLoading = false;
  }

  // ✅ Méthode pour préparer et démarrer le test avec surveillance
  async prepareAndStartTest(): Promise<void> {
    // Vérifier les permissions avant de démarrer
    if (!this.surveillancePermissions.camera) {
      const granted = await this.requestSurveillancePermissions();
      if (!granted) {
        alert(
          'Camera permissions are mandatory for all tests. Test cannot proceed without surveillance.'
        );
        return;
      }
    }

    // Démarrer le test une fois les permissions accordées
    this.startTest();
  }
}
