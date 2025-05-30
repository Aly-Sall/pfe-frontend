// src/app/core/services/question.service.ts - VERSION CORRIGÉE AVEC IDs COURTS
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
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

  // ✅ AJOUTÉ : Compteur statique pour des IDs courts
  private static choiceIdCounter = 1;

  constructor(private http: HttpClient) {}

  // Récupérer les questions d'un test
  getQuestionsByTestId(testId: number): Observable<QuestionDto[]> {
    const params = new HttpParams().set('Id', testId.toString());

    return this.http
      .get<QuestionDto[]>(`${this.apiUrl}/GetQuestionsByTestId`, { params })
      .pipe(
        tap((questions) => {
          console.log(
            `Loaded ${questions.length} questions for test ${testId}`
          );
        }),
        catchError((error) => {
          console.error('Error loading questions:', error);
          throw error;
        })
      );
  }

  // Récupérer toutes les questions - CORRIGÉ
  getAllQuestions(): Observable<QuestionDto[]> {
    console.log('Getting all questions from API');
    return this.http.get<QuestionDto[]>(this.apiUrl).pipe(
      tap((questions) => {
        console.log(`Loaded ${questions.length} total questions from API`);
      }),
      catchError((error) => {
        console.error('Error loading all questions from API:', error);
        console.warn('Falling back to mock data');
        return this.getMockQuestions();
      })
    );
  }

  // Créer une nouvelle question
  createQuestion(question: CreateQuestionRequest): Observable<ApiResponse> {
    console.log('Creating question:', question);

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
      tap((response) => {
        console.log('Create question response:', response);
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
      tap(() => {
        console.log(`Question ${questionId} deleted successfully`);
      }),
      catchError((error) => {
        console.error('Error deleting question:', error);
        throw error;
      })
    );
  }

  // Assigner une question à un test - CORRIGÉ
  assignQuestionToTest(
    questionId: number,
    testId: number
  ): Observable<ApiResponse> {
    console.log(`Assigning question ${questionId} to test ${testId}`);

    return this.http
      .post<ApiResponse>(
        `${this.apiUrl}/${questionId}/assign-to-test/${testId}`,
        {}
      )
      .pipe(
        tap((response) => {
          console.log('Assign question response:', response);
        }),
        catchError((error) => {
          console.error('Error assigning question to test:', error);
          // Retourner une erreur utilisable au lieu de faire échouer complètement
          return of({
            isSuccess: false,
            error: `Erreur lors de l'assignation: ${
              error.message || 'Erreur inconnue'
            }`,
          });
        })
      );
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
          return of({
            isSuccess: false,
            error:
              "La génération automatique de questions n'est pas encore disponible",
          });
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

  // ✅ CORRIGÉ : Générer un ID court pour les nouveaux choix
  generateChoiceId(): number {
    return QuestionService.choiceIdCounter++;
  }

  // ✅ AJOUTÉ : Générer un ID basé sur l'index (alternative)
  generateChoiceIdFromIndex(index: number): number {
    return index + 1;
  }

  // ✅ AJOUTÉ : Réinitialiser le compteur d'IDs
  resetChoiceIdCounter(): void {
    QuestionService.choiceIdCounter = 1;
  }

  // ✅ AJOUTÉ : Générer des IDs séquentiels pour une liste de choix
  generateChoiceIdsForNewQuestion(numberOfChoices: number): number[] {
    this.resetChoiceIdCounter();
    const ids: number[] = [];
    for (let i = 0; i < numberOfChoices; i++) {
      ids.push(this.generateChoiceId());
    }
    return ids;
  }

  // Données mock pour les tests - ✅ CORRIGÉ avec IDs courts
  private getMockQuestions(): Observable<QuestionDto[]> {
    const mockQuestions: QuestionDto[] = [
      {
        id: 1,
        content: 'What is Angular?',
        type: 0, // Single choice
        answerDetails: 'Angular is a TypeScript-based web framework',
        quizTestId: 0, // Non assignée
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
        quizTestId: 0, // Non assignée
        choices: [
          { id: 1, content: 'Angular' },
          { id: 2, content: 'React' },
          { id: 3, content: 'Vue' },
          { id: 4, content: 'Node.js' },
        ],
        listOfCorrectAnswerIds: '[1,2,3]',
      },
      {
        id: 3,
        content: 'What is TypeScript?',
        type: 0,
        answerDetails: 'TypeScript is a superset of JavaScript',
        quizTestId: 0, // Non assignée
        choices: [
          { id: 1, content: 'A superset of JavaScript' },
          { id: 2, content: 'A database' },
          { id: 3, content: 'A CSS preprocessor' },
          { id: 4, content: 'An image format' },
        ],
        listOfCorrectAnswerIds: '[1]',
      },
    ];

    return of(mockQuestions);
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
