// candidates.component.ts
import { Component, OnInit } from '@angular/core';
import {
  CandidatesService,
  Candidate,
  PaginatedResponse,
  CandidateStatistics,
} from '../../../core/services/candidates.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.scss'],
})
export class CandidatesComponent implements OnInit {
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

  constructor(
    private candidatesService: CandidatesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCandidates();
    this.loadStatistics();
  }

  loadCandidates(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;

    this.candidatesService
      .getCandidates(page, this.itemsPerPage)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (response: PaginatedResponse<Candidate>) => {
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
    this.candidatesService.getCandidatesStatistics().subscribe(
      (stats: CandidateStatistics) => {
        this.totalCandidates = stats.total || 0;
        this.activeCandidates = stats.active || 0;
        this.successRate = stats.successRate || 0;
      },
      (error: any) => {
        console.error('Erreur lors du chargement des statistiques', error);
      }
    );
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

  viewResults(id: number): void {
    this.router.navigate(['/candidates', id, 'results']);
  }

  editCandidate(id: number): void {
    this.router.navigate(['/candidates', id, 'edit']);
  }

  deleteCandidate(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
      this.candidatesService.deleteCandidate(id).subscribe(
        () => {
          this.loadCandidates(this.currentPage);
          this.loadStatistics();
        },
        (error: any) => {
          console.error('Erreur lors de la suppression du candidat', error);
        }
      );
    }
  }
}
