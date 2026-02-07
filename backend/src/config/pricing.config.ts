/**
 * Tax configuration for pricing calculations
 * All prices in the system are NET (netto) and VAT must be added
 */

export const VAT_RATES = {
    STANDARD: 19, // Standard VAT rate in Germany (19%)
    REDUCED: 7,   // Reduced VAT rate (7%)
} as const;

/**
 * Calculate gross price from net price with VAT
 * @param netPrice - Net price (netto)
 * @param vatRate - VAT rate percentage (default: 19%)
 * @returns Gross price (brutto) rounded to 2 decimals
 */
export const calculateGrossPrice = (netPrice: number, vatRate: number = VAT_RATES.STANDARD): number => {
    return Math.round(netPrice * (1 + vatRate / 100) * 100) / 100;
};

/**
 * Calculate net price from gross price
 * @param grossPrice - Gross price (brutto)
 * @param vatRate - VAT rate percentage (default: 19%)
 * @returns Net price (netto) rounded to 2 decimals
 */
export const calculateNetPrice = (grossPrice: number, vatRate: number = VAT_RATES.STANDARD): number => {
    return Math.round((grossPrice / (1 + vatRate / 100)) * 100) / 100;
};

/**
 * Calculate VAT amount from net price
 * @param netPrice - Net price (netto)
 * @param vatRate - VAT rate percentage (default: 19%)
 * @returns VAT amount rounded to 2 decimals
 */
export const calculateVatAmount = (netPrice: number, vatRate: number = VAT_RATES.STANDARD): number => {
    return Math.round(netPrice * (vatRate / 100) * 100) / 100;
};

/**
 * Pricing configuration
 */
export const PRICING = {
    // Online course pricing (NETTO)
    ONLINE_COURSE_MONTHLY_NET: 49.00, // €49/month netto

    // Practical course addons (NETTO)
    PLASTIC_CARD_NET: 14.99, // Plastikkarte netto

    // Apply VAT to get gross prices
    getOnlineCourseGross: () => calculateGrossPrice(PRICING.ONLINE_COURSE_MONTHLY_NET),
    getPlasticCardGross: () => calculateGrossPrice(PRICING.PLASTIC_CARD_NET),
} as const;

export default {
    VAT_RATES,
    PRICING,
    calculateGrossPrice,
    calculateNetPrice,
    calculateVatAmount,
};