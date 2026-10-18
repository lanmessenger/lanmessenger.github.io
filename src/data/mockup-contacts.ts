/* Single source of truth for the Hero main-window mockup: the
   contact list. Imported by Mockup.astro (as data) and
   AppMainWindow.astro (as the Contact type) — edit names, statuses
   and avatars here, not in the components. */

const U = "images/lmc-ui";

export interface Contact {
  name: string;
  statusIcon?: string;
  avatar?: string;
}

export const CONTACTS: Contact[] = [
  { name: "Bob", avatar: `${U}/avatar-10.png` },
  { name: "James Smith", avatar: `${U}/avatar-8.png` },
  { name: "Maria Garcia", avatar: `${U}/avatar-1.png` },
  { name: "Robert Johnson", avatar: `${U}/avatar-2.png` },
  { name: "Linda Brown", avatar: `${U}/avatar-6.png` },
  { name: "Michael Davis", statusIcon: `${U}/away.png`, avatar: `${U}/avatar-3.png` },
  { name: "Sarah Miller", statusIcon: `${U}/busy.png`, avatar: `${U}/avatar-7.png` },
  { name: "David Wilson", statusIcon: `${U}/offline.png`, avatar: `${U}/avatar-9.png` },
];
