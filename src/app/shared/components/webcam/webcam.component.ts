// src/app/shared/components/webcam/webcam.component.ts - Version surveillance obligatoire
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { WebcamImage } from 'ngx-webcam';
import { SurveillanceService } from '../../../core/services/surveillance.service';

@Component({
  selector: 'app-webcam',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.scss'],
})
export class WebcamComponent implements OnInit, OnDestroy {
  @Input() tentativeId!: number;
  @Input() testMode!: number; // 0: Training, 1: Recrutement
  @Input() isTestActive: boolean = false; // Indique si le test est en cours
  @Input() autoCapture: boolean = true; // Capture automatique (toujours true en surveillance)
  @Input() captureInterval: number = 45; // Intervalle en secondes (remplace la constante)
  @Output() imageCapture = new EventEmitter<WebcamImage>();
  @Output() surveillanceEvent = new EventEmitter<any>();
  @Output() permissionsStatus = new EventEmitter<{
    camera: boolean;
    screen: boolean;
  }>();

  // Configuration webcam
  title = 'surveillance-webcam';
  webcamImage: WebcamImage | null = null;
  trigger: Subject<void> = new Subject<void>();

  // États de surveillance - AUCUN CONTRÔLE MANUEL
  readonly isMonitoring = true; // Toujours en surveillance
  readonly showWebcam = true; // Toujours visible
  permissions = { camera: false, screen: false };
  captureHistory: WebcamImage[] = [];

  // Configuration de surveillance automatique
  private readonly MAX_HISTORY = 20; // Limiter l'historique

  private subscriptions: Subscription[] = [];
  private surveillanceInterval: any;

  constructor(private surveillanceService: SurveillanceService) {}

  async ngOnInit(): Promise<void> {
    console.log(
      '🎥 Surveillance webcam initialisée - Mode:',
      this.testMode === 0 ? 'Training' : 'Recrutement'
    );

    // Vérifier les permissions dès l'initialisation
    await this.checkAndRequestPermissions();

    // S'abonner aux changements d'état du test
    this.setupTestStateMonitoring();

    // Démarrer la surveillance si le test est actif
    if (this.isTestActive && this.tentativeId) {
      this.startAutomaticSurveillance();
    }
  }

  ngOnDestroy(): void {
    console.log('🛑 Surveillance webcam détruite');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.stopAutomaticSurveillance();
  }

  /**
   * Vérification et demande automatique des permissions
   */
  private async checkAndRequestPermissions(): Promise<void> {
    try {
      console.log('🔐 Vérification des permissions...');

      // Vérifier d'abord les permissions actuelles
      this.permissions = await this.surveillanceService.checkPermissions();
      console.log('📋 Permissions actuelles:', this.permissions);

      // Si la caméra n'est pas autorisée, la demander AUTOMATIQUEMENT
      if (!this.permissions.camera) {
        console.log("📲 Demande automatique d'accès à la caméra...");
        const granted = await this.surveillanceService.requestPermissions();

        if (granted) {
          this.permissions = await this.surveillanceService.checkPermissions();
          console.log('✅ Permissions accordées:', this.permissions);
        } else {
          console.error('❌ Permissions refusées - Test ne peut pas continuer');
        }
      }

      // Émettre le statut des permissions
      this.permissionsStatus.emit(this.permissions);
    } catch (error) {
      console.error('❌ Erreur lors de la gestion des permissions:', error);
      this.permissions = { camera: false, screen: false };
      this.permissionsStatus.emit(this.permissions);
    }
  }

  /**
   * Surveillance de l'état du test
   */
  private setupTestStateMonitoring(): void {
    // Écouter les changements de l'état du test depuis le parent
    // Le parent doit mettre à jour isTestActive quand le test commence/finit
  }

  /**
   * Démarrage de la surveillance automatique
   * AUCUN CONTRÔLE MANUEL - démarre automatiquement
   */
  private startAutomaticSurveillance(): void {
    if (!this.tentativeId) {
      console.error('❌ ID tentative manquant pour la surveillance');
      return;
    }

    if (!this.permissions.camera) {
      console.error('❌ Permissions caméra requises pour la surveillance');
      return;
    }

    console.log('🔍 Démarrage de la surveillance automatique obligatoire');
    console.log(`📊 Mode: ${this.testMode === 0 ? 'Training' : 'Recrutement'}`);
    console.log(`⏱️ Intervalle de capture: ${this.captureInterval}s`);

    // Démarrer la surveillance via le service
    const config = {
      webcamEnabled: true,
      screenCaptureEnabled: true,
      focusMonitoringEnabled: true,
      captureInterval: this.captureInterval,
      tentativeId: this.tentativeId,
    };

    this.surveillanceService.startMonitoring(config);

    // Démarrer les captures automatiques
    this.startPeriodicCaptures();

    // Première capture immédiate
    setTimeout(() => {
      this.triggerAutomaticCapture();
    }, 2000);
  }

