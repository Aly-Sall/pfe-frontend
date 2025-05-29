// src/app/shared/components/create-test-component/create-test-component.component.ts
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

// Interface alignée avec le backend CreateTestCommand
interface CreateTestCommand {
  title: string;
  category: number; // 0: None, 1: General, 2: Technical
  mode: number; // 0: Training, 1: Recruitment
  tryAgain: boolean;
  showTimer: boolean;
  level: number; // 0: Easy, 1: Medium, 2: Hard
}

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
  @Input() test?: TestDto;
  @Output() cancel = new EventEmitter<void>();
  @Output() create = new EventEmitter<CreateTestCommand>();
  @Output() update = new EventEmitter<TestDto>();

  testForm: FormGroup;
  isEditMode: boolean = false;

  // Options alignées avec les enums du backend
  categories = [
    { value: 0, label: 'None' },
    { value: 1, label: 'General' },
    { value: 2, label: 'Technical' },
  ];

  modes = [
    { value: 0, label: 'Training' },
    { value: 1, label: 'Recruitment' },
  ];

  levels = [
    { value: 0, label: 'Easy' },
    { value: 1, label: 'Medium' },
    { value: 2, label: 'Hard' },
  ];

  constructor(private fb: FormBuilder) {
    // CORRIGÉ: FormGroup simplifié avec seulement les champs nécessaires
    this.testForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: [1, Validators.required], // Default to General
      mode: [0, Validators.required], // Default to Training
      level: [0, Validators.required], // Default to Easy
      tryAgain: [false], // Envoyé au backend
      showTimer: [true], // Envoyé au backend
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
        title: this.test.title,
        category: this.test.category,
        mode: this.test.mode,
        level: this.test.level,
        tryAgain: this.test.tryAgain,
        showTimer: this.test.showTimer,
      });
    }
  }

  onSubmit(): void {
    console.log('Form submitted');
    console.log('Form valid:', this.testForm.valid);
    console.log('Form value:', this.testForm.value);

    if (this.testForm.valid) {
      const formValue = this.testForm.value;

      if (this.isEditMode && this.test) {
        // Mode mise à jour
        const updatedTest: TestDto = {
          ...this.test,
          title: formValue.title,
          category: Number(formValue.category), // S'assurer que c'est un nombre
          mode: Number(formValue.mode),
          level: Number(formValue.level),
          tryAgain: Boolean(formValue.tryAgain),
          showTimer: Boolean(formValue.showTimer),
        };

        console.log('Emitting update event with:', updatedTest);
        this.update.emit(updatedTest);
      } else {
        // Mode création - CORRIGÉ: Validation et conversion des types
        const createCommand: CreateTestCommand = {
          title: String(formValue.title).trim(),
          category: Number(formValue.category),
          mode: Number(formValue.mode),
          level: Number(formValue.level),
          tryAgain: Boolean(formValue.tryAgain),
          showTimer: Boolean(formValue.showTimer),
        };

        console.log('Emitting create event with:', createCommand);
        this.create.emit(createCommand);
      }
    } else {
      console.log('Form is invalid');
      console.log('Form errors:', this.getFormErrors());

      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.testForm.controls).forEach((key) => {
        const control = this.testForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    console.log('Form cancelled');
    this.cancel.emit();
  }

  // AJOUTÉ: Méthode pour déboguer les erreurs du formulaire
  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.testForm.controls).forEach((key) => {
      const control = this.testForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  // Helper pour obtenir le libellé d'une catégorie
  getCategoryLabel(categoryValue: number): string {
    const category = this.categories.find((c) => c.value === categoryValue);
    return category ? category.label : 'Unknown';
  }

  // Helper pour obtenir le libellé d'un mode
  getModeLabel(modeValue: number): string {
    const mode = this.modes.find((m) => m.value === modeValue);
    return mode ? mode.label : 'Unknown';
  }

  // Helper pour obtenir le libellé d'un niveau
  getLevelLabel(levelValue: number): string {
    const level = this.levels.find((l) => l.value === levelValue);
    return level ? level.label : 'Unknown';
  }
}
