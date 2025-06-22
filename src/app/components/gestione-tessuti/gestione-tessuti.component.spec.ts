import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestioneTessutiComponent } from './gestione-tessuti.component';

describe('GestioneTessutiComponent', () => {
  let component: GestioneTessutiComponent;
  let fixture: ComponentFixture<GestioneTessutiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestioneTessutiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestioneTessutiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
