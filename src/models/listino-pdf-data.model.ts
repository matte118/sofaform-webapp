import { SofaProduct } from './sofa-product.model';
import { Variant } from './variant.model';
import { Rivestimento } from './rivestimento.model';

export interface ListinoPdfData {
    product: SofaProduct;
    variants: Variant[];
    rivestimentiByVariant: { [variantId: string]: { rivestimento: Rivestimento; metri: number }[] };
    extras: { name: string; price: number }[];
    markupPercentage: number;
    deliveryPrice: number;
}
