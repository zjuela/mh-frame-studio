// Trust signals for the home page.
//
// `figures` are promises the service makes today, so they're true from day
// one. Swap in measured results (photos edited, average turnaround, client
// rating) once you have them.
//
// `testimonials` stay empty until a client gives written permission to be
// quoted; the testimonials slide only appears when there's at least one.
// Never invent or paraphrase a quote.

import type { SocialProofItem, Testimonial } from '~/types';

export const figures: SocialProofItem[] = [
  { value: '24–48h', label: 'Photo turnaround', icon: 'tabler:clock-hour-4' },
  { value: '3 free', label: 'Edits before you pay', icon: 'tabler:gift' },
  { value: '2', label: 'Revision rounds included', icon: 'tabler:refresh' },
  { value: '0', label: 'Clinical results altered', icon: 'tabler:shield-check' },
];

export const testimonials: Testimonial[] = [
  // {
  //   testimonial: 'We post twice a week now and never touch an editing app.',
  //   name: 'Dr. Jane Smith',
  //   job: 'Smile Dental, Austin TX',
  // },
];
