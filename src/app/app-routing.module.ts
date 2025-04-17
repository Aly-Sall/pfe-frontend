import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './shared/components/dashboard/dashboard.component';
import { TestsComponent } from './shared/components/tests/tests.component';
import { CandidatesComponent } from './shared/components/candidates/candidates.component';

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'tests', component: TestsComponent },
  { path: 'candidates', component: CandidatesComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
