import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestAccessComponent } from './test-access.component';

describe('TestAccessComponent', () => {
  let component: TestAccessComponent;
  let fixture: ComponentFixture<TestAccessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestAccessComponent]
    });
    fixture = TestBed.createComponent(TestAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
