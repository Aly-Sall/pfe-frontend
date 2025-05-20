// candidate-form.component.ts (amélioré)
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CandidatesService,
  Candidate,
} from '../../../core/services/candidates.service';
import { CandidateEventService } from '../../../core/services/candidate-event.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-candidate-form',
  templateUrl: './candidate-form.component.html',
  styleUrls: ['./candidate-form.component.scss'],
})
export class CandidateFormComponent implements OnInit {
  candidateForm: FormGroup;
  isSubmitting: boolean = false;
  isEditing: boolean = false;
  candidateId: number | null = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private candidatesService: CandidatesService,
    private candidateEventService: CandidateEventService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('CandidateFormComponent constructor');
    this.candidateForm = this.fb.group({
      nom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      date: [this.formatDateForInput(new Date()), [Validators.required]],
      status: ['active', [Validators.required]],
    });
  }

  ngOnInit(): void {
    console.log('CandidateFormComponent ngOnInit');
    // Vérifier si nous sommes en mode édition
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditing = true;
        this.candidateId = +params['id'];
        this.loadCandidate(this.candidateId);
      }
    });
  }

  loadCandidate(id: number): void {
    console.log('Loading candidate with ID:', id);
    this.candidatesService.getCandidate(id).subscribe(
      (candidate: Candidate) => {
        console.log('Candidate loaded:', candidate);
        this.candidateForm.patchValue({
          nom: candidate.nom,
          email: candidate.email,
          date: this.formatDateForInput(candidate.date),
          status: candidate.status,
        });
      },
      (error) => {
        this.error =
          'Erreur lors du chargement du candidat. Veuillez réessayer.';
        console.error('Erreur lors du chargement du candidat', error);
      }
    );
  }

  onSubmit(): void {
    console.log('Form submitted, valid:', this.candidateForm.valid);
    if (this.candidateForm.valid) {
      this.isSubmitting = true;
      this.error = null;

      const formValue = this.candidateForm.value;
      const candidateData: Candidate = {
        ...formValue,
        id: this.isEditing ? this.candidateId! : 0,
        date: new Date(formValue.date), // Convertir la chaîne en objet Date
      };

      console.log('Candidate data to submit:', candidateData);

      const operation = this.isEditing
        ? this.candidatesService.updateCandidate({
            ...candidateData,
            id: this.candidateId!,
          })
        : this.candidatesService.createCandidate(candidateData);

      operation.pipe(finalize(() => (this.isSubmitting = false))).subscribe(
        (result) => {
          console.log('Operation successful, result:', result);

          // Notifier les autres composants de l'ajout/modification du candidat
          // Important: Faire cela AVANT la navigation
          if (this.isEditing) {
            this.candidateEventService.notifyCandidateUpdated(result);
          } else {
            this.candidateEventService.notifyCandidateAdded(result);
          }

          // Demander un rafraîchissement de la liste
          this.candidateEventService.notifyRefreshList();

          // Ajouter un délai court pour s'assurer que les événements sont traités
          setTimeout(() => {
            // Naviguer vers la liste
            this.router.navigate(['/candidates']);
          }, 50);
        },
        (error) => {
          this.error =
            "Erreur lors de l'enregistrement du candidat. Veuillez réessayer.";
          console.error("Erreur lors de l'enregistrement du candidat", error);
        }
      );
    } else {
      console.log('Form is invalid, errors:', this.candidateForm.errors);
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.candidateForm.controls).forEach((key) => {
        this.candidateForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    console.log('Form canceled');
    this.router.navigate(['/candidates']);
  }

  // Utilitaire pour formater les dates pour l'input HTML
  private formatDateForInput(date: Date): string {
    // Format YYYY-MM-DD pour les inputs de type date
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
