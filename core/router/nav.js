// Navigation as a page sees it: const nav = useNav()
//   nav.push(name, params)   open a page over this one (from a sheet: the sheet goes first, then the page comes)
//   nav.pop()  nav.popToRoot()  nav.scrollToTop()  nav.depth
//   nav.openSheet(name, params)  nav.closeSheet()
// Provided by StackView for the pages of a tab, and by Router for what is in a sheet. (All of it changes the route:
// ./store.js. A page can as well be handed `nav` through its slot.)
import { inject } from 'vue';

export const NAV = Symbol('nav');
export const useNav = () => inject(NAV, null);
