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
import { TestAccessComponent } from './shared/components/test-access/test-access.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'tests', component: TestsComponent },
  { path: 'test-invitation/:testId', component: TestInvitationComponent },
  { path: 'test-access/:token', component: TestAccessComponent },
  {
    path: 'questions',
    component: QuestionManagementComponent,
  }, // Sans testId - affichera la liste des tests
  {
    path: 'question-management/:testId',
    component: QuestionManagementComponent,
  }, // Avec testId - gestion des questions du test
  { path: 'candidates', component: CandidatesComponent },
  { path: 'candidates/new', component: CandidateFormComponent },
  { path: 'candidates/:id/edit', component: CandidateFormComponent },
  { path: 'take-test/:id', component: TestTakingComponent },
  { path: 'test-result', component: TestResultComponent },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
