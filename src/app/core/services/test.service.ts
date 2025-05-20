// src/app/core/services/test.service.ts (corrigé)
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
}

export interface QuestionDto {
  id?: number;
  content: string;
  type: number; // 0: SingleChoice, 1: MultiChoice
  answerDetails?: string;
  quizTestId: number;
  reponses?: ResponseDto[];
  listOfCorrectAnswerIds?: string;
}

export interface ResponseDto {
  id?: number;
  content: string;
  questionId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private apiUrl = 'api/QuizTest'; // Base API URL for tests

  constructor(private http: HttpClient) {}

  // Get a single test by ID
  getTestById(id: number): Observable<TestDto> {
    return this.http.get<TestResponse>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        if (!response.isSuccess) {
          throw new Error(response.error || 'Failed to load test');
        }
        return response.value;
      })
    );
  }

  // Get all tests (utilisé pour l'affichage dans TestsComponent)
  getAllTests(): Observable<TestDto[]> {
    return this.http.get<TestDto[]>(this.apiUrl);
  }

  // Get questions for a specific test
  getTestQuestions(testId: number): Observable<QuestionDto[]> {
    return this.http.get<any>(
      `api/Questions/GetQuestionsByTestId?Id=${testId}`
    );
  }

  // Create a new test
  createTest(test: TestDto): Observable<TestResponse> {
    return this.http.post<TestResponse>(this.apiUrl, test);
  }

  // Update an existing test (incluant l'activation/désactivation)
  updateTest(test: TestDto): Observable<TestResponse> {
    return this.http.put<TestResponse>(`${this.apiUrl}/${test.id}`, test);
  }

  // Delete a test
  deleteTest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
