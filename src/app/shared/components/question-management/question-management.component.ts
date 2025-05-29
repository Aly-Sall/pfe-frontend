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
import { TestDto } from '../../../core/services/test.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-question-management',
  templateUrl: './question-management.component.html',
  styleUrls: ['./question-management.component.scss'],
})
export class QuestionManagementComponent implements OnInit, OnChanges {
  @Input() test!: TestDto;

  questions: QuestionDto[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  showCreateForm: boolean = false;
  showAssignForm: boolean = false; // DÉSACTIVÉ temporairement

  createQuestionForm: FormGroup;
  assignQuestionForm: FormGroup;

  availableQuestions: QuestionDto[] = [];

  questionTypes = QuestionService.getQuestionTypesForSelect();

  constructor(
    private route: ActivatedRoute,
    private questionService: QuestionService,
    private fb: FormBuilder
  ) {
    this.createQuestionForm = this.createForm();
    this.assignQuestionForm = this.createAssignForm();
  }

  ngOnInit(): void {
    const testId = +this.route.snapshot.paramMap.get('testId')!;
    if (testId) {
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
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['test'] && changes['test'].currentValue?.id) {
      this.loadQuestions();
    }
  }

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

  loadQuestions(): void {
    if (!this.test?.id) return;

    this.isLoading = true;
    this.error = null;

    this.questionService.getQuestionsByTestId(this.test.id).subscribe({
      next: (questions) => {
        this.questions = questions;
        this.isLoading = false;
        console.log('Questions loaded successfully:', questions);
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.error = 'Erreur lors du chargement des questions';
        this.isLoading = false;
      },
    });
  }

  // TEMPORAIREMENT DÉSACTIVÉ car l'endpoint n'existe pas
  loadAvailableQuestions(): void {
    console.warn(
      'loadAvailableQuestions: Cette fonctionnalité est temporairement désactivée'
    );
    // this.questionService.getAllQuestions().subscribe({
    //   next: (questions) => {
    //     this.availableQuestions = questions.filter(
    //       (q) => !this.questions.some((existing) => existing.id === q.id)
    //     );
    //   },
    //   error: (error) => {
    //     console.error('Error loading available questions:', error);
    //   },
    // });
  }

  showCreateQuestionForm(): void {
    this.showCreateForm = true;
    this.showAssignForm = false;
    this.resetCreateForm();
    this.addChoice();
    this.addChoice();
  }

  // TEMPORAIREMENT DÉSACTIVÉ
  showAssignQuestionForm(): void {
    console.warn(
      'showAssignQuestionForm: Cette fonctionnalité est temporairement désactivée'
    );
    this.error = "La fonctionnalité d'assignation n'est pas encore disponible";
    // this.showAssignForm = true;
    // this.showCreateForm = false;
    // this.loadAvailableQuestions();
  }

  resetCreateForm(): void {
    this.createQuestionForm.reset();
    this.createQuestionForm.patchValue({ type: 0 });

    while (this.choicesArray.length !== 0) {
      this.choicesArray.removeAt(0);
    }
  }

  addChoice(): void {
    const choiceGroup = this.fb.group({
      id: [this.questionService.generateChoiceId()],
      content: ['', Validators.required],
      isCorrect: [false],
    });

    this.choicesArray.push(choiceGroup);
  }

  removeChoice(index: number): void {
    if (this.choicesArray.length > 2) {
      this.choicesArray.removeAt(index);
    }
  }

  submitCreateQuestion(): void {
    if (this.createQuestionForm.valid && this.test?.id) {
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
          console.log('Question creation response:', response);

          if (response.isSuccess) {
            this.showCreateForm = false;
            this.loadQuestions(); // Recharger la liste des questions
            this.error = null;
            console.log('Question created successfully with ID:', response.id);
          } else {
            this.error =
              response.error || 'Erreur lors de la création de la question';
            console.error('Question creation failed:', response.error);
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating question:', error);
          this.error =
            'Erreur lors de la création de la question: ' +
            (error.message || 'Erreur inconnue');
          this.isLoading = false;
        },
      });
    } else {
      console.log('Form is invalid');
      this.markFormGroupTouched(this.createQuestionForm);
    }
  }

  // TEMPORAIREMENT DÉSACTIVÉ
  submitAssignQuestion(): void {
    console.warn(
      'submitAssignQuestion: Cette fonctionnalité est temporairement désactivée'
    );
    this.error = "La fonctionnalité d'assignation n'est pas encore disponible";

    // Code original commenté
    // if (this.assignQuestionForm.valid && this.test?.id) {
    //   this.isLoading = true;
    //   const questionId = this.assignQuestionForm.value.selectedQuestionId;
    //   this.questionService.assignQuestionToTest(questionId, this.test.id).subscribe({
    //     next: (response: ApiResponse) => {
    //       if (response.isSuccess) {
    //         this.showAssignForm = false;
    //         this.loadQuestions();
    //         this.error = null;
    //       } else {
    //         this.error = response.error || "Erreur lors de l'assignation de la question";
    //       }
    //       this.isLoading = false;
    //     },
    //     error: (error) => {
    //       console.error('Error assigning question:', error);
    //       this.error = "Erreur lors de l'assignation de la question";
    //       this.isLoading = false;
    //     },
    //   });
    // }
  }

  deleteQuestion(question: QuestionDto): void {
    if (!question.id) return;

    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la question "${question.content}" ?`
      )
    ) {
      this.isLoading = true;

      this.questionService.deleteQuestion(question.id).subscribe({
        next: () => {
          this.loadQuestions();
          this.error = null;
          this.isLoading = false;
          console.log('Question deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          this.error = 'Erreur lors de la suppression de la question';
          this.isLoading = false;
        },
      });
    }
  }

  cancelCreateForm(): void {
    this.showCreateForm = false;
    this.resetCreateForm();
    this.error = null;
  }

  cancelAssignForm(): void {
    this.showAssignForm = false;
    this.assignQuestionForm.reset();
    this.error = null;
  }

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
}
