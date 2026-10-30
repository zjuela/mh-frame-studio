// Portfolio samples shown on the home and "Samples" pages.
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

import veneersPost from '~/assets/images/before-after/veneers.jpg';
import whiteningPost from '~/assets/images/before-after/whitening.jpg';
import alignmentPost from '~/assets/images/before-after/alignment.jpg';

import dentistMask from '~/assets/images/demo/dentist-mask.jpg';
import consult from '~/assets/images/demo/consult.jpg';
import treatment from '~/assets/images/demo/treatment.jpg';
import adHook1 from '~/assets/images/ads/aligner-consult-hook-1.jpg';
import adHook2 from '~/assets/images/ads/aligner-consult-hook-2.jpg';
import adHook3 from '~/assets/images/ads/aligner-consult-hook-3.jpg';
import adFeed from '~/assets/images/ads/aligner-consult-feed.jpg';
import saturdayHours from '~/assets/images/social/saturday-hours.jpg';
import toothbrushTip1 from '~/assets/images/social/toothbrush-tip-1.jpg';
import toothbrushTip2 from '~/assets/images/social/toothbrush-tip-2.jpg';
import toothbrushTip3 from '~/assets/images/social/toothbrush-tip-3.jpg';
import toothbrushTip4 from '~/assets/images/social/toothbrush-tip-4.jpg';
import toothbrushTip5 from '~/assets/images/social/toothbrush-tip-5.jpg';
import toothbrushTip6 from '~/assets/images/social/toothbrush-tip-6.jpg';
import transformationPoster from '~/assets/images/reels/transformation-reel-poster.jpg';
import mythFactPoster from '~/assets/images/reels/myth-fact-poster.jpg';
import testimonialGuidePoster from '~/assets/images/reels/testimonial-guide-poster.jpg';

import type { BeforeAfterItem, LabelledItem } from '~/components/widgets/BeforeAfterGallery.astro';
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

// Labelled before/afters built by `node scripts/make-before-after.mjs`.
export const posts: Record<'veneers' | 'whitening' | 'alignment', LabelledItem> = {
  veneers: {
    image: veneersPost,
    alt: 'Porcelain veneers before and after, stacked in a 4:5 post',
    title: 'Veneers · Instagram post (4:5)',
    description: 'Before above after with matched crops, procedure name and a "results may vary" line.',
    fixes: ['Matched crop', '4:5 feed size', 'Disclaimer'],
  },
  whitening: {
    image: whiteningPost,
    alt: 'Teeth whitening before and after, stacked in a 4:5 post',
    title: 'Whitening · Instagram post (4:5)',
    description: 'Before above after, sized for the feed, with your handle on every post.',
    fixes: ['4:5 feed size', 'Labels', 'Branding'],
  },
  alignment: {
    image: alignmentPost,
    alt: 'Teeth alignment before and after in a 9:16 Story',
    title: 'Alignment · Story (9:16)',
    description: 'Story-sized pair with text kept clear of the Instagram and Facebook controls.',
    fixes: ['9:16 Story', 'Safe zones', 'Labels'],
  },
};

// Custom social posts built by `node scripts/make-social-posts.mjs`.
export const social: Record<'hours' | 'tip', LabelledItem> = {
  hours: {
    image: saturdayHours,
    alt: 'Social post announcing Saturday opening hours: a smiling dentist, a calendar card reading Every Sat, 9am – 2pm, and a Book online button',
    title: 'Practice news · single-image post',
    description:
      'Your own photo with a bold headline, the key detail as a graphic and a clear call to book, in your brand colours. Caption and hashtags included.',
    fixes: ['4:5 feed size', 'Your photo', 'Call to action'],
  },
  tip: {
    image: toothbrushTip1,
    alt: 'Carousel slide 1: How often should you replace your toothbrush?',
    slides: [
      { image: toothbrushTip1, alt: 'Carousel slide 1: How often should you replace your toothbrush?' },
      {
        image: toothbrushTip2,
        alt: 'Carousel slide 2: Every 3–4 months, as the American Dental Association recommends',
      },
      { image: toothbrushTip3, alt: 'Carousel slide 3: Replace it sooner if the bristles fray' },
      { image: toothbrushTip4, alt: 'Carousel slide 4: Electric brush heads follow the same rule' },
      { image: toothbrushTip5, alt: 'Carousel slide 5: Let it air-dry between brushings' },
      { image: toothbrushTip6, alt: 'Carousel slide 6: Due for a check-up? Book your visit' },
    ],
    title: 'Care tip · 6-slide carousel',
    description: 'A question, the answer, three quick tips and a call to book. Each slide invites a swipe to the next.',
    fixes: ['Carousel', 'Care tip', 'Call to action'],
  },
};

