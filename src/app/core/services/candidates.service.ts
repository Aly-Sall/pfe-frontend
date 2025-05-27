// src/app/core/services/candidates.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/candidates`; // À implémenter côté backend
  private useMockData = true; // Changer à false quand l'API sera prête

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
    {
      id: 4,
      nom: 'Alice Brown',
      email: 'alice@example.com',
      date: new Date('2023-04-05'),
      testsCount: 4,
      scoreObtenu: 92,
      status: 'active',
    },
    {
      id: 5,
      nom: 'Charlie Wilson',
      email: 'charlie@example.com',
      date: new Date('2023-05-12'),
      testsCount: 2,
      scoreObtenu: 67,
      status: 'completed',
    },
  ];

  constructor(private http: HttpClient) {}

  // Récupérer tous les candidats avec pagination
  getCandidates(
    page: number = 1,
    perPage: number = 10
  ): Observable<PaginatedResponse<Candidate>> {
    if (this.useMockData) {
      return this.getMockCandidatesPaginated(page, perPage);
    }

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
        catchError((error) => {
          console.error('Error fetching candidates:', error);
          return this.getMockCandidatesPaginated(page, perPage);
        })
      );
  }

  // Récupérer des statistiques sur les candidats
  getCandidatesStatistics(): Observable<CandidateStatistics> {
    if (this.useMockData) {
      return this.getMockStatistics();
    }

    return this.http.get<CandidateStatistics>(`${this.apiUrl}/statistics`).pipe(
      catchError((error) => {
        console.error('Error fetching statistics:', error);
        return this.getMockStatistics();
      })
    );
  }

  // Rechercher des candidats
  searchCandidates(
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<PaginatedResponse<Candidate>> {
    if (this.useMockData) {
      return this.getMockSearchResults(query, page, perPage);
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
        catchError((error) => {
          console.error('Error searching candidates:', error);
          return this.getMockSearchResults(query, page, perPage);
        })
      );
  }

  // Récupérer un candidat par son ID
  getCandidate(id: number): Observable<Candidate> {
    if (this.useMockData) {
      const candidate = this.localCandidates.find((c) => c.id === id);
      return of(candidate || this.getDefaultCandidate());
    }

    return this.http.get<Candidate>(`${this.apiUrl}/${id}`).pipe(
      map((candidate) => ({
        ...candidate,
        date: new Date(candidate.date),
      })),
      catchError((error) => {
        console.error(`Error fetching candidate ${id}:`, error);
        return of(this.getDefaultCandidate());
      })
    );
  }

  // Créer un nouveau candidat
  createCandidate(candidate: Candidate): Observable<Candidate> {
    console.log('Creating candidate:', candidate);

    if (this.useMockData) {
      const maxId = this.localCandidates.reduce(
        (max, c) => Math.max(max, c.id),
        0
      );
      const newCandidate: Candidate = {
        ...candidate,
        id: maxId + 1,
        date: new Date(candidate.date),
        testsCount: 0,
        scoreObtenu: 0,
      };

      this.localCandidates.unshift(newCandidate);
      console.log('Mock: Created candidate:', newCandidate);
      return of(newCandidate);
    }

    return this.http.post<Candidate>(this.apiUrl, candidate).pipe(
      tap((created) => console.log('API: Created candidate:', created)),
      catchError((error) => {
        console.error('Error creating candidate:', error);
        throw error;
      })
    );
  }

  // Mettre à jour un candidat
  updateCandidate(candidate: Candidate): Observable<Candidate> {
    console.log('Updating candidate:', candidate);

    if (this.useMockData) {
      const index = this.localCandidates.findIndex(
        (c) => c.id === candidate.id
      );
      if (index !== -1) {
        this.localCandidates[index] = {
          ...candidate,
          date: new Date(candidate.date),
        };
        console.log('Mock: Updated candidate:', this.localCandidates[index]);
        return of(this.localCandidates[index]);
      }
      return of(candidate);
    }

    return this.http
      .put<Candidate>(`${this.apiUrl}/${candidate.id}`, candidate)
      .pipe(
        tap((updated) => console.log('API: Updated candidate:', updated)),
        catchError((error) => {
          console.error('Error updating candidate:', error);
          throw error;
        })
      );
  }

  // Supprimer un candidat
  deleteCandidate(id: number): Observable<any> {
    console.log('Deleting candidate with ID:', id);

    if (this.useMockData) {
      this.localCandidates = this.localCandidates.filter((c) => c.id !== id);
      console.log(
        'Mock: Deleted candidate, remaining:',
        this.localCandidates.length
      );
      return of({ success: true });
    }

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('API: Deleted candidate')),
      catchError((error) => {
        console.error('Error deleting candidate:', error);
        throw error;
      })
    );
  }

  // Récupérer les résultats des tests d'un candidat
  getCandidateResults(id: number): Observable<any[]> {
    if (this.useMockData) {
      return of([
        { testName: 'Test technique', date: new Date(), score: 85 },
        { testName: 'Test logique', date: new Date(), score: 72 },
      ]);
    }

    return this.http.get<any[]>(`${this.apiUrl}/${id}/results`).pipe(
      catchError((error) => {
        console.error(`Error fetching results for candidate ${id}:`, error);
        return of([]);
      })
    );
  }

  // === MÉTHODES MOCK ===

  private getMockCandidatesPaginated(
    page: number,
    perPage: number
  ): Observable<PaginatedResponse<Candidate>> {
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

  private getMockStatistics(): Observable<CandidateStatistics> {
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
        ? Math.round(
            (withScores.filter((c) => (c.scoreObtenu || 0) >= 70).length /
              withScores.length) *
              100
          )
        : 0;

    return of({
      total,
      active,
      completed,
      successRate,
    });
  }

  private getMockSearchResults(
    query: string,
    page: number,
    perPage: number
  ): Observable<PaginatedResponse<Candidate>> {
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

  private getDefaultCandidate(): Candidate {
    return {
      id: 0,
      nom: '',
      email: '',
      date: new Date(),
      status: 'active',
      testsCount: 0,
      scoreObtenu: 0,
    };
  }

  // Méthode pour activer/désactiver l'utilisation de l'API réelle
  setUseRealApi(useRealApi: boolean): void {
    this.useMockData = !useRealApi;
    console.log(
      `Candidates service ${useRealApi ? 'using real API' : 'using mock data'}`
    );
  }
}
