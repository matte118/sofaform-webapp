import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneComponentiComponent } from './gestione-componenti.component';

describe('GestioneComponentiComponent', () => {
  let component: GestioneComponentiComponent;
  let fixture: ComponentFixture<GestioneComponentiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestioneComponentiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestioneComponentiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
