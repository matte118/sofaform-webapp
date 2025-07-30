import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SofaProduct } from '../../../../models/sofa-product.model';
import { Variant } from '../../../../models/variant.model';
import { Rivestimento } from '../../../../models/rivestimento.model';
import { ExtraMattress } from '../../../../models/extra-mattress.model';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-listino-pdf-template',
    standalone: true,
    imports: [CommonModule, CardModule],
    templateUrl: './listino-pdf-template.component.html',
    styleUrls: ['./listino-pdf-template.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListinoPdfTemplateComponent {
    @Input() product!: SofaProduct;
    @Input() variants: Variant[] = [];
    @Input() rivestimenti: { rivestimento: Rivestimento; metri: number }[] = [];
    @Input() extraMattresses: ExtraMattress[] = [];
    @Input() markupPercentage: number = 30;
    @Input() deliveryPrice: number = 0;

    getVariantTotalWithMarkup(variant: Variant): number {
        const baseTotal = this.getVariantBaseTotal(variant);
        const markupFactor = (100 - this.markupPercentage) / 100;
        return markupFactor > 0 ? baseTotal / markupFactor : baseTotal;
    }

    getVariantBaseTotal(variant: Variant): number {
        return variant.price + this.getRivestimentiTotal() + this.deliveryPrice;
    }

    getRivestimentiTotal(): number {
        return this.rivestimenti.reduce((sum, r) => sum + r.rivestimento.mtPrice * r.metri, 0);
    }

    getExtraMattressesTotal(): number {
        return this.extraMattresses.reduce((sum, m) => sum + (m.price || 0), 0);
    }

    formatPrice(price: number): string {
        return price.toFixed(2);
    }

    getCurrentDate(): string {
        return new Date().toLocaleDateString('it-IT');
    }
}
