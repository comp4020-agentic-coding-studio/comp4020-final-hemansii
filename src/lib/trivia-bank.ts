export type TriviaQuestion = { q: string; choices: string[]; answer: number };

// General 2000s internet trivia, not the buried site answers, so answering it
// can never spoil what's currently buried. One is picked per Canberra day by
// trivia.ts (deterministic on the date, so everyone sees the same question).
export const TRIVIA_BANK: TriviaQuestion[] = [
  { q: "What did \"LOL\" stand for in 2000s internet slang?", choices: ["Lots of Love", "Laugh Out Loud", "Live on Line", "Love Our Life"], answer: 1 },
  { q: "Which file format was the default for sharing MP3s in the early 2000s?", choices: [".wav", ".mp3", ".ogg", ".flac"], answer: 1 },
  { q: "What plugin did most 2000s games and animated sites rely on?", choices: ["Adobe Flash", "Java Applet", "Silverlight", "QuickTime VR"], answer: 0 },
  { q: "A dial-up modem connecting made a distinctive what?", choices: ["Click", "Beep", "Screech", "Hum"], answer: 2 },
  { q: "What did \"brb\" mean in a 2000s chat room?", choices: ["Be right back", "Bring real books", "Buy right before", "Big red button"], answer: 0 },
  { q: "Which search engine's homepage famously stayed almost blank?", choices: ["Yahoo!", "Google", "Ask Jeeves", "AltaVista"], answer: 1 },
  { q: "What was a \"webring\"?", choices: ["A circular banner ad", "A chain of linked fan sites", "A type of pop-up", "A chatroom moderator badge"], answer: 1 },
  { q: "What did you need to avoid tying up if you were online via dial-up?", choices: ["The TV", "The phone line", "The printer", "The modem light"], answer: 1 },
  { q: "Which of these was a popular 2000s instant messenger?", choices: ["MSN Messenger", "Slack", "Discord", "WhatsApp"], answer: 0 },
  { q: "What was a common warning on a GeoCities-era page?", choices: ["\"Best viewed in 800x600\"", "\"Enable cookies to continue\"", "\"This site uses HTTPS\"", "\"Dark mode available\""], answer: 0 },
];
