import type { Site } from "./index";

// Placeholder site, to be replaced with the real buried site's content.
// Fragments are authored here (trusted HTML); each row must have COLS cells.

const banner = [
  "✦ Star",
  "light's",
  "Corner",
  "of the",
  "Web ✦",
  "est. 1999",
];
const nav = ["Home", "About Me", "My Cats", "Poems", "Links", "Guestbook"];
const sidebar = [
  "You are visitor <span class='counter'>000417</span>",
  "Best viewed in Netscape 4 at 800×600",
  "♫ now playing: midi_track3.mid",
  "[ Sign my guestbook! ]",
  "Webring: ◄ prev | next ►",
  "<b>Guestbook</b>",
  "Awards: ★ Cool Site of the Day",
];
const body = [
  ["Hi!! Welcome to my", "little corner of the", "internet. This site", "is always under", "🚧 construction 🚧"],
  ["I'm 16 and I live", "in Wagga. I like", "anime, Sailor Moon,", "and my two cats,", "Mochi &amp; Bean."],
  ["Mochi is the grey", "one. Bean is the", "orange one who", "knocks everything", "off my desk."],
  ["NEW!! 03/02/2001:", "added a poems page", "and fixed the", "broken links. Sorry", "about the popups!!"],
  ["<i>a poem,</i>", "<i>the dial-up hums</i>", "<i>like the sea</i>", "<i>i am waiting</i>", "<i>for you to load</i>"],
  [
    "<b>xXdragonXx</b>: cool site!!",
    "<b>bean_fan</b>: ur cats r so cute",
    "<b>m00nprincess</b>: link exchange?",
    "<b>anon</b>: who is mochi",
    "<b>starlight</b>: thx everyone ♥",
  ],
  ["please don't steal", "my graphics, ask", "first!! linkback to", "starlight.geocities", "if you use them"],
];
const footer = [
  "© 2001 Starlight",
  "made in Notepad",
  "no frames!",
  "email me",
  "updated 14/06/2001",
  "~ the end ~",
];

const bodyNotes = [
  "The opening greeting. Nearly every personal homepage of the era began by welcoming you and apologising for being unfinished.",
  "The author introduces themselves: age, town, interests. Homepages were introductions written to strangers.",
  "The cats. Pets were among the most common subjects of early personal sites.",
  "A changelog, written by hand. Dated 'NEW!!' notices told returning visitors what had changed.",
  "A poem about waiting for a page to load over dial-up.",
  "Guestbook entries left by visitors: the comments section before comments sections.",
  "A plea not to hotlink or steal graphics. Bandwidth was paid for by the byte.",
];

export const placeholder: Site = {
  title: "Starlight's Corner of the Web",
  cells: [
    banner.map((html) => ({
      kind: "banner",
      html,
      note: "Part of the site's title banner, likely a tiled GIF with WordArt-style lettering.",
    })),
    nav.map((html) => ({
      kind: "nav",
      html,
      note: "A navigation link. Most of the pages it pointed to are gone.",
    })),
    ...body.map((row, i) => [
      {
        kind: "side",
        html: sidebar[i],
        note: "The sidebar: counters, badges, webrings and awards, the furniture of a 2000s homepage.",
      },
      ...row.map((html) => ({ kind: i === 5 ? "guest" : "body", html, note: bodyNotes[i] })),
    ]),
    footer.map((html) => ({
      kind: "footer",
      html,
      note: "The footer. 'Last updated' dates were a point of pride, and of guilt.",
    })),
  ],
};
