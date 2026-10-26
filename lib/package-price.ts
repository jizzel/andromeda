/**
 * Package discounts (`ProposalPackage.originalPrice` / `discountLabel`):
 * the price before the discount is shown struck through beside the price,
 * with the discount's amount and percentage worked out here, so the figures
 * can't contradict each other. Client-safe; also used by validation.
 */

interface PricedPackage {
  totalPrice: string;
  originalPrice?: string;
  discountLabel?: string;
}

/** The single amount in a price string ("GH₵5,500" → 5500), or null when it has none or several (ranges). */
export function parseAmount(price: string): number | null {
  const numbers = price.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!numbers || numbers.length !== 1) return null;
  const value = Number(numbers[0].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

/** Cedi spellings that mean the same currency. */
const CEDI = /^(gh₵|ghs|ghc|₵|cedis?)$/;

/**
 * Everything around a price's amount, normalised: the currency before it and
 * the terms after it ("GH₵8,500 per year" → { currency: "ghs", terms: "per year" }).
 * Case, spacing and punctuation don't matter, and the cedi's spellings count
 * as one currency. Null when the price isn't a single amount.
 */
export function priceUnit(price: string): { currency: string; terms: string } | null {
  if (parseAmount(price) === null) return null;
  const match = price.match(/\d[\d,]*(?:\.\d+)?/)!;
  const clean = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{Sc}]+/gu, " ").trim().replace(/\s+/g, " ");
  const currency = clean(price.slice(0, match.index)).replace(/\s+/g, "");
  return { currency: CEDI.test(currency) ? "ghs" : currency, terms: clean(price.slice(match.index! + match[0].length)) };
}

/** Whether two prices are in the same currency and on the same terms, so one can be subtracted from the other. */
export function sameUnit(a: string, b: string): boolean {
  const x = priceUnit(a);
  const y = priceUnit(b);
  return !!x && !!y && x.currency === y.currency && x.terms === y.terms;
}

export interface PackageDiscount {
  /** The price before the discount, as written ("GH₵8,000"). */
  original: string;
  /** The amount saved, in the price's currency ("GH₵2,500"). */
  amount: string;
  /** Whole percent saved (2,500 of 8,000 → 31). */
  percent: number;
  /** "PIWC Tema development discount", if given. */
  label?: string;
}

/**
 * The package's discount, or null when there isn't a valid one: no original
 * price, not a single amount, a different currency or terms (e.g. per month
 * vs per year, which can't be subtracted), or not higher than the price.
 */
export function packageDiscount(pkg: PricedPackage): PackageDiscount | null {
  if (!pkg.originalPrice?.trim()) return null;
  const price = parseAmount(pkg.totalPrice);
  const original = parseAmount(pkg.originalPrice);
  if (price === null || original === null || original <= price) return null;
  if (!sameUnit(pkg.totalPrice, pkg.originalPrice)) return null;
  const currency = pkg.totalPrice.slice(0, pkg.totalPrice.search(/\d/)).trim();
  const saved = original - price;
  return {
    original: pkg.originalPrice.trim(),
    amount: `${currency}${saved.toLocaleString("en-GB")}`,
    percent: Math.round((saved / original) * 100),
    label: pkg.discountLabel?.trim() || undefined,
  };
}

/** The price for summaries and records: "GH₵5,500 (discounted from GH₵8,000)", or just the price. */
export function priceWithDiscount(pkg: PricedPackage): string {
  const discount = packageDiscount(pkg);
  return discount ? `${pkg.totalPrice} (discounted from ${discount.original})` : pkg.totalPrice;
}
