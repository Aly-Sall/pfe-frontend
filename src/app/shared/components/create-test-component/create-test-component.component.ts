import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Interface pour TestDto (à définir dans votre service ou à importer)
interface TestDto {
  id?: number;
  title: string;
  category: number;
  mode: number;
  tryAgain: boolean;
  showTimer: boolean;
  level: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-create-test-component',
  templateUrl: './create-test-component.component.html',
  styleUrls: ['./create-test-component.component.scss'],
})
export class CreateTestComponentComponent implements OnInit, OnChanges {
  @Input() test?: TestDto; // Ajout de l'input test pour l'édition
  @Output() cancel = new EventEmitter<void>();
  @Output() create = new EventEmitter<any>();
  @Output() update = new EventEmitter<TestDto>(); // Nouvel output pour les mises à jour

  testForm: FormGroup;
  isEditMode: boolean = false;

  testTypes = [
    'Technical Assessment',
    'Coding Challenge',
    'Aptitude Test',
    'Behavioral Assessment',
  ];

  constructor(private fb: FormBuilder) {
    this.testForm = this.fb.group({
      testType: ['Technical Assessment', Validators.required],
      testName: ['', Validators.required],
      description: [''],
      duration: ['', [Validators.required, Validators.min(1)]],
      totalPoints: ['', [Validators.required, Validators.min(1)]],
      startDate: [''],
      dueDate: [''],
      settings: this.fb.group({
        randomizeQuestions: [true],
        showResultsImmediately: [false],
        allowMultipleAttempts: [false],
      }),
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['test'] && changes['test'].currentValue) {
      this.isEditMode = true;
      this.initializeForm();
    }
  }

  initializeForm(): void {
    if (this.test) {
      // En mode édition, remplir le formulaire avec les données du test
      this.testForm.patchValue({
        testType: this.getTestTypeLabel(this.test.category),
        testName: this.test.title,
        // Les autres propriétés comme la description ne sont pas disponibles dans le modèle TestDto
        settings: {
          allowMultipleAttempts: this.test.tryAgain,
          // Les autres propriétés de settings peuvent être ajoutées si disponibles
        },
      });
    }
  }

  getTestTypeLabel(category: number): string {
    // Conversion de la catégorie en libellé
    switch (category) {
      case 1:
        return 'Technical Assessment';
      case 2:
        return 'Coding Challenge';
      default:
        return 'Technical Assessment';
    }
  }

  onSubmit(): void {
    if (this.testForm.valid) {
      if (this.isEditMode && this.test) {
        // Mode mise à jour
        const updatedTest: TestDto = {
          ...this.test,
          title: this.testForm.value.testName,
          category: this.getCategoryFromType(this.testForm.value.testType),
          tryAgain: this.testForm.value.settings.allowMultipleAttempts,
          // Mettre à jour d'autres propriétés selon les besoins
        };
        this.update.emit(updatedTest);
      } else {
        // Mode création
        this.create.emit(this.testForm.value);
      }
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.testForm.controls).forEach((key) => {
        const control = this.testForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  getCategoryFromType(type: string): number {
    // Conversion du libellé en catégorie
    switch (type) {
      case 'Technical Assessment':
        return 1;
      case 'Coding Challenge':
        return 2;
      default:
        return 0;
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
