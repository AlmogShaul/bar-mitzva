// Hebrew Bible verses (Psukim) data - First 4 verses of Parashat Toldot
export interface Pasuk {
  id: number;
  book: string;
  chapter: number;
  pasuk: number;
  hebrew: string;
  transliteration: string;
  translation: string;
  audioUrl?: string;
}
