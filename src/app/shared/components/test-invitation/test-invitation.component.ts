// src/app/shared/components/test-invitation/test-invitation.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TestInvitationService,
  SendInvitationRequest,
} from '../../../core/services/test-invitation.service';
import { TestService, TestDto } from '../../../core/services/test.service';

@Component({
  selector: 'app-test-invitation',
  templateUrl: './test-invitation.component.html',
  styleUrls: ['./test-invitation.component.scss'],
})
export class TestInvitationComponent implements OnInit {
  invitationForm: FormGroup;
  test: TestDto | null = null;
  testId: number = 0;
  isLoading = false;
  isSending = false;
  success = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private testInvitationService: TestInvitationService,
    private testService: TestService
  ) {
    this.invitationForm = this.fb.group({
      singleInvitation: this.fb.group({
        candidateEmail: ['', [Validators.required, Validators.email]],
        candidateName: ['', Validators.required],
        expirationHours: [
          72,
          [Validators.required, Validators.min(1), Validators.max(168)],
        ],
      }),
      bulkInvitations: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    const testId = this.route.snapshot.paramMap.get('testId');
    if (testId) {
      this.testId = +testId;
      this.loadTest();
    }
  }

  loadTest(): void {
    this.isLoading = true;
    this.testService.getTestById(this.testId).subscribe({
      next: (test) => {
        this.test = test;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement du test';
        this.isLoading = false;
      },
    });
  }

  get bulkInvitationsArray(): FormArray {
    return this.invitationForm.get('bulkInvitations') as FormArray;
  }

  addBulkInvitation(): void {
    const invitationGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
    });
    this.bulkInvitationsArray.push(invitationGroup);
  }

  removeBulkInvitation(index: number): void {
    this.bulkInvitationsArray.removeAt(index);
  }

  sendSingleInvitation(): void {
    if (this.invitationForm.get('singleInvitation')?.valid) {
      this.isSending = true;
      this.error = null;

      const formValue = this.invitationForm.get('singleInvitation')?.value;
      const request: SendInvitationRequest = {
        candidateEmail: formValue.candidateEmail,
        candidateName: formValue.candidateName,
        testId: this.testId,
        expirationHours: formValue.expirationHours,
      };

      this.testInvitationService.sendInvitation(request).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.success = true;
            this.invitationForm
              .get('singleInvitation')
              ?.reset({ expirationHours: 72 });
          } else {
            this.error =
              response.error || "Erreur lors de l'envoi de l'invitation";
          }
          this.isSending = false;
        },
        error: (error) => {
          this.error = "Erreur lors de l'envoi de l'invitation";
          this.isSending = false;
        },
      });
    }
  }

  sendBulkInvitations(): void {
    if (
      this.bulkInvitationsArray.valid &&
      this.bulkInvitationsArray.length > 0
    ) {
      this.isSending = true;
      this.error = null;

      const request = {
        testId: this.testId,
        expirationHours: 72,
        invitations: this.bulkInvitationsArray.value,
      };

      this.testInvitationService.sendBulkInvitations(request).subscribe({
        next: (response) => {
          this.success = true;
          this.bulkInvitationsArray.clear();
          this.isSending = false;
        },
        error: (error) => {
          this.error = "Erreur lors de l'envoi des invitations en masse";
          this.isSending = false;
        },
      });
    }
  }
}
