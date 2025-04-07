import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

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

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  type: 'admin' | 'candidat' | 'RH';
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = 'api'; // Remplacer par votre URL d'API

  constructor(private http: HttpClient) {}

  // Pour le développement, utilisons des données fictives
  // En production, remplacez ces méthodes par de vraies requêtes API

  getNombreCandidats(): Observable<number> {
    // Simuler une requête API avec des données fictives
    return of(1482).pipe(
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération du nombre de candidats',
          error
        );
        return of(0);
      })
    );
  }

  getNombreTestsActifs(): Observable<number> {
    return of(42).pipe(
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération du nombre de tests actifs',
          error
        );
        return of(0);
      })
    );
  }

  getScoreMoyen(): Observable<number> {
    return of(78).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération du score moyen', error);
        return of(0);
      })
    );
  }

  getTestsRecents(): Observable<any[]> {
    // Données fictives pour les tests récents
    const mockTests = [
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
    ];

    return of(mockTests).pipe(
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des tests récents',
          error
        );
        return of([]);
      })
    );
  }

  // Implémentons ces méthodes pour utiliser l'API

  /*
  getNombreCandidats(): Observable<number> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/utilisateurs`).pipe(
      map(users => users.filter(user => user.type === 'candidat').length),
      catchError(error => {
        console.error('Erreur lors de la récupération du nombre de candidats', error);
        return of(0);
      })
    );
  }

  getTestsActifs(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/tests`).pipe(
      map(tests => tests.filter(test => test.etat === 'actif')),
      catchError(error => {
        console.error('Erreur lors de la récupération des tests actifs', error);
        return of([]);
      })
    );
  }

  getNombreTestsActifs(): Observable<number> {
    return this.getTestsActifs().pipe(
      map(tests => tests.length)
    );
  }

  getTentatives(): Observable<Tentative[]> {
    return this.http.get<Tentative[]>(`${this.apiUrl}/tentatives`).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des tentatives', error);
        return of([]);
      })
    );
  }

  getScoreMoyen(): Observable<number> {
    return this.getTentatives().pipe(
      map(tentatives => {
        if (tentatives.length === 0) return 0;
        const sommeScores = tentatives.reduce((sum, tentative) => sum + tentative.scoreObtenu, 0);
        return Math.round((sommeScores / tentatives.length) * 100);
      })
    );
  }

  getTestsRecents(): Observable<any[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/tests`).pipe(
      map(tests => {
        // Prendre les 3 derniers tests créés ou modifiés
        return tests.slice(0, 3).map(test => ({
          name: test.titre,
          candidates: test.candidats || 0,
          status: test.etat === 'actif' ? 'Active' : 'Completed',
          averageScore: test.scoresMoyens || 0
        }));
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des tests récents', error);
        return of([]);
      })
    );
  }
  */
}
