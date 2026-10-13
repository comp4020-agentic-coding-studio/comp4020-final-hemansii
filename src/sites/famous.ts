import type { Cell, Site } from "./index";

// The buried sites: famous 2000s websites a player can actually name.
// Fragments are authored here (trusted HTML) and never spell out the site's
// name; the clues (Puffles, Tom, Neopia) are meant to give it away. Every
// site has the same shape: a banner row, a nav row, seven rows of a sidebar
// cell plus five body cells (row 6 is visitor comments), and a footer row.

type Spec = {
  title: string;
  year: string;
  // Lowercase letters and digits only; a theory naming any of them solves it.
  answers: string[];
  banner: string[];
  nav: string[];
  side: string[];
  body: string[][];
  footer: string[];
};

const NOTES: Record<string, string> = {
  banner: "Part of the banner across the top of the page.",
  nav: "A navigation link. Where it led is a clue to what the site was.",
  side: "From the sidebar, the strip of counters and status down the side of the page.",
  body: "Part of the page's main content. What it describes is a clue to what the site was for.",
  guest: "A comment left by a visitor. Who used the site says a lot about what it was.",
  footer: "From the page footer, the small print along the bottom.",
};

const cells = (kind: string, row: string[]): Cell[] => row.map((html) => ({ kind, html, note: NOTES[kind] }));

const site = ({ title, year, answers, banner, nav, side, body, footer }: Spec): Site => ({
  title,
  year,
  answers,
  cells: [
    cells("banner", banner),
    cells("nav", nav),
    ...body.map((row, i) => [...cells("side", [side[i]]), ...cells(i === 5 ? "guest" : "body", row)]),
    cells("footer", footer),
  ],
});

const clubPenguin = site({
  title: "Club Penguin",
  year: "2005",
  answers: ["clubpenguin"],
  banner: ["❄️ Waddle", "on in! ❄️", "Snow, igloos", "and you", "Est. 2005", "🐧🐧🐧"],
  nav: ["Play Now", "Membership", "Parents", "Puffles", "Igloos", "Party Calendar"],
  side: [
    "Server: <b>Blizzard</b> (full)",
    "Users online: <span class='counter'>12481</span>",
    "♫ now playing: Pizza Parlor theme",
    "Safe Chat mode ON",
    "Coins: <span class='counter'>004250</span>",
    "<b>Comments</b>",
    "Code: <b>PUFFLEPARTY</b>",
  ],
  body: [
    ["Adopt a pet", "puffle! Pink,", "blue, red or", "black. Feed it", "or it runs away"],
    ["Earn coins at", "Cart Surfer and", "Puffle Round-Up,", "then buy hats", "at the Gift Shop"],
    ["Decorate your", "igloo with a", "jukebox and", "a fish tank", "(members only)"],
    ["NEW!! Rockhopper's", "ship, the Migrator,", "docks at the", "Beach this", "Friday!!"],
    ["The secret", "agency (PSA)", "is recruiting.", "Find the", "hidden phone."],
    [
      "<b>penguin9876</b>: wanna b bffs",
      "<b>CoolGuy44</b>: meet me at the dojo",
      "<b>PuffleLover</b>: card jitsu?",
      "<b>Pinky7</b>: lol ur so cute",
      "<b>Aunt Arctic</b>: read the Times!",
    ],
    ["Ask a parent", "before chatting.", "Never share your", "password, not", "even with friends"],
  ],
  footer: ["© Disney", "Safe for kids", "Rules", "Privacy", "Blizzard server", "~ waddle on ~"],
});

const mySpace = site({
  title: "MySpace",
  year: "2003",
  answers: ["myspace"],
  banner: ["a place", "for friends", "★ Top 8 ★", "Profile views: 1,337", "Est. 2003", "♫ ♫ ♫"],
  nav: ["Home", "Browse", "Search", "Invite", "Music", "Blog"],
  side: [
    "<b>Mood:</b> rawr xD",
    "<b>Online Now!</b> 🟢",
    "Profile song: ♫ Welcome to the Black Parade",
    "Glitter text generator",
    "Friends: <span class='counter'>000312</span>",
    "<b>Comments</b>",
    "Edit Profile (HTML ok!)",
  ],
  body: [
    ["Tom is in", "your extended", "network. He", "is your first", "friend."],
    ["Who's in your", "Top 8? Choose", "carefully, your", "friends will", "notice."],
    ["Paste this code", "for a black", "background and", "a sparkly pink", "cursor 💖"],
    ["Take the survey!!", "Fav colour: black", "Fav band: MCR", "Crush: maybe?", "Last cried: today"],
    ["Bulletin: plz", "repost if you", "love ur mum", "or bad luck", "for 7 years!!"],
    [
      "<b>~*Jess*~</b>: thx 4 the add!!",
      "<b>xBrandonx</b>: pc4pc?",
      "<b>Tom</b>: Welcome to the site!",
      "<b>emo_kid</b>: luv ur pics",
      "<b>Sk8rBoi</b>: y am i not top 8",
    ],
    ["Blog: current", "mood: crushed.", "Current music:", "Fall Out Boy.", "Read more..."],
  ],
  footer: ["© 2006 Fox Interactive", "About", "FAQ", "Terms", "Report Abuse", "Safety Tips"],
});

