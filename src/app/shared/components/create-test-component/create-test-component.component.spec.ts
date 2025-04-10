import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTestComponentComponent } from './create-test-component.component';

describe('CreateTestComponentComponent', () => {
  let component: CreateTestComponentComponent;
  let fixture: ComponentFixture<CreateTestComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateTestComponentComponent]
    });
    fixture = TestBed.createComponent(CreateTestComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
