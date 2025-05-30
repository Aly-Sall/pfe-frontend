// src/app/shared/components/question-management/question-management.component.ts - CODE COMPLET CORRIGÉ
import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {
  QuestionService,
  QuestionDto,
  CreateQuestionRequest,
  QuestionChoice,
  ApiResponse,
} from '../../../core/services/question.service';
import { TestDto, TestService } from '../../../core/services/test.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-question-management',
  templateUrl: './question-management.component.html',
  styleUrls: ['./question-management.component.scss'],
})
export class QuestionManagementComponent implements OnInit, OnChanges {
  @Input() test!: TestDto;

  // Mode de fonctionnement : 'list' pour afficher les tests, 'manage' pour gérer les questions
  mode: 'list' | 'manage' = 'list';

  // Pour le mode 'list'
  tests: TestDto[] = [];

  // Pour le mode 'manage'
  questions: QuestionDto[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  showCreateForm: boolean = false;
  showAssignForm: boolean = false;

  createQuestionForm: FormGroup;
  assignQuestionForm: FormGroup;

  availableQuestions: QuestionDto[] = [];

  questionTypes = QuestionService.getQuestionTypesForSelect();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionService: QuestionService,
    private testService: TestService,
    private fb: FormBuilder
  ) {
    this.createQuestionForm = this.createForm();
    this.assignQuestionForm = this.createAssignForm();
  }

  ngOnInit(): void {
    const testId = +this.route.snapshot.paramMap.get('testId')!;
    if (testId) {
      // Mode gestion des questions pour un test spécifique
      this.mode = 'manage';
      this.loadTestDetails(testId);
    } else {
      // Mode liste des tests
      this.mode = 'list';
      this.loadTests();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['test'] && changes['test'].currentValue?.id) {
      this.loadQuestions();
    }
  }

  // ============================
  // MÉTHODES POUR LE MODE LISTE
  // ============================

  loadTests(): void {
    this.isLoading = true;
    this.error = null;

    this.testService.getAllTests().subscribe({
      next: (tests) => {
        this.tests = tests;
        this.isLoading = false;
        console.log('Tests loaded for question management:', tests);
      },
      error: (error) => {
        console.error('Error loading tests:', error);
        this.error = 'Erreur lors du chargement des tests';
        this.isLoading = false;
      },
    });
  }

  selectTest(test: TestDto): void {
    if (test.id) {
      this.router.navigate(['/question-management', test.id]);
    }
  }

  // ===============================
  // MÉTHODES POUR LE MODE GESTION
  // ===============================

  loadTestDetails(testId: number): void {
    this.isLoading = true;
    this.error = null;

    this.testService.getTestById(testId).subscribe({
      next: (test) => {
        this.test = test;
        this.loadQuestions();
        console.log('Test details loaded:', test);
      },
      error: (error) => {
        console.error('Error loading test:', error);
        this.test = {
          id: testId,
          title: 'Test #' + testId,
          category: 0,
          mode: 0,
          tryAgain: false,
          showTimer: false,
          level: 1,
        };
        this.loadQuestions();
      },
    });
  }

