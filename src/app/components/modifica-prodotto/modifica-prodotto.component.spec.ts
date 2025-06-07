import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificaProdottoComponent } from './modifica-prodotto.component';

describe('ModificaProdottoComponent', () => {
  let component: ModificaProdottoComponent;
  let fixture: ComponentFixture<ModificaProdottoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModificaProdottoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModificaProdottoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
