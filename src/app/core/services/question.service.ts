// src/app/core/services/question.service.ts - VERSION CORRIGÉE
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface QuestionChoice {
  id: number;
  content: string;
}

export interface CreateQuestionRequest {
  content: string;
  type: number; // 0: SingleChoice, 1: MultiChoice
  answerDetails?: string;
  quizTestId: number;
  choices: QuestionChoice[];
  listOfCorrectAnswerIds: string; // JSON string like "[1,3]"
}

export interface QuestionDto {
  id?: number;
  content: string;
  type: number;
  answerDetails?: string;
  quizTestId: number;
  choices?: QuestionChoice[];
  listOfCorrectAnswerIds?: string;
}

export interface ApiResponse {
  isSuccess: boolean;
  error?: string;
  errors?: string[];
  id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private apiUrl = `${environment.apiUrl}/Questions`;

  constructor(private http: HttpClient) {}

  // Récupérer les questions d'un test
  getQuestionsByTestId(testId: number): Observable<QuestionDto[]> {
    const params = new HttpParams().set('Id', testId.toString());

    return this.http
      .get<QuestionDto[]>(`${this.apiUrl}/GetQuestionsByTestId`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error loading questions:', error);
          throw error;
        })
      );
  }

  // Créer une nouvelle question - CORRIGÉ
  createQuestion(question: CreateQuestionRequest): Observable<ApiResponse> {
    console.log('Creating question:', question);

    // Préparer les données exactement comme attendu par le backend
    const requestData = {
      content: question.content,
      type: question.type,
      answerDetails: question.answerDetails || '',
      quizTestId: question.quizTestId,
      listOfCorrectAnswerIds: question.listOfCorrectAnswerIds,
      choices: question.choices,
    };

    console.log('Sending to backend:', requestData);

    return this.http.post<ApiResponse>(this.apiUrl, requestData).pipe(
      map((response) => {
        console.log('Create question response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('Error creating question:', error);
        throw error;
      })
    );
  }

  // Supprimer une question
  deleteQuestion(questionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${questionId}`).pipe(
      catchError((error) => {
        console.error('Error deleting question:', error);
        throw error;
      })
    );
  }

  // TEMPORAIREMENT DÉSACTIVÉ - Ces endpoints n'existent pas côté backend
  // Récupérer toutes les questions - MOCK DATA pour l'instant
  getAllQuestions(): Observable<QuestionDto[]> {
    console.warn(
      'getAllQuestions: Using mock data - backend endpoint not implemented'
    );
    return this.getMockQuestions();
  }

  // Assigner une question à un test - MOCK pour l'instant
  assignQuestionToTest(
    questionId: number,
    testId: number
  ): Observable<ApiResponse> {
    console.warn(
      'assignQuestionToTest: Using mock response - backend endpoint not implemented'
    );

    // Retourner une réponse mock pour éviter l'erreur 404
    return of({
      isSuccess: false,
      error: "Cette fonctionnalité n'est pas encore implémentée côté backend",
    });
  }

  // Générer des questions avec OpenAI (si l'endpoint existe)
  generateQuestions(topic: string, testId: number): Observable<ApiResponse> {
    const requestData = { topic, testId };

    return this.http
      .post<ApiResponse>(
        `${this.apiUrl}/GenerateQuestionsUsingOpenAI`,
        requestData
      )
      .pipe(
        catchError((error) => {
          console.error('Error generating questions:', error);
          throw error;
        })
      );
  }

  // Validation des données de question
  validateQuestionData(question: any): CreateQuestionRequest {
    return {
      content: String(question.content || '').trim(),
      type: Number(question.type) || 0,
      answerDetails: question.answerDetails || '',
      quizTestId: Number(question.quizTestId) || 0,
      choices: question.choices || [],
      listOfCorrectAnswerIds: question.listOfCorrectAnswerIds || '[]',
    };
  }

  // Préparer les IDs des réponses correctes au format JSON
  prepareCorrectAnswerIds(selectedIds: number[]): string {
    return JSON.stringify(selectedIds);
  }

  // Parser les IDs des réponses correctes depuis JSON
  parseCorrectAnswerIds(idsString: string): number[] {
    try {
      if (!idsString || idsString.trim() === '') return [];

      // Nettoyer la chaîne et parser
      const cleanString = idsString.replace(/[\[\]]/g, '').trim();
      if (cleanString === '') return [];

      return cleanString
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
    } catch (e) {
      console.error('Error parsing correct answer IDs:', e);
      return [];
    }
  }

  // Générer un ID unique pour les nouveaux choix
  generateChoiceId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  // Données mock pour les tests
  private getMockQuestions(): Observable<QuestionDto[]> {
    const mockQuestions: QuestionDto[] = [
      {
        id: 1,
        content: 'What is Angular?',
        type: 0, // Single choice
        answerDetails: 'Angular is a TypeScript-based web framework',
        quizTestId: 0,
        choices: [
          { id: 1, content: 'A TypeScript framework' },
          { id: 2, content: 'A JavaScript library' },
          { id: 3, content: 'A CSS framework' },
          { id: 4, content: 'A database' },
        ],
        listOfCorrectAnswerIds: '[1]',
      },
      {
        id: 2,
        content: 'Select all frontend frameworks:',
        type: 1, // Multiple choice
        answerDetails: 'Angular, React, and Vue are frontend frameworks',
        quizTestId: 0,
        choices: [
          { id: 1, content: 'Angular' },
          { id: 2, content: 'React' },
          { id: 3, content: 'Vue' },
          { id: 4, content: 'Node.js' },
        ],
        listOfCorrectAnswerIds: '[1,2,3]',
      },
    ];

    return new Observable((observer) => {
      observer.next(mockQuestions);
      observer.complete();
    });
  }

  // Helper methods pour la conversion des types
  static getQuestionTypeLabel(type: number): string {
    const labels = { 0: 'Single Choice', 1: 'Multiple Choice' };
    return labels[type as keyof typeof labels] || 'Unknown';
  }

  static getQuestionTypesForSelect() {
    return [
      { value: 0, label: 'Single Choice' },
      { value: 1, label: 'Multiple Choice' },
    ];
  }
}
