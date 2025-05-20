// src/app/routing/test-taking-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestTakingComponent } from '../shared/components/test-taking/test-taking.component';
import { TestResultComponent } from '../shared/components/test-result/test-result.component';

const routes: Routes = [
  {
    path: 'take-test/:id',
    component: TestTakingComponent,
  },
  {
    path: 'test-result',
    component: TestResultComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestTakingRoutingModule {}
