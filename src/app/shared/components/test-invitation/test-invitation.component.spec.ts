import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestInvitationComponent } from './test-invitation.component';

describe('TestInvitationComponent', () => {
  let component: TestInvitationComponent;
  let fixture: ComponentFixture<TestInvitationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestInvitationComponent]
    });
    fixture = TestBed.createComponent(TestInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
