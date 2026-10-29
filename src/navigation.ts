import { getPermalink } from './utils/permalinks';
import { BUSINESS } from './business';

export const headerData = {
  links: [
    { text: 'Services', href: getPermalink('/services') },
    { text: 'Galleries', href: getPermalink('/work') },
    { text: 'For Agencies', href: getPermalink('/agencies') },
    { text: 'Pricing', href: getPermalink('/pricing') },
    { text: 'Free Guide', href: getPermalink('/guide') },
    { text: 'Contact', href: getPermalink('/contact') },
  ],
  actions: [{ text: 'Free Trial', href: `${getPermalink('/contact')}#trial`, variant: 'primary' as const }],
};

export const footerData = {
  links: [
    {
      title: 'For practices',
      links: [
        { text: 'Compliant before/afters', href: `${getPermalink('/services')}#before-after` },
        { text: 'Reels from phone footage', href: `${getPermalink('/services')}#reels` },
        { text: 'Patient testimonials', href: `${getPermalink('/services')}#testimonials` },
        { text: 'Google profile photo pack', href: `${getPermalink('/services')}#add-ons` },
      ],
    },
    {
      title: 'For agencies',
      links: [
        { text: 'White-label editing', href: getPermalink('/agencies') },
        { text: 'Meta ad creatives', href: `${getPermalink('/agencies')}#ad-creatives` },
        { text: 'Free test project', href: `${getPermalink('/contact')}#trial` },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'Galleries', href: getPermalink('/work') },
        { text: 'Pricing', href: getPermalink('/pricing') },
        { text: 'Free filming guide', href: getPermalink('/guide') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [{ ariaLabel: 'Email', icon: 'tabler:mail', href: `mailto:${BUSINESS.email}` }],
  footNote: `© ${new Date().getFullYear()} M&amp;H Frame Studio · Sample images are licensed stock photos edited for demonstration.`,
};
