// src/app/app.module.ts - Version mise à jour avec surveillance
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Webcam module
import { WebcamModule } from 'ngx-webcam';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Components
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ContentAreaComponent } from './shared/components/content-area/content-area.component';
import { DashboardComponent } from './shared/components/dashboard/dashboard.component';
import { TestsComponent } from './shared/components/tests/tests.component';
import { CreateTestComponentComponent } from './shared/components/create-test-component/create-test-component.component';
import { CandidatesComponent } from './shared/components/candidates/candidates.component';
import { CandidateFormComponent } from './shared/components/candidate-form/candidate-form.component';
import { TestTakingComponent } from './shared/components/test-taking/test-taking.component';
import { TestResultComponent } from './shared/components/test-result/test-result.component';
import { QuestionAnswerComponent } from './shared/components/question-answer/question-answer.component';
import { LoginComponent } from './shared/components/login/login.component';
import { QuestionManagementComponent } from './shared/components/question-management/question-management.component';
import { WebcamComponent } from './shared/components/webcam/webcam.component'; // ✅ NOUVEAU

// Interceptors
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';

// Services
import { AuthService } from './core/services/auth.service';
import { TestService } from './core/services/test.service';
import { TestAttemptService } from './core/services/test-attempt.service';
import { CandidatesService } from './core/services/candidates.service';
import { DashboardService } from './core/services/dashboard.service';
import { CandidateEventService } from './core/services/candidate-event.service';
import { LoadingService } from './core/services/loading.service';
import { ErrorService } from './core/services/error.service';
import { QuestionService } from './core/services/question.service';
import { SurveillanceService } from './core/services/surveillance.service'; // ✅ NOUVEAU

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
    TestTakingComponent,
    TestResultComponent,
    QuestionAnswerComponent,
    LoginComponent,
    QuestionManagementComponent,
    WebcamComponent, // ✅ AJOUTÉ
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    WebcamModule, // ✅ AJOUTÉ pour la webcam
  ],
  providers: [
    // Services
    AuthService,
    TestService,
    TestAttemptService,
    CandidatesService,
    DashboardService,
    CandidateEventService,
    LoadingService,
    ErrorService,
    QuestionService,
    SurveillanceService, // ✅ AJOUTÉ

    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
