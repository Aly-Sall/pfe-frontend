// src/app/shared/components/webcam/webcam.component.ts
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
  @Input() autoCapture: boolean = false;
  @Input() captureInterval: number = 30; // secondes
  @Output() imageCapture = new EventEmitter<WebcamImage>();
  @Output() surveillanceEvent = new EventEmitter<any>();

  title = 'webcam-surveillance';
  showWebcam = true;
  webcamImage: WebcamImage | null = null;
  trigger: Subject<void> = new Subject<void>();

  // États de surveillance
  isMonitoring = false;
  permissions = { camera: false, screen: false };
  captureHistory: WebcamImage[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private surveillanceService: SurveillanceService) {}

  async ngOnInit(): Promise<void> {
    console.log('🎥 Webcam component initialized');

    // Vérifier les permissions
    await this.checkPermissions();

    // S'abonner aux événements de surveillance
    this.subscriptions.push(
      this.surveillanceService.isMonitoring$.subscribe((isMonitoring) => {
        this.isMonitoring = isMonitoring;
        console.log('📊 Surveillance status changed:', isMonitoring);
      })
    );

    // Écouter les événements de capture automatique
    this.setupAutomaticCaptureListener();

    // Démarrer la capture automatique si activée
    if (this.autoCapture && this.tentativeId) {
      this.startAutomaticCapture();
    }
  }

  ngOnDestroy(): void {
    console.log('🛑 Webcam component destroyed');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.stopAutomaticCapture();
  }

  /**
   * Déclenche une capture d'image
   */
  triggerSnapshot(): void {
    console.log('📸 Triggering manual snapshot');
    this.trigger.next();
  }

  /**
   * Gère l'image capturée
   */
  handleImage(webcamImage: WebcamImage): void {
    console.log(
      '📷 Image captured',
      webcamImage.imageAsDataUrl.substring(0, 50) + '...'
    );

    this.webcamImage = webcamImage;
    this.captureHistory.unshift(webcamImage);

    // Limiter l'historique à 10 images
    if (this.captureHistory.length > 10) {
      this.captureHistory = this.captureHistory.slice(0, 10);
    }

    // Émettre l'événement
    this.imageCapture.emit(webcamImage);

    // Envoyer à la surveillance si en cours
    if (this.isMonitoring && this.tentativeId) {
      this.submitToSurveillance(webcamImage);
    }
  }

  /**
   * Observable pour déclencher les captures
   */
  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  /**
   * Télécharge l'image capturée
   */
  downloadImage(type: 'jpg' | 'png' = 'jpg'): void {
    if (!this.webcamImage) {
      console.warn('⚠️ No image to download');
      return;
    }

    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = this.webcamImage.imageAsDataUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('❌ Cannot get canvas context');
        return;
      }

      ctx.drawImage(img, 0, 0);
      const mimeType = type === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mimeType);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `surveillance-${Date.now()}.${type}`;
      link.click();

      console.log('💾 Image downloaded');
    };
  }

  /**
   * Démarre la surveillance avec webcam
   */
  startSurveillance(): void {
    if (!this.tentativeId) {
      console.error('❌ Tentative ID required for surveillance');
      return;
    }

    console.log('🔍 Starting webcam surveillance');

    const config = {
      webcamEnabled: true,
      screenCaptureEnabled: false,
      focusMonitoringEnabled: true,
      captureInterval: this.captureInterval,
      tentativeId: this.tentativeId,
    };

    this.surveillanceService.startMonitoring(config);
  }

  /**
   * Arrête la surveillance
   */
  stopSurveillance(): void {
    console.log('🛑 Stopping webcam surveillance');
    this.surveillanceService.stopMonitoring();
  }

  /**
   * Capture d'écran en plus de la webcam
   */
  captureScreen(): void {
    if (!this.tentativeId) {
      console.error('❌ Tentative ID required for screen capture');
      return;
    }

    console.log('🖥️ Capturing screen');

    this.surveillanceService.captureScreen(this.tentativeId).subscribe({
      next: (response) => {
        console.log('✅ Screen capture submitted');
        this.surveillanceEvent.emit({ type: 'screen_capture', success: true });
      },
      error: (error) => {
        console.error('❌ Screen capture failed:', error);
        this.surveillanceEvent.emit({
          type: 'screen_capture',
          success: false,
          error,
        });
      },
    });
  }

  /**
   * Vérification des permissions
   */
  private async checkPermissions(): Promise<void> {
    try {
      this.permissions = await this.surveillanceService.checkPermissions();
      console.log('🔐 Permissions checked:', this.permissions);
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
    }
  }

  /**
   * Demande les permissions
   */
  async requestPermissions(): Promise<void> {
    try {
      const granted = await this.surveillanceService.requestPermissions();
      if (granted) {
        await this.checkPermissions();
        console.log('✅ Permissions granted');
      } else {
        console.warn('⚠️ Permissions denied');
      }
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
    }
  }

  /**
   * Soumet l'image à la surveillance
   */
  private submitToSurveillance(image: WebcamImage): void {
    this.surveillanceService
      .captureWebcam(image.imageAsDataUrl, this.tentativeId)
      .subscribe({
        next: (response) => {
          console.log('✅ Webcam image submitted to surveillance');
          this.surveillanceEvent.emit({
            type: 'webcam_capture',
            success: true,
            imageId: response.id,
          });
        },
        error: (error) => {
          console.error('❌ Failed to submit webcam image:', error);
          this.surveillanceEvent.emit({
            type: 'webcam_capture',
            success: false,
            error,
          });
        },
      });
  }

  /**
   * Configuration de l'écoute des captures automatiques
   */
  private setupAutomaticCaptureListener(): void {
    window.addEventListener('automaticWebcamCapture', (event: any) => {
      const { tentativeId } = event.detail;
      if (tentativeId === this.tentativeId) {
        console.log('🤖 Automatic webcam capture triggered');
        this.triggerSnapshot();
      }
    });
  }

  /**
   * Démarrage de la capture automatique
   */
  private startAutomaticCapture(): void {
    console.log('⏰ Starting automatic capture');
    this.startSurveillance();
  }

  /**
   * Arrêt de la capture automatique
   */
  private stopAutomaticCapture(): void {
    console.log('⏹️ Stopping automatic capture');
    this.stopSurveillance();
  }

  /**
   * Basculer l'affichage de la webcam
   */
  toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
    console.log('👁️ Webcam display toggled:', this.showWebcam);
  }

  /**
   * Effacer l'historique des captures
   */
  clearHistory(): void {
    this.captureHistory = [];
    this.webcamImage = null;
    console.log('🗑️ Capture history cleared');
  }

  /**
   * Obtenir le statut de la surveillance
   */
  getSurveillanceStatus(): string {
    if (!this.isMonitoring) return 'Inactive';
    if (!this.permissions.camera) return 'Permissions manquantes';
    return 'Active';
  }

  /**
   * Vérifier si les permissions sont accordées
   */
  get hasPermissions(): boolean {
    return this.permissions.camera;
  }

  /**
   * Obtenir le nombre d'images capturées
   */
  get captureCount(): number {
    return this.captureHistory.length;
  }
}
