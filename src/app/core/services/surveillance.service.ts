// src/app/core/services/surveillance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, fromEvent, merge } from 'rxjs';
import { throttleTime, debounceTime, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SurveillanceEvent {
  type:
    | 'webcam_capture'
    | 'screen_capture'
    | 'focus_lost'
    | 'tab_switch'
    | 'suspicious_activity';
  timestamp: Date;
  data?: any;
  tentativeId: number;
}

export interface SurveillanceConfig {
  webcamEnabled: boolean;
  screenCaptureEnabled: boolean;
  focusMonitoringEnabled: boolean;
  captureInterval: number; // en secondes
  tentativeId: number;
}

@Injectable({
  providedIn: 'root',
})
export class SurveillanceService {
  private apiUrl = `${environment.apiUrl}/Surveillance`;

  private isMonitoringSubject = new BehaviorSubject<boolean>(false);
  private suspiciousActivitySubject = new BehaviorSubject<number>(0);
  private configSubject = new BehaviorSubject<SurveillanceConfig | null>(null);

  public isMonitoring$ = this.isMonitoringSubject.asObservable();
  public suspiciousActivityCount$ =
    this.suspiciousActivitySubject.asObservable();
  public config$ = this.configSubject.asObservable();

  private monitoringSubscriptions: any[] = [];
  private captureSubscription: any;
  private focusSubscription: any;

  constructor(private http: HttpClient) {
    this.setupFocusMonitoring();
  }

  /**
   * Démarre la surveillance avec la configuration donnée
   */
  startMonitoring(config: SurveillanceConfig): void {
    console.log('🔍 Starting surveillance monitoring', config);

    this.configSubject.next(config);
    this.isMonitoringSubject.next(true);

    // Surveillance webcam/écran automatique
    if (config.webcamEnabled || config.screenCaptureEnabled) {
      this.startAutomaticCapture(config);
    }

    // Surveillance du focus
    if (config.focusMonitoringEnabled) {
      this.startFocusMonitoring();
    }

    console.log('✅ Surveillance started successfully');
  }

  /**
   * Arrête toute surveillance
   */
  stopMonitoring(): void {
    console.log('🛑 Stopping surveillance monitoring');

    this.isMonitoringSubject.next(false);
    this.configSubject.next(null);

    // Nettoyer tous les abonnements
    this.monitoringSubscriptions.forEach((sub) => sub.unsubscribe());
    this.monitoringSubscriptions = [];

    if (this.captureSubscription) {
      this.captureSubscription.unsubscribe();
    }

    if (this.focusSubscription) {
      this.focusSubscription.unsubscribe();
    }

    console.log('✅ Surveillance stopped');
  }

  /**
   * Capture manuelle via webcam
   */
  captureWebcam(imageDataUrl: string, tentativeId: number): Observable<any> {
    const event: SurveillanceEvent = {
      type: 'webcam_capture',
      timestamp: new Date(),
      data: imageDataUrl,
      tentativeId,
    };

    return this.submitSurveillanceEvent(event);
  }

  /**
   * Capture d'écran
   */
  captureScreen(tentativeId: number): Observable<any> {
    return new Observable((observer) => {
      if ('getDisplayMedia' in navigator.mediaDevices) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true })
          .then((stream) => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            video.onloadedmetadata = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);

                const event: SurveillanceEvent = {
                  type: 'screen_capture',
                  timestamp: new Date(),
                  data: imageDataUrl,
                  tentativeId,
                };

                this.submitSurveillanceEvent(event).subscribe({
                  next: (result) => observer.next(result),
                  error: (error) => observer.error(error),
                });
              }

              // Arrêter le stream
              stream.getTracks().forEach((track) => track.stop());
            };
          })
          .catch((error) => {
            console.error("Erreur lors de la capture d'écran:", error);
            observer.error(error);
          });
      } else {
        observer.error('Screen capture not supported');
      }
    });
  }

  /**
   * Signaler une activité suspecte
   */
  reportSuspiciousActivity(
    activity: string,
    tentativeId: number
  ): Observable<any> {
    const currentCount = this.suspiciousActivitySubject.value + 1;
    this.suspiciousActivitySubject.next(currentCount);

    const event: SurveillanceEvent = {
      type: 'suspicious_activity',
      timestamp: new Date(),
      data: { activity, count: currentCount },
      tentativeId,
    };

    console.warn('⚠️ Suspicious activity detected:', activity);
    return this.submitSurveillanceEvent(event);
  }

  /**
   * Obtenir l'historique de surveillance
   */
  getSurveillanceHistory(tentativeId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/GetSurveiilancesByTentative?Id=${tentativeId}`
    );
  }

  /**
   * Démarre la capture automatique
   */
  private startAutomaticCapture(config: SurveillanceConfig): void {
    const intervalMs = config.captureInterval * 1000;

    this.captureSubscription = interval(intervalMs).subscribe(() => {
      if (this.isMonitoringSubject.value) {
        // Alternance entre webcam et capture d'écran
        const useWebcam = Math.random() > 0.5;

        if (config.webcamEnabled && useWebcam) {
          this.triggerAutomaticWebcamCapture(config.tentativeId);
        } else if (config.screenCaptureEnabled) {
          this.captureScreen(config.tentativeId).subscribe({
            next: () => console.log('📸 Automatic screen capture completed'),
            error: (error) =>
              console.error('❌ Automatic screen capture failed:', error),
          });
        }
      }
    });
  }

  /**
   * Déclenche une capture webcam automatique
   */
  private triggerAutomaticWebcamCapture(tentativeId: number): void {
    // Cette méthode sera appelée par le composant webcam
    console.log('📷 Triggering automatic webcam capture');

    // Émettre un événement pour que le composant webcam puisse l'intercepter
    window.dispatchEvent(
      new CustomEvent('automaticWebcamCapture', {
        detail: { tentativeId },
      })
    );
  }

  /**
   * Configuration de la surveillance du focus
   */
  private setupFocusMonitoring(): void {
    const visibilityChange$ = fromEvent(document, 'visibilitychange').pipe(
      map(() => ({
        type: document.hidden ? 'focus_lost' : 'focus_gained',
        timestamp: new Date(),
      }))
    );

    const windowBlur$ = fromEvent(window, 'blur').pipe(
      map(() => ({
        type: 'window_blur',
        timestamp: new Date(),
      }))
    );

    const windowFocus$ = fromEvent(window, 'focus').pipe(
      map(() => ({
        type: 'window_focus',
        timestamp: new Date(),
      }))
    );

    // Combiner tous les événements de focus
    const allFocusEvents$ = merge(visibilityChange$, windowBlur$, windowFocus$);

    this.focusSubscription = allFocusEvents$
      .pipe(
        debounceTime(500) // Éviter les événements trop fréquents
      )
      .subscribe((event) => {
        if (
          this.isMonitoringSubject.value &&
          this.configSubject.value?.focusMonitoringEnabled
        ) {
          this.handleFocusEvent(event);
        }
      });
  }

  /**
   * Démarre la surveillance du focus
   */
  private startFocusMonitoring(): void {
    // La surveillance du focus est déjà configurée dans setupFocusMonitoring
    console.log('👁️ Focus monitoring enabled');
  }

  /**
   * Gestion des événements de focus
   */
  private handleFocusEvent(event: any): void {
    const config = this.configSubject.value;
    if (!config) return;

    if (event.type === 'focus_lost' || event.type === 'window_blur') {
      this.reportSuspiciousActivity(
        'Perte de focus de la fenêtre',
        config.tentativeId
      ).subscribe({
        next: () => console.log('📊 Focus loss reported'),
        error: (error) =>
          console.error('❌ Failed to report focus loss:', error),
      });
    }
  }

  /**
   * Soumet un événement de surveillance au backend
   */
  private submitSurveillanceEvent(event: SurveillanceEvent): Observable<any> {
    const payload = {
      captureEcran: event.data || '',
      tentativeId: event.tentativeId,
    };

    return this.http.post<any>(this.apiUrl, payload);
  }

  /**
   * Vérifie si les permissions nécessaires sont disponibles
   */
  async checkPermissions(): Promise<{ camera: boolean; screen: boolean }> {
    const permissions = {
      camera: false,
      screen: false,
    };

    try {
      // Vérifier permission caméra
      const cameraPermission = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      permissions.camera = cameraPermission.state === 'granted';
    } catch (error) {
      console.warn('Cannot check camera permission:', error);
    }

    try {
      // Vérifier support capture d'écran
      permissions.screen = 'getDisplayMedia' in navigator.mediaDevices;
    } catch (error) {
      console.warn('Screen capture not supported:', error);
    }

    return permissions;
  }

  /**
   * Demande les permissions nécessaires
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Demander accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      return false;
    }
  }
}
