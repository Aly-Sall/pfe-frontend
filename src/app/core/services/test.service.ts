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

// Interface exactement alignée avec le backend CreateTestCommand
export interface CreateTestCommand {
  title: string;
  category: number; // 0: None, 1: General, 2: Technical
  mode: number; // 0: Training, 1: Recruitment
  tryAgain: boolean;
  showTimer: boolean;
  level: number; // 0: Easy, 1: Medium, 2: Hard
}

// Interface pour UpdateTestCommand (selon le backend)
export interface UpdateTestCommand {
  id: number;
  title: string;
  category: number;
  mode: number;
  showTimer: boolean;
}

export interface TestDto {
  id?: number;
  title: string;
  category: number;
  mode: number;
  tryAgain: boolean;
  showTimer: boolean;
  level: number;
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

  // Get all tests (à implémenter côté backend)
  getAllTests(): Observable<TestDto[]> {
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

  // Create a new test - utilise exactement l'interface CreateTestCommand du backend
  createTest(createCommand: CreateTestCommand): Observable<TestResponse> {
    console.log('Sending create test command to backend:', createCommand);

    // Validation des données avant envoi
    const validatedCommand: CreateTestCommand = {
      title: createCommand.title,
      category: Number(createCommand.category), // S'assurer que c'est un nombre
      mode: Number(createCommand.mode), // S'assurer que c'est un nombre
      tryAgain: Boolean(createCommand.tryAgain),
      showTimer: Boolean(createCommand.showTimer),
      level: Number(createCommand.level), // S'assurer que c'est un nombre
    };

    console.log('Validated command:', validatedCommand);

    return this.http.post<TestResponse>(this.apiUrl, validatedCommand).pipe(
      map((response) => {
        console.log('Create test response from backend:', response);
        return response;
      }),
      catchError((error) => {
        console.error('Error creating test:', error);
        throw error;
      })
    );
  }

  // Update an existing test - utilise l'interface UpdateTestCommand du backend
  updateTest(test: TestDto): Observable<any> {
    const updateCommand: UpdateTestCommand = {
      id: test.id!,
      title: test.title,
      category: test.category,
      mode: test.mode,
      showTimer: test.showTimer,
    };

    console.log('Sending update test command to backend:', updateCommand);

    return this.http.put(`${this.apiUrl}/${test.id}`, updateCommand).pipe(
      map((response) => {
        console.log('Update test response from backend:', response);
        return response;
      }),
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
        category: 2, // Technical
        mode: 1, // Recruitment
        isActive: true,
        showTimer: true,
        tryAgain: false,
        level: 1, // Medium
      },
      {
        id: 2,
        title: 'General Knowledge Quiz',
        category: 1, // General
        mode: 0, // Training
        isActive: true,
        showTimer: false,
        tryAgain: true,
        level: 0, // Easy
      },
      {
        id: 3,
        title: 'Advanced Programming Test',
        category: 2, // Technical
        mode: 1, // Recruitment
        isActive: false,
        showTimer: true,
        tryAgain: false,
        level: 2, // Hard
      },
    ];

    return new Observable((observer) => {
      observer.next(mockTests);
      observer.complete();
    });
  }

  // Helper methods pour la conversion des énumérations
  static getCategoryLabel(category: number): string {
    const labels = { 0: 'None', 1: 'General', 2: 'Technical' };
    return labels[category as keyof typeof labels] || 'Unknown';
  }

  static getModeLabel(mode: number): string {
    const labels = { 0: 'Training', 1: 'Recruitment' };
    return labels[mode as keyof typeof labels] || 'Unknown';
  }

  static getLevelLabel(level: number): string {
    const labels = { 0: 'Easy', 1: 'Medium', 2: 'Hard' };
    return labels[level as keyof typeof labels] || 'Unknown';
  }

  // Méthode pour valider les données avant envoi au backend
  validateTestData(data: any): CreateTestCommand {
    return {
      title: String(data.title || '').trim(),
      category: Number(data.category) || 0,
      mode: Number(data.mode) || 0,
      tryAgain: Boolean(data.tryAgain),
      showTimer: Boolean(data.showTimer),
      level: Number(data.level) || 0,
    };
  }

  // Méthode pour convertir les strings en nombres pour les enums
  normalizeEnumValues(data: any): any {
    return {
      ...data,
      category:
        typeof data.category === 'string'
          ? this.getCategoryValueFromString(data.category)
          : Number(data.category),
      mode:
        typeof data.mode === 'string'
          ? this.getModeValueFromString(data.mode)
          : Number(data.mode),
      level:
        typeof data.level === 'string'
          ? this.getLevelValueFromString(data.level)
          : Number(data.level),
    };
  }

  private getCategoryValueFromString(category: string): number {
    const mapping: { [key: string]: number } = {
      None: 0,
      General: 1,
      Technical: 2,
    };
    return mapping[category] ?? 0;
  }

  private getModeValueFromString(mode: string): number {
    const mapping: { [key: string]: number } = {
      Training: 0,
      Recruitment: 1,
    };
    return mapping[mode] ?? 0;
  }

  private getLevelValueFromString(level: string): number {
    const mapping: { [key: string]: number } = {
      Easy: 0,
      Medium: 1,
      Hard: 2,
    };
    return mapping[level] ?? 0;
  }
}
