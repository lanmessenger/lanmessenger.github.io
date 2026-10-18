/* Single source of truth for the Hero chat mockup: dialogue, authors,
   and how many opening steps SSR renders (the demo script continues
   the same flow from there). Imported by Mockup.astro and
   AppChatWindow.astro — no copies of these strings anywhere else. */

export interface DialogAuthor {
  name: string;
  avatar: string;
}

export interface DialogLine {
  from: "alice" | "bob";
  text: string;
}

import { SITE } from "./site";

const U = "images/lmc-ui";

export const AUTHORS: Record<"alice" | "bob", DialogAuthor> = {
  alice: { name: "Alice", avatar: `${U}/avatar-cat.png` },
  bob: { name: "Bob", avatar: `${U}/avatar-10.png` },
};
export type Authors = typeof AUTHORS;

export const DIALOG: DialogLine[] = [
  { from: "alice", text: `Ready for v${SITE.version}?` },
  { from: "bob", text: "One last test. Disconnect the internet." },
  { from: "alice", text: "Done. Still chatting." },
  { from: "alice", text: "File transfer works too." },
  { from: "bob", text: "Perfect. Ship it!" },
  { from: "alice", text: "Already did." },
  { from: "alice", text: "Half the office hasn't noticed" },
  { from: "alice", text: "the internet is down yet \u{1F602}" },
  { from: "bob", text: "No cloud. No drama. Just works." },
];

export const START_AT = 1;

export const DIALOG_TIME = "(5:20 PM)";