export const videos: Record<
  | 'reel'
  | 'transformation'
  | 'testimonial'
  | 'testimonialGuide'
  | 'ad'
  | 'adHook2'
  | 'adHook3'
  | 'adFeed'
  | 'short'
  | 'mythFact',
  Reel
> = {
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
  // Built by `node scripts/make-testimonial-guide-reel.mjs scripts/reels/testimonial-guide.json`.
  testimonialGuide: {
    poster: testimonialGuidePoster,
    alt: 'Patient in a black sweater smiling in an armchair in a dental clinic',
    hook: 'How to film a patient testimonial',
    caption: 'Filming guide · camera angle, framing and the question to ask for each clip',
    label: 'Guide',
    duration: '1:00',
    video: 'videos/testimonial-guide.mp4',
  },
  // Ad mock-ups built by `node scripts/make-ad-mockups.mjs scripts/ads/aligner-consult.json`.
  ad: {
    poster: adHook1,
    alt: 'Smiling dentist on camera with the hook "Straighter teeth without metal braces?" and a caption',
    hook: 'Straighter teeth without metal braces?',
    caption: 'Meta ad · hook 1: talking head with title and captions',
    label: 'Ad · hook 1',
    duration: '0:25',
    textInPoster: true,
  },
  adHook2: {
    poster: adHook2,
    alt: 'Patient touching her cheek, with a viewer comment "Do clear aligners hurt?" and the dentist\'s answer as a caption',
    hook: 'Do clear aligners hurt?',
    caption: 'Same ad · hook 2: replying to a viewer’s comment over a patient shot',
    label: 'Ad · hook 2',
    duration: '0:25',
    textInPoster: true,
  },
  adHook3: {
    poster: adHook3,
    alt: 'Dentist showing a patient a scan, with the title "What a free aligner consult looks like"',
    hook: 'What a free aligner consult looks like',
    caption: 'Same ad · hook 3: opens on consult footage',
    label: 'Ad · hook 3',
    duration: '0:25',
    textInPoster: true,
  },
  adFeed: {
    poster: adFeed,
    alt: 'The ad as a 4:5 image in a Facebook feed post with a Book now button',
    hook: 'Free clear aligner consult',
    caption: 'Feed version · 4:5 with headline, offer and disclaimer',
    label: 'Feed · 4:5',
    textInPoster: true,
  },
  short: {
    poster: consult,
    alt: 'Dentist showing a patient their scan',
    hook: 'What happens at your first visit?',
    caption: 'Clinic walkthrough Short · cuts, music, on-screen text',
    label: 'Short',
    duration: '0:45',
  },
  // Built by `node scripts/make-transformation-reel.mjs` from the whitening pair in scripts/before-after/.
  transformation: {
    poster: transformationPoster,
    alt: 'Teeth whitening before and after, stacked',
    hook: 'Teeth whitening: wait for the after',
    caption: 'Transformation Reel · slider reveal, labels, "results may vary" line',
    label: 'Reel',
    duration: '0:15',
    video: 'videos/transformation-reel.mp4',
    textInPoster: true,
  },
  // Built by `node scripts/make-myth-fact-reel.mjs scripts/reels/myth-fact.json`.
  mythFact: {
    poster: mythFactPoster,
    alt: 'Smiling dentist in scrubs',
    hook: 'Myth or fact? 3 dental myths',
    caption: 'Educational Short · myth/fact cards, counter, branded end card',
    label: 'Short',
    duration: '0:23',
    video: 'videos/myth-fact.mp4',
  },
};
