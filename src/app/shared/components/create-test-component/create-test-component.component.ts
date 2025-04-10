import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-test-component',
  templateUrl: './create-test-component.component.html',
  styleUrls: ['./create-test-component.component.scss'],
})
export class CreateTestComponentComponent implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() create = new EventEmitter<any>();

  testForm: FormGroup;
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

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.testForm.valid) {
      this.create.emit(this.testForm.value);
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.testForm.controls).forEach((key) => {
        const control = this.testForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
