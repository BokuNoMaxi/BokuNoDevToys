import { writable, derived } from 'svelte/store';
import en from './translations/en';
import de from './translations/de';

export type Lang = 'en' | 'de';
const translations: Record<Lang, typeof en> = { en, de };

function detectLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('lang') as Lang;
    if (stored === 'en' || stored === 'de') return stored;
  }
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('de')) return 'de';
  return 'en';
}

const _lang = writable<Lang>('en'); // SSR default

export const lang = {
  subscribe: _lang.subscribe,
  set: (l: Lang) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('lang', l);
    _lang.set(l);
  },
  init: () => _lang.set(detectLang()),
};

export const t = derived(_lang, ($lang) => {
  const msgs = translations[$lang] ?? en;
  return <K extends keyof typeof en>(section: K): typeof en[K] => msgs[section];
});
