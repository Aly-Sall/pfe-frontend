import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTakingComponent } from './test-taking.component';

describe('TestTakingComponent', () => {
  let component: TestTakingComponent;
  let fixture: ComponentFixture<TestTakingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestTakingComponent]
    });
    fixture = TestBed.createComponent(TestTakingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
