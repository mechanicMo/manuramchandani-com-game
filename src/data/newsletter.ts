// src/data/newsletter.ts
export type NewsletterIssue = { num: string; title: string; date: string; url?: string };

export const newsletterIssues: NewsletterIssue[] = [
  { num: '002', title: 'The Full Loop', date: 'Apr 7, 2026', url: 'https://sleepingemployees.com/p/the-full-loop' },
  { num: '001', title: 'What AI agents are actually doing for real people', date: 'Mar 31, 2026', url: 'https://sleepingemployees.com/p/the-businesses-running-on-autopilot' },
];
