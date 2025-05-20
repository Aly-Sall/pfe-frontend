// src/app/core/services/test-attempt.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError, mergeMap } from 'rxjs/operators';
import { TestService, TestDto, QuestionDto, ResponseDto } from './test.service';

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

@Injectable({
  providedIn: 'root',
})
export class TestAttemptService {
  private apiUrl = 'api/Tentative';
  private surveillanceApiUrl = 'api/Surveillance';

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
    const attemptData: TestAttemptDto = {
      testId: testId,
      passingDate: new Date(),
    };

    return this.http.post<any>(this.apiUrl, attemptData).pipe(
      map((response) => {
        if (response.isSuccess) {
          // Extract the attempt with its ID from the response
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

  // Save an answer during the test (local storage)
  saveAnswer(questionId: number, selectedAnswerIds: number[]): void {
    // Check if answer already exists for this question
    const existingAnswerIndex = this.userAnswers.findIndex(
      (a) => a.questionId === questionId
    );

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      this.userAnswers[existingAnswerIndex].selectedAnswerIds =
        selectedAnswerIds;
    } else {
      // Add new answer
      this.userAnswers.push({ questionId, selectedAnswerIds });
    }

    // Save to localStorage as a backup in case of browser refresh
    this.saveAnswersToLocalStorage();
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

    const surveillanceData: SurveillanceDto = {
      tentativeId: currentAttempt.id,
      captureEcran: captureData,
    };

    return this.http.post<any>(this.surveillanceApiUrl, surveillanceData);
  }

  // Complete the test and calculate results
  completeTest(): Observable<TestResultDto> {
    const currentAttempt = this.currentAttemptSubject.value;
    if (!currentAttempt || !currentAttempt.id) {
      return of({
        tentativeId: -1,
        testId: -1,
        testTitle: '',
        totalQuestions: 0,
        correctAnswers: 0,
        scorePercentage: 0,
        passingDate: new Date(),
        questionResults: [],
      });
    }

    // In a real implementation, you would send all answers to the server
    // and get the results back. Since we don't have that endpoint, we'll
    // calculate results locally based on test data.

    return this.calculateTestResults(
      currentAttempt.id,
      currentAttempt.testId
    ).pipe(
      tap((result) => {
        this.testResultSubject.next(result);
        this.stopTimer();
        this.clearLocalStorage();
        // We would typically submit the final score to the server here
      })
    );
  }

  // Start the test timer
  startTimer(durationMinutes: number): void {
    this.stopTimer(); // Stop any existing timer

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
        // Also restore the current attempt
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
      map((test) => {
        return this.testService.getTestQuestions(testId).pipe(
          map((questions) => {
            // Parse the correct answers for each question
            const questionResults: QuestionResultDto[] = questions.map(
              (question) => {
                const correctAnswerIds = this.parseCorrectAnswerIds(
                  question.listOfCorrectAnswerIds || ''
                );
                const userAnswerIds = this.getAnswer(question.id || 0);

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
                  question.reponses || [],
                  userAnswerIds
                );
                const correctAnswers = this.getAnswerContent(
                  question.reponses || [],
                  correctAnswerIds
                );

                return {
                  questionId: question.id || 0,
                  questionContent: question.content,
                  isCorrect: isCorrect,
                  userAnswerIds: userAnswerIds,
                  correctAnswerIds: correctAnswerIds,
                  selectedAnswers: selectedAnswers,
                  correctAnswers: correctAnswers,
                };
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

            return {
              tentativeId: tentativeId,
              testId: testId,
              testTitle: test.title,
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              scorePercentage: scorePercentage,
              passingDate: new Date(),
              questionResults: questionResults,
            };
          })
        );
      }),
      catchError((error) => {
        console.error('Error calculating test results:', error);
        throw error;
      }),
      // Flatten the observable
      mergeMap((resultObs) => resultObs)
    );
  }

  // Parse correct answer IDs from string
  private parseCorrectAnswerIds(idsString: string): number[] {
    try {
      return idsString.split(',').map((id) => parseInt(id.trim()));
    } catch (e) {
      console.error('Error parsing correct answer IDs:', e);
      return [];
    }
  }

  // Get answer content based on IDs
  private getAnswerContent(
    responses: ResponseDto[],
    answerIds: number[]
  ): string[] {
    return responses
      .filter((r) => answerIds.includes(r.id || 0))
      .map((r) => r.content);
  }
}
