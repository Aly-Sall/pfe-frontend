// src/app/core/services/test-attempt.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TestService, TestDto, QuestionDto } from './test.service';

export interface TestAttemptDto {
  id?: number;
  testId: number;
  passingDate: Date;
  scoreObtenu?: number;
}

export interface UserAnswerDto {
  questionId: number;
  selectedAnswerIds: number[];
}

export interface TestResultDto {
  tentativeId: number;
  testId: number;
  testTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  passingDate: Date;
  questionResults: QuestionResultDto[];
}

export interface QuestionResultDto {
  questionId: number;
  questionContent: string;
  isCorrect: boolean;
  userAnswerIds: number[];
  correctAnswerIds: number[];
  selectedAnswers: string[];
  correctAnswers: string[];
}

export interface SurveillanceDto {
  tentativeId: number;
  captureEcran: string;
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
export class TestAttemptService {
  private tentativeApiUrl = `${environment.apiUrl}/Tentative`;
  private surveillanceApiUrl = `${environment.apiUrl}/Surveillance`;
  private responseApiUrl = `${environment.apiUrl}/CandidateAnswer`;

  // Store user answers locally during the test
  private userAnswers: UserAnswerDto[] = [];

  // Current active test attempt
  private currentAttemptSubject = new BehaviorSubject<TestAttemptDto | null>(
    null
  );
  currentAttempt$ = this.currentAttemptSubject.asObservable();

  // Test result
  private testResultSubject = new BehaviorSubject<TestResultDto | null>(null);
  testResult$ = this.testResultSubject.asObservable();

  // Timer state
  private remainingTimeSubject = new BehaviorSubject<number>(0);
  remainingTime$ = this.remainingTimeSubject.asObservable();
  private timerInterval: any;

  constructor(private http: HttpClient, private testService: TestService) {}

  // Start a new test attempt
  startTest(testId: number): Observable<TestAttemptDto> {
    const attemptData = {
      passingDate: new Date().toISOString(),
      testId: testId,
    };

    return this.http.post<ApiResponse>(this.tentativeApiUrl, attemptData).pipe(
      map((response) => {
        if (response.isSuccess && response.id) {
          const attempt: TestAttemptDto = {
            id: response.id,
            testId: testId,
            passingDate: new Date(),
          };

          this.currentAttemptSubject.next(attempt);
          this.clearUserAnswers();
          return attempt;
        } else {
          throw new Error(response.error || 'Failed to start test');
        }
      }),
      catchError((error) => {
        console.error('Error starting test:', error);
        throw error;
      })
    );
  }

  // Save an answer during the test (local storage + API call)
  saveAnswer(questionId: number, selectedAnswerIds: number[]): void {
    // Update local storage
    const existingAnswerIndex = this.userAnswers.findIndex(
      (a) => a.questionId === questionId
    );

    if (existingAnswerIndex >= 0) {
      this.userAnswers[existingAnswerIndex].selectedAnswerIds =
        selectedAnswerIds;
    } else {
      this.userAnswers.push({ questionId, selectedAnswerIds });
    }

    // Save to localStorage as backup
    this.saveAnswersToLocalStorage();

    // Save each answer to the API
    selectedAnswerIds.forEach((choiceId) => {
      const responseData = {
        choiceId: choiceId,
        questionId: questionId,
        quizTestId: this.currentAttemptSubject.value?.testId || 0,
      };

      this.http.post<ApiResponse>(this.responseApiUrl, responseData).subscribe({
        next: (response) => {
          if (!response.isSuccess) {
            console.error('Failed to save answer:', response.error);
          }
        },
        error: (error) => {
          console.error('Error saving answer:', error);
        },
      });
    });
  }

  // Get the saved answer for a question
  getAnswer(questionId: number): number[] {
    const answer = this.userAnswers.find((a) => a.questionId === questionId);
    return answer ? answer.selectedAnswerIds : [];
  }

