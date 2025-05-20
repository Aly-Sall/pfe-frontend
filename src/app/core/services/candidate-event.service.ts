// core/services/candidate-event.service.ts (amélioré)
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Candidate } from './candidates.service';

@Injectable({
  providedIn: 'root',
})
export class CandidateEventService {
  // Un BehaviorSubject conserve la dernière valeur et la fournit immédiatement aux nouveaux abonnés
  private candidateAddedSource = new Subject<Candidate>();
  private candidateUpdatedSource = new Subject<Candidate>();
  private refreshListSource = new Subject<void>();

  // Stocker le dernier candidat ajouté pour éviter les problèmes de timing
  private lastAddedCandidate: Candidate | null = null;

  // Observable que les composants peuvent souscrire
  candidateAdded$ = this.candidateAddedSource.asObservable();
  candidateUpdated$ = this.candidateUpdatedSource.asObservable();
  refreshList$ = this.refreshListSource.asObservable();

  // Méthode pour émettre un événement d'ajout de candidat
  notifyCandidateAdded(candidate: Candidate): void {
    console.log('CandidateEventService: notifyCandidateAdded', candidate);
    this.lastAddedCandidate = candidate;
    this.candidateAddedSource.next(candidate);
  }

  // Méthode pour émettre un événement de mise à jour de candidat
  notifyCandidateUpdated(candidate: Candidate): void {
    console.log('CandidateEventService: notifyCandidateUpdated', candidate);
    this.candidateUpdatedSource.next(candidate);
  }

  // Méthode pour demander un rafraîchissement de la liste
  notifyRefreshList(): void {
    console.log('CandidateEventService: notifyRefreshList');
    this.refreshListSource.next();
  }

  // Récupérer le dernier candidat ajouté
  getLastAddedCandidate(): Candidate | null {
    return this.lastAddedCandidate;
  }

  // Effacer le dernier candidat ajouté
  clearLastAddedCandidate(): void {
    this.lastAddedCandidate = null;
  }
}
