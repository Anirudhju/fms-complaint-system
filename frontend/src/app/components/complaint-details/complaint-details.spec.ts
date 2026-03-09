import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplaintDetails } from './complaint-details';

describe('ComplaintDetails', () => {
  let component: ComplaintDetails;
  let fixture: ComponentFixture<ComplaintDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplaintDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplaintDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
