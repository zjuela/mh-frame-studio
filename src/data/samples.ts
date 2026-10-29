// Portfolio samples shown on the home and "Our Work" pages.
// Pairs are built by `node scripts/make-demo-pairs.mjs`. Swap them for real,
// consented client work as it comes in.

import smileBefore from '~/assets/images/pairs/smile-before.jpg';
import smileAfter from '~/assets/images/pairs/smile-after.jpg';
import clinicBefore from '~/assets/images/pairs/clinic-before.jpg';
import clinicAfter from '~/assets/images/pairs/clinic-after.jpg';
import clinic2Before from '~/assets/images/pairs/clinic-2-before.jpg';
import clinic2After from '~/assets/images/pairs/clinic-2-after.jpg';
import headshotBefore from '~/assets/images/pairs/headshot-before.jpg';
import headshotAfter from '~/assets/images/pairs/headshot-after.jpg';
import consultBefore from '~/assets/images/pairs/consult-before.jpg';
import consultAfter from '~/assets/images/pairs/consult-after.jpg';

import dentistMask from '~/assets/images/demo/dentist-mask.jpg';
import consult from '~/assets/images/demo/consult.jpg';
import treatment from '~/assets/images/demo/treatment.jpg';
import headshot2 from '~/assets/images/demo/headshot-2.jpg';

import type { BeforeAfterItem } from '~/components/widgets/BeforeAfterGallery.astro';
import type { Reel } from '~/components/widgets/Reels.astro';

export const pairs: Record<string, BeforeAfterItem> = {
  smile: {
    before: smileBefore,
    after: smileAfter,
    alt: 'Smile close-up with clear aligner',
    title: 'Smile photo correction',
    description: 'Warm indoor light and a tilted phone shot, corrected to true colour and a level, centred frame.',
    fixes: ['White balance', 'Exposure', 'Straighten & crop'],
  },
  clinic: {
    before: clinicBefore,
    after: clinicAfter,
    alt: 'Dental treatment room',
    title: 'Office & interior photos',
    description: 'A dark, blue-tinted interior shot made bright and welcoming for the website and Google profile.',
    fixes: ['Brightness', 'Colour cast', 'Verticals'],
  },
  headshot: {
    before: headshotBefore,
    after: headshotAfter,
    alt: 'Team headshot',
    title: 'Team headshot retouch',
    description: 'Green fluorescent cast and flat contrast fixed, with a clean background for the About page.',
    fixes: ['Skin-true colour', 'Contrast', 'Background'],
  },
  consult: {
    before: consultBefore,
    after: consultAfter,
    alt: 'Dentist explaining a scan to a patient',
    title: 'Social media photo',
    description: 'Magenta cast and underexposure removed so the clinic looks clean and modern in the feed.',
    fixes: ['Colour cast', 'Exposure', 'Social crop'],
  },
  clinic2: {
    before: clinic2Before,
    after: clinic2After,
    alt: 'Dental chair in a treatment room',
    title: 'Treatment room photo',
    description: 'Yellow tungsten light and a crooked frame corrected to neutral, daylight-true colour.',
    fixes: ['White balance', 'Straighten', 'Clarity'],
  },
};

export const videos: Record<'reel' | 'testimonial' | 'ad' | 'short', Reel> = {
  reel: {
    poster: dentistMask,
    alt: 'Dentist holding dental instruments',
    hook: '3 signs you grind your teeth at night',
    caption: 'Educational Reel from phone clips · hook, captions, branded outro',
    label: 'Reel',
    duration: '0:32',
  },
  testimonial: {
    poster: treatment,
    alt: 'Patient during a dental treatment',
    hook: '“I was so nervous — this changed everything”',
    caption: 'Patient testimonial · audio cleanup, captions, B-roll',
    label: 'Testimonial',
    duration: '0:58',
  },
  ad: {
    poster: headshot2,
    alt: 'Dentist talking to camera',
    hook: 'Hiding your smile in photos? Watch this.',
    caption: 'Meta ad · talking-head edit, delivered with 3 hook variations',
    label: 'Ad · 3 hooks',
    duration: '0:25',
  },
  short: {
    poster: consult,
    alt: 'Dentist showing a patient their scan',
    hook: 'What happens at your first visit?',
    caption: 'Clinic walkthrough Short · cuts, music, on-screen text',
    label: 'Short',
    duration: '0:45',
  },
};

export const reels: Reel[] = [videos.reel, videos.testimonial, videos.ad, videos.short];
