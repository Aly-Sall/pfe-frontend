// src/app/app-routing.module.ts - Version mise à jour avec guards
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { DashboardComponent } from './shared/components/dashboard/dashboard.component';
import { TestsComponent } from './shared/components/tests/tests.component';
import { CandidatesComponent } from './shared/components/candidates/candidates.component';
import { CandidateFormComponent } from './shared/components/candidate-form/candidate-form.component';
import { TestTakingComponent } from './shared/components/test-taking/test-taking.component';
import { TestResultComponent } from './shared/components/test-result/test-result.component';
import { LoginComponent } from './shared/components/login/login.component';
import { QuestionManagementComponent } from './shared/components/question-management/question-management.component';
import { TestInvitationComponent } from './shared/components/test-invitation/test-invitation.component';
import { CandidateTestsComponent } from './shared/components/candidate-tests/candidate-tests.component';

// Guards
import {
  AuthGuard,
  AdminGuard,
  CandidateGuard,
} from '../app/core/guards/auth.gard';
import { UserRole } from './core/services/auth.service';

const routes: Routes = [
  // Route par défaut - redirection intelligente
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // Page de connexion (accessible à tous)
  {
    path: 'login',
    component: LoginComponent,
  },

  // Routes ADMIN uniquement
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'tests',
    component: TestsComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'test-invitation/:testId',
    component: TestInvitationComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'questions',
    component: QuestionManagementComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'question-management/:testId',
    component: QuestionManagementComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'candidates',
    component: CandidatesComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'candidates/new',
    component: CandidateFormComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'candidates/:id/edit',
    component: CandidateFormComponent,
    canActivate: [AdminGuard],
  },

  // Routes CANDIDAT uniquement
  {
    path: 'candidate-tests',
    component: CandidateTestsComponent,
    canActivate: [CandidateGuard],
  },

  // Routes PARTAGÉES (Admin et Candidat)
  {
    path: 'take-test/:id',
    component: TestTakingComponent,
    canActivate: [AuthGuard],
    data: { expectedRoles: [UserRole.Administrator, UserRole.Candidate] },
  },
  {
    path: 'test-result',
    component: TestResultComponent,
    canActivate: [AuthGuard],
    data: { expectedRoles: [UserRole.Administrator, UserRole.Candidate] },
  },

  // Route wildcard - redirection vers page appropriée selon le rôle
  {
    path: '**',
    redirectTo: '/login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
