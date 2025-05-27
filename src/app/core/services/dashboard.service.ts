import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Test {
  id: number;
  titre: string;
  description: string;
  duree: number;
  type: string;
  etat: string;
  candidats?: number;
  scoresMoyens?: number;
}

export interface Tentative {
  id: number;
  scoreObtenu: number;
  date: Date;
  testId: number;
  candidatId: number;
}

export interface DashboardStats {
  totalCandidates: number;
  activeTests: number;
  averageScore: number;
  recentTests: any[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = environment.apiUrl;
  private useMockData = true; // Changer à false quand l'API sera prête

  constructor(private http: HttpClient) {}

  // Récupérer toutes les statistiques en une fois
  getDashboardStats(): Observable<DashboardStats> {
    if (this.useMockData) {
      return this.getMockDashboardStats();
    }

    // Quand l'API sera prête, appeler les vrais endpoints
    return forkJoin({
      candidates: this.getNombreCandidats(),
      activeTests: this.getNombreTestsActifs(),
      averageScore: this.getScoreMoyen(),
      recentTests: this.getTestsRecents(),
    }).pipe(
      map((data) => ({
        totalCandidates: data.candidates,
        activeTests: data.activeTests,
        averageScore: data.averageScore,
        recentTests: data.recentTests,
      })),
      catchError(() => this.getMockDashboardStats())
    );
  }

  getNombreCandidats(): Observable<number> {
    if (this.useMockData) {
      return of(1482);
    }

    return this.http.get<any>(`${this.apiUrl}/candidates/count`).pipe(
      map((response) => response.count || 0),
      catchError(() => of(1482))
    );
  }

  getNombreTestsActifs(): Observable<number> {
    if (this.useMockData) {
      return of(42);
    }

    return this.http.get<any>(`${this.apiUrl}/QuizTest/active/count`).pipe(
      map((response) => response.count || 0),
      catchError(() => of(42))
    );
  }

  getScoreMoyen(): Observable<number> {
    if (this.useMockData) {
      return of(78);
    }

    return this.http.get<any>(`${this.apiUrl}/Tentative/average-score`).pipe(
      map((response) => response.averageScore || 0),
      catchError(() => of(78))
    );
  }

  getTestsRecents(): Observable<any[]> {
    if (this.useMockData) {
      return of([
        {
          name: 'Technical Assessment',
          candidates: 245,
          status: 'Active',
          averageScore: 82,
        },
        {
          name: 'Coding Challenge',
          candidates: 178,
          status: 'Active',
          averageScore: 75,
        },
        {
          name: 'Aptitude Test',
          candidates: 312,
          status: 'Completed',
          averageScore: 79,
        },
      ]);
    }

    return this.http.get<any[]>(`${this.apiUrl}/QuizTest/recent`).pipe(
      catchError(() =>
        of([
          {
            name: 'Technical Assessment',
            candidates: 245,
            status: 'Active',
            averageScore: 82,
          },
        ])
      )
    );
  }

  private getMockDashboardStats(): Observable<DashboardStats> {
    return of({
      totalCandidates: 1482,
      activeTests: 42,
      averageScore: 78,
      recentTests: [
        {
          name: 'Technical Assessment',
          candidates: 245,
          status: 'Active',
          averageScore: 82,
        },
        {
          name: 'Coding Challenge',
          candidates: 178,
          status: 'Active',
          averageScore: 75,
        },
        {
          name: 'Aptitude Test',
          candidates: 312,
          status: 'Completed',
          averageScore: 79,
        },
      ],
    });
  }

  // Méthode pour activer/désactiver l'utilisation de l'API réelle
  setUseRealApi(useRealApi: boolean): void {
    this.useMockData = !useRealApi;
    console.log(
      `Dashboard service ${useRealApi ? 'using real API' : 'using mock data'}`
    );
  }
}