const neopets = site({
  title: "Neopets",
  year: "1999",
  answers: ["neopets"],
  banner: ["Welcome", "to Neopia!", "Adopt a", "virtual pet", "Est. 1999", "🐾"],
  nav: ["Pets", "Games", "Shops", "Explore", "Neoboards", "Customise"],
  side: [
    "NP: <span class='counter'>12340</span>",
    "Active pet: <b>Kacheek</b>",
    "♫ Space Faerie theme",
    "Battledome",
    "Trophy cabinet: 3",
    "<b>Neomail</b>",
    "Daily: Fruit Machine",
  ],
  body: [
    ["Your Kougra is", "<b>starving</b>.", "Feed it an", "omelette from", "the Giant Omelette"],
    ["Spin the Wheel", "of Excitement", "for Neopoints", "every two", "hours."],
    ["Visit the Money", "Tree. Someone left", "a half-eaten", "carrot and an", "old boot."],
    ["Something has", "happened! A Pant", "Devil stole", "your Snowbunny", "Plushie."],
    ["Paint your pet", "with a Faerie", "Paint Brush. It", "costs 300,000", "NP. Sigh."],
    [
      "<b>xoKacheek</b>: buying codestones",
      "<b>GuildLord</b>: join my guild",
      "<b>Lupe4ever</b>: trade?",
      "<b>freakyfaerie</b>: avatars thread",
      "<b>Dr_Sloth</b>: bow before me",
    ],
    ["Play Meerca", "Chase and", "Kass Basher to", "earn NP for", "the Lab Ray"],
  ],
  footer: ["Terms", "Privacy", "Safety", "Parents", "Advertise", "~ Neopia ~"],
});

const bebo = site({
  title: "Bebo",
  year: "2005",
  answers: ["bebo"],
  banner: ["Blog early,", "blog often", "★ skins ★", "Est. 2005", "♥ my profile", "xx"],
  nav: ["Home", "Profile", "Friends", "Bands", "Quizzes", "Whiteboard"],
  side: [
    "Profile views: <span class='counter'>004521</span>",
    "My Other Half: <b>Jake</b> ♥",
    "Love: 87 ♥",
    "Skin: Pink Leopard 🐆",
    "Lifestream: on",
    "<b>Comments</b>",
    "Mood: hyper!!",
  ],
  body: [
    ["Draw on my", "Whiteboard!!", "No rude", "pictures", "pls :P"],
    ["Give me some", "<b>Love</b> and I", "will give you", "some back", "♥♥♥"],
    ["Take my quiz:", "how well do", "u know me?", "Q1: my fav", "colour?"],
    ["My Other Half", "is the best", "girl in the", "world!! 6 months", "today 💕"],
    ["Watch KateModern", "on my profile.", "New episode", "every Monday", "night!"],
    [
      "<b>Tash xo</b>: luv ya hun!!",
      "<b>Daz</b>: wat time 2moro",
      "<b>Kirsty_babe</b>: rate my pic",
      "<b>Ryan M</b>: c u at the bus stop",
      "<b>~Em~</b>: luv ur skin",
    ],
    ["Fave band:", "the Kooks.", "Fave quote:", "live laugh", "love xx"],
  ],
  footer: ["© 2007", "About us", "Safety", "Privacy", "Help", "Report"],
});

const miniclip = site({
  title: "Miniclip",
  year: "2001",
  answers: ["miniclip"],
  banner: ["FREE", "online", "games!!", "No download", "Est. 2001", "🎮"],
  nav: ["Action", "Sports", "Puzzle", "Multiplayer", "Top 25", "New Games"],
  side: [
    "Players online: <span class='counter'>48210</span>",
    "Requires Flash 8",
    "♫ sound: ON",
    "Top game: <b>Gravity Guy</b>",
    "Get the toolbar!",
    "<b>Ratings</b>",
    "Tell a friend",
  ],
  body: [
    ["Dig for ore", "on Mars in", "Motherload.", "Don't run out", "of fuel!"],
    ["Pop all the", "balloons with", "one dart in", "Bloons. 50", "levels!"],
    ["8 Ball Pool:", "play against", "the world.", "Earn coins", "for cues."],
    ["Monkey Kick Off:", "how far can", "you kick", "the monkey?", "🐒"],
    ["Loading.....", "Click here if", "the game", "doesn't load.", "(Shockwave)"],
    [
      "<b>gamer_dude12</b>: 5 stars!!",
      "<b>xX_Pro_Xx</b>: lvl 50 done",
      "<b>Steph</b>: played this at school",
      "<b>anon</b>: blocked at my school :(",
      "<b>Mr_Kev</b>: highscore 9001",
    ],
    ["Rate this game:", "★★★★☆", "Played", "3,401,227", "times"],
  ],
  footer: ["© 2007", "Privacy", "Terms", "Advertise", "Webmasters", "Add games to your site"],
});

// Buried in this order. The ids are neutral on purpose: the page carries
// the open one, and a descriptive id would give the answer away.
export const FAMOUS: Record<string, Site> = {
  "site-1": clubPenguin,
  "site-2": mySpace,
  "site-3": neopets,
  "site-4": bebo,
  "site-5": miniclip,
};
