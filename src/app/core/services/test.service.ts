// src/app/core/services/test.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TestResponse {
  isSuccess: boolean;
  error?: string;
  errors?: string[];
  id?: number;
  value?: any;
}

export interface TestDto {
  id?: number;
  title: string;
  category: number; // 0: None, 1: General, 2: Technical
  mode: number; // 0: Training, 1: Recruitment
  tryAgain: boolean;
  showTimer: boolean;
  level: number; // 0: Easy, 1: Medium, 2: Hard
  isActive?: boolean;
  duration?: number;
}

export interface QuestionDto {
  id?: number;
  content: string;
  type: number; // 0: SingleChoice, 1: MultiChoice
  answerDetails?: string;
  quizTestId: number;
  reponses?: ResponseDto[];
  choices?: QuestionChoice[];
  listOfCorrectAnswerIds?: string;
}

export interface ResponseDto {
  id?: number;
  content: string;
  questionId?: number;
}

export interface QuestionChoice {
  id: number;
  content: string;
}

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private apiUrl = `${environment.apiUrl}/QuizTest`;
  private questionsUrl = `${environment.apiUrl}/Questions`;

  constructor(private http: HttpClient) {}

  // Get a single test by ID
  getTestById(id: number): Observable<TestDto> {
    return this.http
      .get<TestResponse>(`${this.apiUrl}/by-id/${id}?Id=${id}`)
      .pipe(
        map((response) => {
          if (!response.isSuccess) {
            throw new Error(response.error || 'Failed to load test');
          }
          return response.value;
        }),
        catchError((error) => {
          console.error('Error loading test:', error);
          throw error;
        })
      );
  }

  // Get all tests (pour l'affichage dans TestsComponent)
  getAllTests(): Observable<TestDto[]> {
    // Note: Il faut ajouter un endpoint pour récupérer tous les tests
    // Pour l'instant, on peut créer quelques tests factices ou utiliser l'endpoint existant
    return this.http.get<TestDto[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error loading all tests:', error);
        // Retourner des données mock en cas d'erreur
        return this.getMockTests();
      })
    );
  }

  // Get questions for a specific test
  getTestQuestions(testId: number): Observable<QuestionDto[]> {
    return this.http
      .get<QuestionDto[]>(
        `${this.questionsUrl}/GetQuestionsByTestId?Id=${testId}`
      )
      .pipe(
        catchError((error) => {
          console.error('Error loading questions:', error);
          throw error;
        })
      );
  }

  // Create a new test
  createTest(test: TestDto): Observable<TestResponse> {
    const createCommand = {
      title: test.title,
      category: test.category,
      mode: test.mode,
      tryAgain: test.tryAgain,
      showTimer: test.showTimer,
      level: test.level,
    };

    return this.http.post<TestResponse>(this.apiUrl, createCommand).pipe(
      catchError((error) => {
        console.error('Error creating test:', error);
        throw error;
      })
    );
  }

  // Update an existing test
  updateTest(test: TestDto): Observable<any> {
    const updateCommand = {
      id: test.id,
      title: test.title,
      category: test.category,
      mode: test.mode,
      showTimer: test.showTimer,
    };

    return this.http.put(`${this.apiUrl}/${test.id}`, updateCommand).pipe(
      catchError((error) => {
        console.error('Error updating test:', error);
        throw error;
      })
    );
  }

  // Delete a test (à implémenter côté backend)
  deleteTest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Error deleting test:', error);
        throw error;
      })
    );
  }

  // Get test by access token
  getTestByToken(token: string): Observable<TestDto> {
    return this.http.get<TestDto>(`${this.apiUrl}/by-token/${token}`).pipe(
      catchError((error) => {
        console.error('Error loading test by token:', error);
        throw error;
      })
    );
  }

  // Fallback mock data
  private getMockTests(): Observable<TestDto[]> {
    const mockTests: TestDto[] = [
      {
        id: 1,
        title: 'Technical Assessment',
        category: 2,
        mode: 0,
        isActive: true,
        showTimer: true,
        tryAgain: false,
        level: 1,
      },
      {
        id: 2,
        title: 'General Knowledge Quiz',
        category: 1,
        mode: 0,
        isActive: true,
        showTimer: false,
        tryAgain: true,
        level: 0,
      },
    ];

    return new Observable((observer) => {
      observer.next(mockTests);
      observer.complete();
    });
  }
}
