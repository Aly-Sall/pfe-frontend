// Amélioration du service CandidatesService pour le développement
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Candidate {
  id: number;
  nom: string;
  email: string;
  mdp?: string;
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
  private apiUrl = 'api/candidates';

  // Stockage local pour le développement
  private localCandidates: Candidate[] = [
    {
      id: 1,
      nom: 'John Doe',
      email: 'john@example.com',
      date: new Date('2023-01-15'),
      testsCount: 3,
      scoreObtenu: 85,
      status: 'active',
    },
    {
      id: 2,
      nom: 'Jane Smith',
      email: 'jane@example.com',
      date: new Date('2023-02-20'),
      testsCount: 2,
      scoreObtenu: 72,
      status: 'completed',
    },
    {
      id: 3,
      nom: 'Bob Johnson',
      email: 'bob@example.com',
      date: new Date('2023-03-10'),
      testsCount: 1,
      scoreObtenu: 45,
      status: 'pending',
    },
  ];

  // Mode développement local (sans API)
  private devMode = true;

  constructor(private http: HttpClient) {}

  // Récupérer tous les candidats avec pagination
  getCandidates(
    page: number = 1,
    perPage: number = 10
  ): Observable<PaginatedResponse<Candidate>> {
    if (this.devMode) {
      // Implémentation locale pour développement
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedData = this.localCandidates.slice(startIndex, endIndex);

      return of({
        data: paginatedData,
        totalItems: this.localCandidates.length,
        currentPage: page,
        itemsPerPage: perPage,
      });
    }

    // Implémentation API réelle
    const params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    return this.http
      .get<PaginatedResponse<Candidate>>(this.apiUrl, { params })
      .pipe(
        map((response) => {
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
    if (this.devMode) {
      // Calcul des statistiques locales
      const total = this.localCandidates.length;
      const active = this.localCandidates.filter(
        (c) => c.status === 'active'
      ).length;
      const completed = this.localCandidates.filter(
        (c) => c.status === 'completed'
      ).length;
      const withScores = this.localCandidates.filter(
        (c) => c.scoreObtenu !== undefined && c.scoreObtenu !== null
      );
      const successRate =
        withScores.length > 0
          ? (withScores.filter((c) => (c.scoreObtenu || 0) >= 70).length /
              withScores.length) *
            100
          : 0;

      return of({
        total,
        active,
        completed,
        successRate: Math.round(successRate),
      });
    }

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
    if (this.devMode) {
      // Filtrage local
      const filteredCandidates = this.localCandidates.filter(
        (c) =>
          c.nom.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase())
      );

      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedData = filteredCandidates.slice(startIndex, endIndex);

      return of({
        data: paginatedData,
        totalItems: filteredCandidates.length,
        currentPage: page,
        itemsPerPage: perPage,
      });
    }

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
    if (this.devMode) {
      const candidate = this.localCandidates.find((c) => c.id === id);
      if (candidate) {
        return of({ ...candidate });
      }
      return of({
        id: 0,
        nom: '',
        email: '',
        date: new Date(),
        status: 'active',
      });
    }

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
    console.log('Creating candidate:', candidate);

    if (this.devMode) {
      // Génération d'un nouvel ID
      const maxId = this.localCandidates.reduce(
        (max, c) => Math.max(max, c.id),
        0
      );
      const newCandidate: Candidate = {
        ...candidate,
        id: maxId + 1,
        date: new Date(candidate.date), // S'assurer que c'est un objet Date
      };

      // Ajouter au stockage local
      this.localCandidates.unshift(newCandidate);
      console.log('Local candidates after adding:', this.localCandidates);

      return of(newCandidate);
    }

    return this.http
      .post<Candidate>(this.apiUrl, candidate)
      .pipe(catchError(this.handleError<Candidate>('createCandidate')));
  }

  // Mettre à jour un candidat
  updateCandidate(candidate: Candidate): Observable<Candidate> {
    console.log('Updating candidate:', candidate);

    if (this.devMode) {
      const index = this.localCandidates.findIndex(
        (c) => c.id === candidate.id
      );
      if (index !== -1) {
        // Mettre à jour le candidat
        this.localCandidates[index] = {
          ...candidate,
          date: new Date(candidate.date), // S'assurer que c'est un objet Date
        };
        console.log('Local candidates after updating:', this.localCandidates);
        return of(this.localCandidates[index]);
      }
      return of(candidate);
    }

    return this.http
      .put<Candidate>(`${this.apiUrl}/${candidate.id}`, candidate)
      .pipe(catchError(this.handleError<Candidate>('updateCandidate')));
  }

  // Supprimer un candidat
  deleteCandidate(id: number): Observable<any> {
    console.log('Deleting candidate with ID:', id);

    if (this.devMode) {
      // Supprimer du stockage local
      this.localCandidates = this.localCandidates.filter((c) => c.id !== id);
      console.log('Local candidates after deleting:', this.localCandidates);
      return of({ success: true });
    }

    return this.http
      .delete(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError<any>('deleteCandidate')));
  }

  // Récupérer les résultats des tests d'un candidat
  getCandidateResults(id: number): Observable<any[]> {
    if (this.devMode) {
      // Résultats simulés pour le développement
      return of([
        { testName: 'Test technique', date: new Date(), score: 85 },
        { testName: 'Test logique', date: new Date(), score: 72 },
      ]);
    }

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
      return of(result as T);
    };
  }
}
