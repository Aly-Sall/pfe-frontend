import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateTestsComponent } from './candidate-tests.component';

describe('CandidateTestsComponent', () => {
  let component: CandidateTestsComponent;
  let fixture: ComponentFixture<CandidateTestsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CandidateTestsComponent]
    });
    fixture = TestBed.createComponent(CandidateTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
