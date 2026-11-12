import content from './games.json';
import type { Language } from './navigation';

export interface GameCopy {
  /** Search-oriented description for the page title: «<name>: <title> · Euskalario». */
  title: string;
  tagline: string;
  summary: string;
  intro: string;
  facts: string[];
  storyTitle: string;
  story: string[];
  steps: string[][];
  skills: string[];
  lesson: string;
  tip: string;
  /** promptLang/answerLang mark Basque examples inside the Spanish copy. */
  example: { prompt: string[]; answer: string; explanation: string; promptLang?: 'eu'; answerLang?: 'eu' };
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  daily: boolean;
  related: string[];
  es: GameCopy;
  eu: GameCopy;
  source: { name: string; url: string } | null;
}

export const games = content as Game[];
export const gamePath = (game: Game, lang: Language) =>
  lang === 'es' ? `/juegos/${game.slug}/` : `/eu/jokoak/${game.slug}/`;
export const gameTranslations = (game: Game) => ({ es: gamePath(game, 'es'), eu: gamePath(game, 'eu') });
