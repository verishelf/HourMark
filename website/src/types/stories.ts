export type StoryBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "pull_quote"; text: string; attribution?: string }
  | { type: "image"; url: string; caption?: string };
