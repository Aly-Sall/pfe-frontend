// candidates.component.ts (mise à jour)
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  CandidatesService,
  Candidate,
  PaginatedResponse,
  CandidateStatistics,
} from '../../../core/services/candidates.service';
import { CandidateEventService } from '../../../core/services/candidate-event.service';

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.scss'],
})
export class CandidatesComponent implements OnInit, OnDestroy, AfterViewInit {
  candidates: Candidate[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;
  pages: number[] = [];

  // Statistiques
  totalCandidates: number = 0;
  activeCandidates: number = 0;
  successRate: number = 0;

  // Pour le filtrage (recherche)
  searchQuery: string = '';

  // Abonnements
  private subscriptions: Subscription[] = [];

  // Flag pour vérifier si on vient d'ajouter un candidat
  private comingFromAdd: boolean = false;

  constructor(
    private candidatesService: CandidatesService,
    private candidateEventService: CandidateEventService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('CandidatesComponent constructor');
  }

  ngOnInit(): void {
    console.log('CandidatesComponent ngOnInit');
    this.loadCandidates();
    this.loadStatistics();

    // S'abonner aux événements de candidats
    this.subscriptions.push(
      this.candidateEventService.candidateAdded$.subscribe((candidate) => {
        console.log('Event received: candidateAdded', candidate);
        // Option 1: Ajouter directement le candidat à la liste
        if (this.currentPage === 1) {
          this.candidates = [candidate, ...this.candidates];
          // Ajuster le nombre total
          this.totalItems++;
          console.log('Added candidate to list, new list:', this.candidates);
        }
        // Option 2: Recharger la liste complète
        else {
          this.loadCandidates(1); // Retourner à la première page pour voir le nouveau candidat
        }
        // Mettre à jour les statistiques
        this.loadStatistics();
      })
    );

    this.subscriptions.push(
      this.candidateEventService.candidateUpdated$.subscribe(
        (updatedCandidate) => {
          console.log('Event received: candidateUpdated', updatedCandidate);
          // Mettre à jour le candidat dans la liste locale
          const index = this.candidates.findIndex(
            (c) => c.id === updatedCandidate.id
          );
          if (index !== -1) {
            this.candidates[index] = updatedCandidate;
            console.log(
              'Updated candidate in list, new list:',
              this.candidates
            );
          }
          // Mettre à jour les statistiques
          this.loadStatistics();
        }
      )
    );

    this.subscriptions.push(
      this.candidateEventService.refreshList$.subscribe(() => {
        console.log('Event received: refreshList');
        this.comingFromAdd = true;
        this.loadCandidates(this.currentPage);
        this.loadStatistics();
      })
    );

    // Vérifier les paramètres de requête pour rafraîchir si nécessaire
    this.route.queryParams.subscribe((params) => {
      if (params['refresh'] === 'true') {
        console.log('Refresh parameter detected in URL');
        this.loadCandidates(this.currentPage);
        this.loadStatistics();
      }
    });
  }

  ngAfterViewInit(): void {
    console.log('CandidatesComponent ngAfterViewInit');

    // Vérifier s'il y a un candidat récemment ajouté
    setTimeout(() => {
      const lastAddedCandidate =
        this.candidateEventService.getLastAddedCandidate();
      if (lastAddedCandidate && this.comingFromAdd) {
        console.log('Found last added candidate:', lastAddedCandidate);

        // Vérifier si le candidat existe déjà dans la liste
        const exists = this.candidates.some(
          (c) => c.id === lastAddedCandidate.id
        );
        if (!exists) {
          console.log('Adding last candidate to the beginning of the list');
          this.candidates = [lastAddedCandidate, ...this.candidates];
          this.totalItems++;
        }

        // Effacer le candidat stocké après l'avoir utilisé
        this.candidateEventService.clearLastAddedCandidate();
        this.comingFromAdd = false;
      }
    }, 0);
  }

  ngOnDestroy(): void {
    console.log('CandidatesComponent ngOnDestroy');
    // Se désabonner pour éviter les fuites de mémoire
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadCandidates(page: number = 1): void {
    console.log('Loading candidates for page', page);
    this.loading = true;
    this.currentPage = page;

    const request = this.searchQuery
      ? this.candidatesService.searchCandidates(
          this.searchQuery,
          page,
          this.itemsPerPage
        )
      : this.candidatesService.getCandidates(page, this.itemsPerPage);

    request
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('Finished loading candidates');
        })
      )
      .subscribe(
        (response: PaginatedResponse<Candidate>) => {
          console.log('Candidates loaded:', response);
          this.candidates = response.data;
          this.totalItems = response.totalItems;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.generatePagination();
        },
        (error: any) => {
          this.error =
            'Erreur lors du chargement des candidats. Veuillez réessayer.';
          console.error('Erreur lors du chargement des candidats', error);
        }
      );
  }

  loadStatistics(): void {
    console.log('Loading statistics');
    this.candidatesService.getCandidatesStatistics().subscribe(
      (stats: CandidateStatistics) => {
        console.log('Statistics loaded:', stats);
        this.totalCandidates = stats.total || 0;
        this.activeCandidates = stats.active || 0;
        this.successRate = stats.successRate || 0;
      },
      (error: any) => {
        console.error('Erreur lors du chargement des statistiques', error);
      }
    );
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  }

  generatePagination(): void {
    const maxVisiblePages: number = 5;
    const halfVisible: number = Math.floor(maxVisiblePages / 2);

    let startPage: number = Math.max(this.currentPage - halfVisible, 1);
    let endPage: number = Math.min(
      startPage + maxVisiblePages - 1,
      this.totalPages
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    this.pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  getScoreClass(score: number): string {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  search(): void {
    console.log('Searching with query:', this.searchQuery);
    this.loadCandidates(1); // Réinitialiser à la première page pour la recherche
  }

  clearSearch(): void {
    console.log('Clearing search');
    this.searchQuery = '';
    this.loadCandidates(1);
  }

  viewResults(id: number): void {
    console.log('Viewing results for candidate', id);
    this.router.navigate(['/candidates', id, 'results']);
  }

  editCandidate(id: number): void {
    console.log('Editing candidate', id);
    this.router.navigate(['/candidates', id, 'edit']);
  }

  deleteCandidate(id: number): void {
    console.log('Attempting to delete candidate', id);
    if (confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
      this.candidatesService.deleteCandidate(id).subscribe(
        () => {
          console.log('Candidate deleted successfully');
          // Supprimer le candidat de la liste locale
          this.candidates = this.candidates.filter((c) => c.id !== id);

          // Mettre à jour le nombre total
          this.totalItems--;

          // Si la page actuelle est vide, revenir à la page précédente
          if (this.candidates.length === 0 && this.currentPage > 1) {
            this.loadCandidates(this.currentPage - 1);
          }

          // Mettre à jour les statistiques
          this.loadStatistics();
        },
        (error: any) => {
          console.error('Erreur lors de la suppression du candidat', error);
        }
      );
    }
  }
}
