// src/app/shared/components/login/login.component.ts - Version mise à jour
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  successMessage = '';
  selectedRole: UserRole = UserRole.Administrator;

  // Énums pour le template
  UserRole = UserRole;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // Rediriger vers dashboard si déjà connecté en tant qu'admin
    if (this.authService.isAdmin) {
      this.router.navigate(['/dashboard']);
    }
    // Rediriger vers tests si déjà connecté en tant que candidat
    else if (this.authService.isCandidate) {
      this.router.navigate(['/candidate-tests']);
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      userRole: [UserRole.Administrator, Validators.required],
    });
  }

  ngOnInit(): void {
    // Vérifier s'il y a un token candidat dans l'URL
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.verifyCandidateAccess(token);
    }
  }

  // Getter pour un accès facile aux champs du formulaire
  get f() {
    return this.loginForm.controls;
  }

  onRoleChange(role: UserRole): void {
    this.selectedRole = role;
    this.loginForm.patchValue({ userRole: role });
    this.error = '';
    this.successMessage = '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.successMessage = '';

    // Arrêter si le formulaire est invalide
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { email, password, userRole } = this.loginForm.value;

    this.authService.loginWithRole(email, password, userRole).subscribe({
      next: (response) => {
        console.log('Login response:', response);

        if (userRole === UserRole.Administrator && response.token) {
          // Admin connecté avec succès - redirection automatique via le service
          console.log('✅ Admin login successful');
        } else if (
          userRole === UserRole.Candidate &&
          response.requiresEmailInvitation
        ) {
          // Candidat - email envoyé
          this.successMessage =
            response.message ||
            "Un email d'invitation vous a été envoyé. Veuillez vérifier votre boîte mail.";
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.error =
          error.error?.error || error.message || 'Erreur de connexion';
        this.loading = false;
      },
    });
  }

  // Vérification d'accès candidat via token
  private verifyCandidateAccess(token: string): void {
    console.log('🔍 Verifying candidate access token...');
    this.loading = true;

    this.authService.verifyCandidateAccess(token).subscribe({
      next: (response) => {
        console.log('✅ Candidate access verified');
        // Redirection automatique via le service
      },
      error: (error) => {
        console.error('❌ Token verification failed:', error);
        this.error = "Lien d'invitation invalide ou expiré";
        this.loading = false;
      },
    });
  }
}
