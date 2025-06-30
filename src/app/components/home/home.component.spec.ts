import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { SofaProductService } from '../../../services/sofa-product.service';
import { VariantService } from '../../../services/variant.service';
import { RivestimentoService } from '../../../services/rivestimento.service';
import { ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let sofaProductServiceSpy: jasmine.SpyObj<SofaProductService>;
  let variantServiceSpy: jasmine.SpyObj<VariantService>;
  let rivestimentoServiceSpy: jasmine.SpyObj<RivestimentoService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    sofaProductServiceSpy = jasmine.createSpyObj('SofaProductService', ['getSofaProducts', 'deleteSofaProduct']);
    variantServiceSpy = jasmine.createSpyObj('VariantService', ['getVariantsBySofaId']);
    rivestimentoServiceSpy = jasmine.createSpyObj('RivestimentoService', ['getRivestimenti']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    sofaProductServiceSpy.getSofaProducts.and.returnValue(of([]));
    variantServiceSpy.getVariantsBySofaId.and.returnValue(of([]));
    rivestimentoServiceSpy.getRivestimenti.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: SofaProductService, useValue: sofaProductServiceSpy },
        { provide: VariantService, useValue: variantServiceSpy },
        { provide: RivestimentoService, useValue: rivestimentoServiceSpy },
        { provide: Router, useValue: routerSpy },
        ConfirmationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(sofaProductServiceSpy.getSofaProducts).toHaveBeenCalled();
  });

  it('should load rivestimenti on init', () => {
    expect(rivestimentoServiceSpy.getRivestimenti).toHaveBeenCalled();
  });
});