  loadQuestions(): void {
    if (!this.test?.id) return;

    this.isLoading = true;
    this.error = null;

    this.questionService.getQuestionsByTestId(this.test.id).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.isLoading = false;
        console.log(
          `Loaded ${questions.length} questions for test ${this.test.id}`
        );
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.error = 'Erreur lors du chargement des questions';
        this.isLoading = false;
      },
    });
  }

  // ===============================
  // GESTION DES FORMULAIRES
  // ===============================

  createForm(): FormGroup {
    return this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]],
      type: [0, Validators.required],
      answerDetails: [''],
      choices: this.fb.array([]),
    });
  }

  createAssignForm(): FormGroup {
    return this.fb.group({
      selectedQuestionId: ['', Validators.required],
    });
  }

  get choicesArray(): FormArray {
    return this.createQuestionForm.get('choices') as FormArray;
  }

  // ===============================
  // CRÉATION DE QUESTIONS - ✅ CORRIGÉ
  // ===============================

  showCreateQuestionForm(): void {
    this.showCreateForm = true;
    this.showAssignForm = false;
    this.error = null;
    this.resetCreateForm();

    // ✅ AJOUTÉ : Réinitialiser le compteur d'IDs pour avoir 1, 2, 3, 4...
    this.questionService.resetChoiceIdCounter();

    this.addChoice(); // ID = 1
    this.addChoice(); // ID = 2
    console.log('Showing create question form with fresh choice IDs');
  }

  resetCreateForm(): void {
    this.createQuestionForm.reset();
    this.createQuestionForm.patchValue({ type: 0 });

    while (this.choicesArray.length !== 0) {
      this.choicesArray.removeAt(0);
    }

    // ✅ AJOUTÉ : Réinitialiser le compteur d'IDs
    this.questionService.resetChoiceIdCounter();
  }

  addChoice(): void {
    // ✅ CORRIGÉ : Utiliser la méthode avec IDs courts
    const choiceGroup = this.fb.group({
      id: [this.questionService.generateChoiceId()], // Génère 1, 2, 3, 4...
      content: ['', Validators.required],
      isCorrect: [false],
    });

    this.choicesArray.push(choiceGroup);
    console.log(
      'Added choice with ID:',
      choiceGroup.get('id')?.value,
      'total choices:',
      this.choicesArray.length
    );
  }

  removeChoice(index: number): void {
    if (this.choicesArray.length > 2) {
      const removedChoice = this.choicesArray.at(index);
      console.log('Removing choice with ID:', removedChoice?.get('id')?.value);

      this.choicesArray.removeAt(index);
      console.log(
        'Removed choice, remaining choices:',
        this.choicesArray.length
      );
    }
  }

  submitCreateQuestion(): void {
    if (this.createQuestionForm.valid && this.test?.id) {
      console.log('Submitting new question');
      this.isLoading = true;
      this.error = null;

      const formValue = this.createQuestionForm.value;

      const choices: QuestionChoice[] = formValue.choices.map(
        (choice: any) => ({
          id: choice.id,
          content: choice.content.trim(),
        })
      );

      const correctAnswerIds: number[] = formValue.choices
        .filter((choice: any) => choice.isCorrect)
        .map((choice: any) => choice.id);

      // ✅ AJOUTÉ : Log pour déboguer les IDs
      console.log('Choices with IDs:', choices);
      console.log('Correct answer IDs:', correctAnswerIds);

      // Validation des réponses correctes
      if (correctAnswerIds.length === 0) {
        this.error = 'Vous devez sélectionner au moins une réponse correcte';
        this.isLoading = false;
        return;
      }

      if (formValue.type === 0 && correctAnswerIds.length > 1) {
        this.error =
          "Une question à choix unique ne peut avoir qu'une seule réponse correcte";
        this.isLoading = false;
        return;
      }

      const createRequest: CreateQuestionRequest = {
        content: formValue.content.trim(),
        type: formValue.type,
        answerDetails: formValue.answerDetails?.trim() || '',
        quizTestId: this.test.id,
        choices: choices,
        listOfCorrectAnswerIds:
          this.questionService.prepareCorrectAnswerIds(correctAnswerIds),
      };

      console.log('Creating question with request:', createRequest);

      this.questionService.createQuestion(createRequest).subscribe({
        next: (response: ApiResponse) => {
          console.log('Create question response:', response);

          if (response.isSuccess) {
            console.log(
              '✅ Question created successfully with ID:',
              response.id
            );
            this.showCreateForm = false;
            this.loadQuestions();
            this.error = null;
          } else {
            console.error('❌ Question creation failed:', response.error);
            this.error =
              response.error || 'Erreur lors de la création de la question';
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating question:', error);
          this.error = 'Erreur lors de la création de la question';
          this.isLoading = false;
        },
      });
    } else {
      console.log('Create form is invalid');
      this.markFormGroupTouched(this.createQuestionForm);
    }
  }

  cancelCreateForm(): void {
    this.showCreateForm = false;
    this.resetCreateForm();
    this.error = null;
    console.log('Cancelled create form and reset choice IDs');
  }

  // ===============================
  // ASSIGNATION DE QUESTIONS
  // ===============================

  showAssignQuestionForm(): void {
    console.log('Showing assign question form');
    this.showAssignForm = true;
    this.showCreateForm = false;
    this.error = null;
    this.loadAvailableQuestions();
  }

  loadAvailableQuestions(): void {
    console.log('Loading available questions for assignment');
    this.isLoading = true;

    this.questionService.getAllQuestions().subscribe({
      next: (allQuestions) => {
        console.log('All questions loaded:', allQuestions);

        // Filtrer les questions qui ne sont pas déjà assignées à ce test
        this.availableQuestions = allQuestions.filter((q) => {
          const isNotAssigned = q.quizTestId !== this.test?.id;
          const isNotInCurrentList = !this.questions.some(
            (existing) => existing.id === q.id
          );

          console.log(
            `Question ${q.id}: quizTestId=${q.quizTestId}, testId=${this.test?.id}, isNotAssigned=${isNotAssigned}, isNotInCurrentList=${isNotInCurrentList}`
          );

          return isNotAssigned && isNotInCurrentList;
        });

        console.log(
          `Filtered to ${this.availableQuestions.length} available questions`
        );
        this.isLoading = false;

        // Afficher un message si aucune question disponible
        if (this.availableQuestions.length === 0) {
          this.error =
            "Aucune question disponible pour assignation. Créez d'abord des questions non assignées.";
          setTimeout(() => {
            this.error = null;
          }, 5000);
        }
      },
      error: (error) => {
        console.error('Error loading available questions:', error);
        this.error = 'Erreur lors du chargement des questions disponibles';
        this.isLoading = false;
      },
    });
  }

  submitAssignQuestion(): void {
    if (this.assignQuestionForm.valid && this.test?.id) {
      console.log('Submitting question assignment');

      this.isLoading = true;
      this.error = null;

      const questionId = parseInt(
        this.assignQuestionForm.value.selectedQuestionId
      );
      const testId = this.test.id;

      console.log(`Assigning question ${questionId} to test ${testId}`);

      this.questionService.assignQuestionToTest(questionId, testId).subscribe({
        next: (response: ApiResponse) => {
          console.log('Assignment response:', response);

          if (response.isSuccess) {
            console.log('✅ Question assigned successfully');

            // Fermer le formulaire
            this.showAssignForm = false;
            this.assignQuestionForm.reset();

            // Recharger les questions du test
            this.loadQuestions();

            // Effacer l'erreur
            this.error = null;

            console.log('Question assignée avec succès au test');
          } else {
            console.error('❌ Assignment failed:', response.error);
            this.error =
              response.error || "Erreur lors de l'assignation de la question";
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error during assignment:', error);
          this.error = `Erreur lors de l'assignation: ${
            error.message || 'Erreur inconnue'
          }`;
          this.isLoading = false;
        },
      });
    } else {
      console.log('Assignment form is invalid');
      this.markFormGroupTouched(this.assignQuestionForm);
    }
  }

  cancelAssignForm(): void {
    console.log('Cancelling assign form');
    this.showAssignForm = false;
    this.assignQuestionForm.reset();
    this.availableQuestions = [];
    this.error = null;
  }

  // ===============================
  // SUPPRESSION DE QUESTIONS
  // ===============================

  deleteQuestion(question: QuestionDto): void {
    if (!question.id) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la question "${question.content}" ?`
      )
    ) {
      console.log('Deleting question:', question.id);
      this.isLoading = true;

      this.questionService.deleteQuestion(question.id).subscribe({
        next: () => {
          console.log('✅ Question deleted successfully');
          this.loadQuestions();
          this.error = null;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          this.error = 'Erreur lors de la suppression de la question';
          this.isLoading = false;
        },
      });
    }
  }

  // ===============================
  // MÉTHODES UTILITAIRES
  // ===============================

  getQuestionTypeLabel(type: number): string {
    return QuestionService.getQuestionTypeLabel(type);
  }

  getCorrectAnswers(question: QuestionDto): string[] {
    if (!question.choices || !question.listOfCorrectAnswerIds) return [];

    const correctIds = this.questionService.parseCorrectAnswerIds(
      question.listOfCorrectAnswerIds
    );
    return question.choices
      .filter((choice) => correctIds.includes(choice.id))
      .map((choice) => choice.content);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  // Méthodes utilitaires pour le mode 'list'
  getCategoryLabel(category: number): string {
    switch (category) {
      case 0:
        return 'None';
      case 1:
        return 'General';
      case 2:
        return 'Technical';
      default:
        return 'Unknown';
    }
  }

  getLevelLabel(level: number): string {
    switch (level) {
      case 0:
        return 'Easy';
      case 1:
        return 'Medium';
      case 2:
        return 'Hard';
      default:
        return 'Unknown';
    }
  }

  trackByTestId(index: number, test: TestDto): number {
    return test.id || index;
  }
}
