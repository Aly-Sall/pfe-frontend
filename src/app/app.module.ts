import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

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

// Interceptors - CORRECTION ICI
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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
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
