import { getPermalink } from './utils/permalinks';
import { BUSINESS } from './business';

export const headerData = {
  links: [
    { text: 'Services', href: getPermalink('/services') },
    { text: 'Our Work', href: getPermalink('/work') },
    { text: 'Pricing', href: getPermalink('/pricing') },
    { text: 'For Agencies', href: getPermalink('/agencies') },
    { text: 'Contact', href: getPermalink('/contact') },
  ],
  actions: [{ text: 'Free Trial', href: getPermalink('/contact#trial'), variant: 'primary' as const }],
};

export const footerData = {
  links: [
    {
      title: 'Photo',
      links: [
        { text: 'Before/after editing', href: getPermalink('/services#photo') },
        { text: 'Clinical photo cleanup', href: getPermalink('/services#photo') },
        { text: 'Headshots & office photos', href: getPermalink('/services#photo') },
      ],
    },
    {
      title: 'Video',
      links: [
        { text: 'Reels & Shorts', href: getPermalink('/services#video') },
        { text: 'Testimonial videos', href: getPermalink('/services#video') },
        { text: 'Smile reveal videos', href: getPermalink('/services#video') },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'Our work', href: getPermalink('/work') },
        { text: 'Pricing', href: getPermalink('/pricing') },
        { text: 'For agencies', href: getPermalink('/agencies') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [{ ariaLabel: 'Email', icon: 'tabler:mail', href: `mailto:${BUSINESS.email}` }],
  footNote: `© ${new Date().getFullYear()} BrightFrame Studio · Sample images are licensed stock photos edited for demonstration.`,
};