  /**
   * Captures périodiques automatiques
   */
  private startPeriodicCaptures(): void {
    this.surveillanceInterval = setInterval(() => {
      this.triggerAutomaticCapture();
    }, this.captureInterval * 1000);
  }

  /**
   * Déclenche une capture automatique
   */
  private triggerAutomaticCapture(): void {
    if (!this.isTestActive || !this.permissions.camera) {
      return;
    }

    console.log('📸 Capture automatique de surveillance');
    this.trigger.next();
  }

  /**
   * Arrêt de la surveillance (uniquement à la fin du test)
   */
  private stopAutomaticSurveillance(): void {
    console.log('🛑 Arrêt de la surveillance automatique');

    if (this.surveillanceInterval) {
      clearInterval(this.surveillanceInterval);
      this.surveillanceInterval = null;
    }

    this.surveillanceService.stopMonitoring();
  }

  /**
   * Gestion des images capturées
   */
  handleImage(webcamImage: WebcamImage): void {
    console.log('📷 Image de surveillance capturée');

    this.webcamImage = webcamImage;
    this.addToHistory(webcamImage);

    // Émettre l'événement
    this.imageCapture.emit(webcamImage);

    // Soumission automatique obligatoire à la surveillance
    this.submitToSurveillance(webcamImage);
  }

  /**
   * Ajout à l'historique avec limitation
   */
  private addToHistory(image: WebcamImage): void {
    this.captureHistory.unshift(image);

    // Limiter la taille de l'historique
    if (this.captureHistory.length > this.MAX_HISTORY) {
      this.captureHistory = this.captureHistory.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * Soumission obligatoire à la surveillance
   */
  private submitToSurveillance(image: WebcamImage): void {
    if (!this.tentativeId) {
      console.error('❌ Impossible de soumettre: ID tentative manquant');
      return;
    }

    console.log("📤 Soumission de l'image à la surveillance...");

    this.surveillanceService
      .captureWebcam(image.imageAsDataUrl, this.tentativeId)
      .subscribe({
        next: (response) => {
          console.log('✅ Image soumise avec succès à la surveillance');
          this.surveillanceEvent.emit({
            type: 'webcam_capture',
            success: true,
            timestamp: new Date(),
            imageId: response.id,
          });
        },
        error: (error) => {
          console.error("❌ Échec de soumission de l'image:", error);
          this.surveillanceEvent.emit({
            type: 'webcam_capture',
            success: false,
            error: error.message,
            timestamp: new Date(),
          });
        },
      });
  }

  /**
   * Capture d'écran automatique
   */
  automaticScreenCapture(): void {
    if (!this.tentativeId || !this.isTestActive) {
      return;
    }

    console.log("🖥️ Capture d'écran automatique");

    this.surveillanceService.captureScreen(this.tentativeId).subscribe({
      next: (response) => {
        console.log("✅ Capture d'écran soumise");
        this.surveillanceEvent.emit({
          type: 'screen_capture',
          success: true,
          timestamp: new Date(),
        });
      },
      error: (error) => {
        console.error("❌ Échec capture d'écran:", error);
        this.surveillanceEvent.emit({
          type: 'screen_capture',
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      },
    });
  }

  /**
   * Observable pour les déclencheurs de capture
   */
  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  /**
   * Statut de la surveillance (toujours active)
   */
  getSurveillanceStatus(): string {
    if (!this.permissions.camera) return 'Permissions requises';
    if (!this.isTestActive) return 'En attente du test';
    return 'Surveillance active';
  }

  /**
   * Vérification des permissions
   */
  get hasPermissions(): boolean {
    return this.permissions.camera;
  }

  /**
   * Nombre d'images dans l'historique
   */
  get captureCount(): number {
    return this.captureHistory.length;
  }

  /**
   * Méthodes publiques pour l'interaction avec le parent
   */

  // Appelée quand le test commence
  onTestStart(): void {
    console.log('🚀 Test démarré - Activation de la surveillance');
    this.startAutomaticSurveillance();
  }

  // Appelée quand le test se termine
  onTestEnd(): void {
    console.log('🏁 Test terminé - Arrêt de la surveillance');
    this.stopAutomaticSurveillance();
  }

  // Mise à jour de l'état du test depuis le parent
  updateTestState(isActive: boolean): void {
    this.isTestActive = isActive;

    if (isActive && this.tentativeId && this.permissions.camera) {
      this.startAutomaticSurveillance();
    } else if (!isActive) {
      this.stopAutomaticSurveillance();
    }
  }

  /**
   * Méthodes d'information pour le template
   */
  getTestModeLabel(): string {
    return this.testMode === 0 ? 'Training' : 'Recrutement';
  }

  isSurveillanceRequired(): boolean {
    // Surveillance obligatoire pour les deux modes
    return true;
  }

  getSurveillanceInfo(): string {
    if (!this.permissions.camera) {
      return 'Permissions caméra requises pour continuer';
    }
    if (!this.isTestActive) {
      return 'Surveillance prête - En attente du démarrage du test';
    }
    return `Surveillance active - Capture toutes les ${this.captureInterval}s`;
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString();
  }
}
