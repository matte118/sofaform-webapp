import { SofaProduct } from './sofa-product.model';
import { Variant } from './variant.model';
import { Rivestimento } from './rivestimento.model';
import { ExtraMattress } from './extra-mattress.model';

export interface ListinoPdfData {
    product: SofaProduct;
    variants: Variant[];
    rivestimenti: { rivestimento: Rivestimento; metri: number }[];
    extraMattresses: ExtraMattress[];
    markupPercentage: number;
    deliveryPrice: number;
}
