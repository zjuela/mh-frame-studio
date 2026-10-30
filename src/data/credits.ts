// The credit chart shared by the Pricing and Agencies pages. Every service
// costs a set number of credits; without a plan, credits cost PAYG_RATE each.
// Plan cards, savings and price tables are worked out from these numbers.

export const PAYG_RATE = 4;

export const cost = {
  set: 3,
  reel: 15,
  transformation: 18,
  testimonial: 45,
  post: 5,
  carousel: 10,
  story: 5,
  ad: 20,
  googlePack: 15,
  clinical: 1,
  headshot: 3,
  intro: 60,
};

export type Service = keyof typeof cost;

/** Credits for a month of work given as [count, service] pairs. */
export const creditsFor = (month: Array<[number, Service, ...unknown[]]>) =>
  month.reduce((sum, [n, service]) => sum + n * cost[service], 0);

/** Percentage saved against pay-as-you-go, rounded. */
export const savingPercent = (price: number, credits: number) => Math.round((1 - price / (credits * PAYG_RATE)) * 100);

/** Agency plan: credits per clinic, the base per-clinic price, and volume discounts. */
export const agency = {
  creditsPerClinic: 120,
  pricePerClinic: 349,
  tiers: [
    { clinics: '1–4 clinics', discount: 0 },
    { clinics: '5–9 clinics', discount: 0.1 },
    { clinics: '10+ clinics', discount: 0.15 },
  ],
};
