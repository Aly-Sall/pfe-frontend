// src/app/core/services/test.service.ts - Méthode createTest corrigée
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
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

  // Create a new test - CORRIGÉ avec debugging et validation améliorée
  createTest(createCommand: CreateTestCommand): Observable<TestResponse> {
    console.log('=== TestService.createTest called ===');
    console.log('Input command:', createCommand);

    // Validation stricte des données avant envoi
    if (!createCommand.title || createCommand.title.trim() === '') {
      console.error('Title is required');
      throw new Error('Title is required');
    }

    // Validation des énums
    if (![0, 1, 2].includes(createCommand.category)) {
      console.error('Invalid category:', createCommand.category);
      throw new Error('Invalid category value');
    }

    if (![0, 1].includes(createCommand.mode)) {
      console.error('Invalid mode:', createCommand.mode);
      throw new Error('Invalid mode value');
    }

    if (![0, 1, 2].includes(createCommand.level)) {
      console.error('Invalid level:', createCommand.level);
      throw new Error('Invalid level value');
    }

    // Nettoyage et validation des données
    const validatedCommand: CreateTestCommand = {
      title: String(createCommand.title).trim(),
      category: Number(createCommand.category),
      mode: Number(createCommand.mode),
      tryAgain: Boolean(createCommand.tryAgain),
      showTimer: Boolean(createCommand.showTimer),
      level: Number(createCommand.level),
    };

    console.log('Validated command:', validatedCommand);
    console.log('API URL:', this.apiUrl);

    // Headers appropriés
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http
      .post<TestResponse>(this.apiUrl, validatedCommand, { headers })
      .pipe(
        tap((response) => {
          console.log('=== Raw API Response ===');
          console.log('Response:', response);
          console.log('Is Success:', response.isSuccess);
          console.log('Response ID:', response.id);
          console.log('Response Error:', response.error);
        }),
        map((response) => {
          console.log('=== Processing API Response ===');

          if (!response) {
            console.error('Empty response from API');
            throw new Error('Empty response from server');
          }

          if (response.isSuccess) {
            console.log('✅ Test created successfully with ID:', response.id);
          } else {
            console.error('❌ Test creation failed:', response.error);
          }

          return response;
        }),
        catchError((error) => {
          console.error('=== API Call Error ===');
          console.error('Error object:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);

          // Détails d'erreur plus spécifiques
          let errorMessage = 'Unknown error occurred';

          if (error.status === 0) {
            errorMessage =
              'Cannot connect to server. Check if the backend is running and CORS is configured.';
          } else if (error.status === 400) {
            errorMessage =
              error.error?.error ||
              error.error?.message ||
              'Bad request - Invalid data sent to server';
          } else if (error.status === 404) {
            errorMessage = 'API endpoint not found. Check the API URL.';
          } else if (error.status === 500) {
            errorMessage = 'Internal server error. Check server logs.';
          } else {
            errorMessage = `HTTP ${error.status}: ${
              error.message || 'Server error'
            }`;
          }

          console.error('Processed error message:', errorMessage);
          throw new Error(errorMessage);
        })
      );
  }

  // Get a single test by ID
  getTestById(id: number): Observable<TestDto> {
    console.log('Getting test by ID:', id);

    return this.http
      .get<TestResponse>(`${this.apiUrl}/by-id/${id}?Id=${id}`)
      .pipe(
        tap((response) => console.log('GetTestById response:', response)),
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

  // Get all tests
  getAllTests(): Observable<TestDto[]> {
    console.log('Getting all tests from:', this.apiUrl);

    return this.http.get<TestDto[]>(this.apiUrl).pipe(
      tap((response) => console.log('GetAllTests response:', response)),
      catchError((error) => {
        console.error('Error loading all tests:', error);
        // Retourner des données mock en cas d'erreur
        return this.getMockTests();
      })
    );
  }

  // Get questions for a specific test
  getTestQuestions(testId: number): Observable<QuestionDto[]> {
    console.log('Getting questions for test ID:', testId);

    return this.http
      .get<QuestionDto[]>(
        `${this.questionsUrl}/GetQuestionsByTestId?Id=${testId}`
      )
      .pipe(
        tap((response) => console.log('GetTestQuestions response:', response)),
        catchError((error) => {
          console.error('Error loading questions:', error);
          throw error;
        })
      );
  }

  // Update an existing test
  updateTest(test: TestDto): Observable<any> {
    const updateCommand: UpdateTestCommand = {
      id: test.id!,
      title: test.title,
      category: test.category,
      mode: test.mode,
      showTimer: test.showTimer,
    };

    console.log('Updating test with command:', updateCommand);

    return this.http.put(`${this.apiUrl}/${test.id}`, updateCommand).pipe(
      tap((response) => console.log('UpdateTest response:', response)),
      catchError((error) => {
        console.error('Error updating test:', error);
        throw error;
      })
    );
  }

  // Delete a test
  deleteTest(id: number): Observable<any> {
    console.log('Deleting test with ID:', id);

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap((response) => console.log('DeleteTest response:', response)),
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
    ];

    console.log('Returning mock tests:', mockTests);
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
}
