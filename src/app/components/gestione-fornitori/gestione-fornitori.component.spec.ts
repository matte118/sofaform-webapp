import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneFornitoriComponent } from './gestione-fornitori.component';

describe('GestioneFornitoriComponent', () => {
  let component: GestioneFornitoriComponent;
  let fixture: ComponentFixture<GestioneFornitoriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestioneFornitoriComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestioneFornitoriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
