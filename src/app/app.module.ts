import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ContentAreaComponent } from './shared/components/content-area/content-area.component';
import { DashboardComponent } from './shared/components/dashboard/dashboard.component';
import { TestsComponent } from './shared/components/tests/tests.component';
import { CreateTestComponentComponent } from './shared/components/create-test-component/create-test-component.component';
import { CandidatesComponent } from './shared/components/candidates/candidates.component';
import { CandidateFormComponent } from './shared/components/candidate-form/candidate-form.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    NavbarComponent,
    ContentAreaComponent,
    DashboardComponent,
    TestsComponent,
    CreateTestComponentComponent,
    CandidatesComponent,
    CandidateFormComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