  // Submit surveillance data during the test
  submitSurveillance(captureData: string): Observable<any> {
    const currentAttempt = this.currentAttemptSubject.value;
    if (!currentAttempt || !currentAttempt.id) {
      return of({ isSuccess: false, error: 'No active test attempt' });
    }

    const surveillanceData = {
      captureEcran: captureData,
      tentativeId: currentAttempt.id,
    };

    return this.http
      .post<ApiResponse>(this.surveillanceApiUrl, surveillanceData)
      .pipe(
        catchError((error) => {
          console.error('Error submitting surveillance:', error);
          return of({
            isSuccess: false,
            error: 'Failed to submit surveillance',
          });
        })
      );
  }

  // Complete the test and calculate results
  completeTest(): Observable<TestResultDto> {
    const currentAttempt = this.currentAttemptSubject.value;
    if (!currentAttempt || !currentAttempt.id) {
      throw new Error('No active test attempt');
    }

    // Calculate results locally (since there's no backend endpoint for this yet)
    return this.calculateTestResults(
      currentAttempt.id,
      currentAttempt.testId
    ).pipe(
      tap((result) => {
        this.testResultSubject.next(result);
        this.stopTimer();
        this.clearLocalStorage();
        // TODO: Submit final score to backend if needed
      })
    );
  }

