// candidates.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Candidate {
  id: number;
  nom: string;
  email: string;
  mdp?: string; // Pour la création, pas renvoyé lors de la récupération
  date: Date;
  testsCount?: number;
  scoreObtenu?: number;
  status?: 'active' | 'completed' | 'pending';
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface CandidateStatistics {
  total: number;
  active: number;
  completed: number;
  successRate: number;
}

@Injectable({
  providedIn: 'root',
})
export class CandidatesService {
  private apiUrl = 'api/candidates'; // À remplacer par l'URL de votre API

  constructor(private http: HttpClient) {}

  // Récupérer tous les candidats avec pagination
  getCandidates(
    page: number = 1,
    perPage: number = 10
  ): Observable<PaginatedResponse<Candidate>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http
      .get<PaginatedResponse<Candidate>>(this.apiUrl, { params })
      .pipe(
        map((response) => {
          // Conversion des dates string en objets Date
          response.data = response.data.map((candidate) => ({
            ...candidate,
            date: new Date(candidate.date),
          }));
          return response;
        }),
        catchError(
          this.handleError<PaginatedResponse<Candidate>>('getCandidates', {
            data: [],
            totalItems: 0,
            currentPage: page,
            itemsPerPage: perPage,
          })
        )
      );
  }

  // Récupérer des statistiques sur les candidats
  getCandidatesStatistics(): Observable<CandidateStatistics> {
    return this.http.get<CandidateStatistics>(`${this.apiUrl}/statistics`).pipe(
      catchError(
        this.handleError<CandidateStatistics>('getCandidatesStatistics', {
          total: 0,
          active: 0,
          completed: 0,
          successRate: 0,
        })
      )
    );
  }

  // Rechercher des candidats
  searchCandidates(
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<PaginatedResponse<Candidate>> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http
      .get<PaginatedResponse<Candidate>>(`${this.apiUrl}/search`, { params })
      .pipe(
        map((response) => {
          response.data = response.data.map((candidate) => ({
            ...candidate,
            date: new Date(candidate.date),
          }));
          return response;
        }),
        catchError(
          this.handleError<PaginatedResponse<Candidate>>('searchCandidates', {
            data: [],
            totalItems: 0,
            currentPage: page,
            itemsPerPage: perPage,
          })
        )
      );
  }

  // Récupérer un candidat par son ID
  getCandidate(id: number): Observable<Candidate> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Candidate>(url).pipe(
      map((candidate) => ({
        ...candidate,
        date: new Date(candidate.date),
      })),
      catchError(this.handleError<Candidate>(`getCandidate id=${id}`))
    );
  }

  // Créer un nouveau candidat
  createCandidate(candidate: Candidate): Observable<Candidate> {
    return this.http
      .post<Candidate>(this.apiUrl, candidate)
      .pipe(catchError(this.handleError<Candidate>('createCandidate')));
  }

  // Mettre à jour un candidat
  updateCandidate(candidate: Candidate): Observable<Candidate> {
    return this.http
      .put<Candidate>(`${this.apiUrl}/${candidate.id}`, candidate)
      .pipe(catchError(this.handleError<Candidate>('updateCandidate')));
  }

  // Supprimer un candidat
  deleteCandidate(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError<any>('deleteCandidate')));
  }

  // Récupérer les résultats des tests d'un candidat
  getCandidateResults(id: number): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/${id}/results`)
      .pipe(
        catchError(this.handleError<any[]>(`getCandidateResults id=${id}`, []))
      );
  }

  // Gestion des erreurs
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Vous pouvez ajouter ici une notification d'erreur via un service de notification

      // Retourne un résultat vide pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
}
