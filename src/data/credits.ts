// The credit chart shared by the Pricing and Agencies pages. Every service
// costs a set number of credits; without a plan, credits cost PAYG_RATE each.
// Plan cards, savings and price tables are worked out from these numbers.

// Every cost is an even number, so a same-day rush (+50%) is always a whole
// number of credits.
export const PAYG_RATE = 2;

export const cost = {
  set: 6,
  reel: 30,
  transformation: 36,
  testimonial: 90,
  post: 10,
  carousel: 20,
  story: 10,
  ad: 40,
  googlePack: 30,
  clinical: 2,
  headshot: 6,
  intro: 120,
};

export type Service = keyof typeof cost;

/** Credits for a month of work given as [count, service] pairs. */
export const creditsFor = (month: Array<[number, Service, ...unknown[]]>) =>
  month.reduce((sum, [n, service]) => sum + n * cost[service], 0);

/** Credits for an item with a same-day rush (+50%). */
export const rushCredits = (service: Service) => cost[service] * 1.5;

/** Percentage saved against pay-as-you-go, rounded. */
export const savingPercent = (price: number, credits: number) => Math.round((1 - price / (credits * PAYG_RATE)) * 100);

/** Agency plan: credits per clinic, the base per-clinic price, and volume discounts. */
export const agency = {
  creditsPerClinic: 240,
  pricePerClinic: 349,
  tiers: [
    { clinics: '1–4 clinics', discount: 0 },
    { clinics: '5–9 clinics', discount: 0.1 },
    { clinics: '10+ clinics', discount: 0.15 },
  ],
};