  // Start the test timer
  startTimer(durationMinutes: number): void {
    this.stopTimer();

    const durationMs = durationMinutes * 60 * 1000;
    const endTime = Date.now() + durationMs;

    this.remainingTimeSubject.next(durationMs);

    this.timerInterval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      this.remainingTimeSubject.next(remaining);

      if (remaining === 0) {
        this.stopTimer();
        this.completeTest().subscribe();
      }
    }, 1000);
  }

  // Stop the timer
  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Format remaining time as MM:SS
  formatRemainingTime(timeMs: number): string {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  // Check if there are saved answers in localStorage
  hasSavedAnswers(testId: number): boolean {
    const savedData = localStorage.getItem(`test_${testId}_answers`);
    return !!savedData;
  }

  // Restore saved answers from localStorage
  restoreSavedAnswers(testId: number, tentativeId: number): void {
    const savedData = localStorage.getItem(`test_${testId}_answers`);
    if (savedData) {
      try {
        this.userAnswers = JSON.parse(savedData);
        this.currentAttemptSubject.next({
          id: tentativeId,
          testId: testId,
          passingDate: new Date(),
        });
      } catch (e) {
        console.error('Error restoring saved answers:', e);
        this.clearUserAnswers();
      }
    }
  }

  // Clear all user answers
  private clearUserAnswers(): void {
    this.userAnswers = [];
    this.saveAnswersToLocalStorage();
  }

  // Save answers to localStorage
  private saveAnswersToLocalStorage(): void {
    const currentAttempt = this.currentAttemptSubject.value;
    if (currentAttempt && currentAttempt.testId) {
      localStorage.setItem(
        `test_${currentAttempt.testId}_answers`,
        JSON.stringify(this.userAnswers)
      );
    }
  }

  // Clear localStorage data
  private clearLocalStorage(): void {
    const currentAttempt = this.currentAttemptSubject.value;
    if (currentAttempt && currentAttempt.testId) {
      localStorage.removeItem(`test_${currentAttempt.testId}_answers`);
    }
  }

  // Calculate test results based on user answers and test data
  private calculateTestResults(
    tentativeId: number,
    testId: number
  ): Observable<TestResultDto> {
    return this.testService.getTestById(testId).pipe(
      mergeMap((test) => {
        return this.testService.getTestQuestions(testId).pipe(
          map((questions) => {
            console.log('Questions data:', questions); // Debug log

            const questionResults: QuestionResultDto[] = questions.map(
              (question) => {
                console.log('Processing question:', question); // Debug log
                console.log(
                  'listOfCorrectAnswerIds:',
                  question.listOfCorrectAnswerIds
                ); // Debug log
                console.log('choices:', question.choices); // Debug log

                const correctAnswerIds = this.parseCorrectAnswerIds(
                  question.listOfCorrectAnswerIds || ''
                );
                console.log('Parsed correctAnswerIds:', correctAnswerIds); // Debug log

                const userAnswerIds = this.getAnswer(question.id || 0);
                console.log('User answer IDs:', userAnswerIds); // Debug log

                // Determine if the answer is correct
                let isCorrect = false;
                if (question.type === 0) {
                  // Single choice
                  isCorrect =
                    userAnswerIds.length === 1 &&
                    correctAnswerIds.includes(userAnswerIds[0]);
                } else {
                  // Multiple choice
                  isCorrect =
                    userAnswerIds.length === correctAnswerIds.length &&
                    userAnswerIds.every((id) => correctAnswerIds.includes(id));
                }

                // Get answer content
                const selectedAnswers = this.getAnswerContent(
                  question.choices || [],
                  userAnswerIds
                );
                const correctAnswers = this.getAnswerContent(
                  question.choices || [],
                  correctAnswerIds
                );

                console.log('Selected answers:', selectedAnswers); // Debug log
                console.log('Correct answers:', correctAnswers); // Debug log

                const result = {
                  questionId: question.id || 0,
                  questionContent: question.content,
                  isCorrect: isCorrect,
                  userAnswerIds: userAnswerIds,
                  correctAnswerIds: correctAnswerIds,
                  selectedAnswers: selectedAnswers,
                  correctAnswers: correctAnswers,
                };

                console.log('Question result:', result); // Debug log
                return result;
              }
            );

            // Calculate overall score
            const correctAnswers = questionResults.filter(
              (r) => r.isCorrect
            ).length;
            const totalQuestions = questions.length;
            const scorePercentage =
              totalQuestions > 0
                ? Math.round((correctAnswers / totalQuestions) * 100)
                : 0;

            const finalResult = {
              tentativeId: tentativeId,
              testId: testId,
              testTitle: test.title,
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              scorePercentage: scorePercentage,
              passingDate: new Date(),
              questionResults: questionResults,
            };

            console.log('Final test result:', finalResult); // Debug log
            return finalResult;
          })
        );
      }),
      catchError((error) => {
        console.error('Error calculating test results:', error);
        throw error;
      })
    );
  }

  // Parse correct answer IDs from string - CORRIGÉ
  private parseCorrectAnswerIds(idsString: string): number[] {
    console.log('Parsing IDs from string:', idsString); // Debug log

    if (!idsString || idsString.trim() === '') {
      console.log('Empty IDs string'); // Debug log
      return [];
    }

    try {
      // Remove brackets and any whitespace
      let cleanString = idsString.replace(/[\[\]]/g, '').trim();
      console.log('Clean string:', cleanString); // Debug log

      if (cleanString === '') {
        return [];
      }

      // Split by comma and parse integers
      const ids = cleanString
        .split(',')
        .map((id) => {
          const trimmed = id.trim();
          const parsed = parseInt(trimmed);
          console.log(`Parsing "${trimmed}" -> ${parsed}`); // Debug log
          return parsed;
        })
        .filter((id) => !isNaN(id));

      console.log('Final parsed IDs:', ids); // Debug log
      return ids;
    } catch (e) {
      console.error('Error parsing correct answer IDs:', e);
      return [];
    }
  }

  // Get answer content based on IDs - CORRIGÉ
  private getAnswerContent(
    choices: Array<{ id: number; content: string }>,
    answerIds: number[]
  ): string[] {
    console.log('Getting answer content for choices:', choices); // Debug log
    console.log('Answer IDs:', answerIds); // Debug log

    if (
      !choices ||
      !Array.isArray(choices) ||
      !answerIds ||
      !Array.isArray(answerIds)
    ) {
      console.log('Invalid choices or answerIds'); // Debug log
      return [];
    }

    const results = choices
      .filter((choice) => {
        const isIncluded = answerIds.includes(choice.id);
        console.log(
          `Choice ${choice.id} (${choice.content}) included: ${isIncluded}`
        ); // Debug log
        return isIncluded;
      })
      .map((choice) => choice.content);

    console.log('Answer content results:', results); // Debug log
    return results;
  }
}
