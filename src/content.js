/* =====================================================================
   SCREENS — this is the only list you need to edit.
   Each screen has a title (shown in the browser tab and read to screen
   readers) and a list of lines:
   - ""              blank row
   - "TEXT"          normal row; it wraps by itself when it is too long
   - "[TEXT]"        letters between square brackets land on yellow flaps
   - { key, text, to }
                     a menu row: shown as "[key]  TEXT" with the key on
                     yellow flaps. Pressing the key, or clicking the row,
                     opens the screen named in `to`.
   - { key, text, href }
                     a link row: same look, but it opens `href` in a new
                     tab, so the portfolio stays open.
   Menu and link rows may set `label`, the name read to screen readers;
   otherwise it comes from `text`.
   Leading spaces count, so you can indent a row.
   A screen may override the default alignment:
   { align: "center", valign: "top", ... }
   Accents are removed and letters are uppercased automatically; characters
   missing from the board are shown as blanks.
   ===================================================================== */
export const HOME = 'home';

export const SCREENS = {
  home: {
    title: 'Welcome',
    lines: [
      '[MICHELE]',
      'SOFTWARE ENGINEER',
      '',
      { key: '1', text: 'ABOUT ME', to: 'about' },
      { key: '2', text: 'PROJECTS', to: 'projects' },
      { key: '3', text: 'CV', href: 'https://drive.google.com/file/d/14ilfrxn33lwh_pVzT6Yc_UHC40K-owhp/view?usp=drive_link' },
      { key: '4', text: 'LINKS', to: 'links' },
    ],
  },
  // About me: one chapter per screen, read in order with 1 NEXT; the last one starts over.
  about: {
    title: 'About me',
    lines: [
      'ABOUT ME',
      '[1/7  THE BEGINNING]',
      '',
      'MY DAD RAN AN INTERNET POINT WHEN PCS WERE RARE. GUESS WHERE I SPENT MY CHILDHOOD.',
      '',
      { key: '1', text: 'NEXT', to: 'about-2' },
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  'about-2': {
    title: 'About me (2/7)',
    lines: [
      'ABOUT ME',
      '[2/7  THE JOB]',
      '',
      'SINCE 2020 MY PASSION IS ALSO MY JOB. LUCKY ME: NOBODY HAS NOTICED YET.',
      '',
      { key: '1', text: 'NEXT', to: 'about-3' },
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  'about-3': {
    title: 'About me (3/7)',
    lines: [
      'ABOUT ME',
      "[3/7  WHAT'S NEXT]",
      '',
      "JAVASCRIPT IS MY HOME. NOW I'M LOOKING AT AI. LET'S SEE HOW THIS ENDS.",
      '',
      { key: '1', text: 'NEXT', to: 'about-4' },
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  'about-4': {
    title: 'About me (4/7)',
    lines: [
      'ABOUT ME',
      '[4/7  HOW I WORK]',
      '',
      "PERFECTIONIST, METHODICAL, PRECISE. I'LL MOVE A PIXEL TEN TIMES TO GET IT RIGHT.",
      '',
      { key: '1', text: 'NEXT', to: 'about-5' },
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  'about-5': {
    title: 'About me (5/7)',
    lines: [
      'ABOUT ME',
      '[5/7  SIDE PROJECTS]',
      '',
      "I BUILD THINGS JUST FOR FUN, EVEN WHEN THEY'RE NOT USEFUL AT ALL. ESPECIALLY THEN.",
      '',
      { key: '1', text: 'NEXT', to: 'about-6' },
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  'about-6': {
    title: 'About me (6/7)',
    lines: [
      'ABOUT ME',
      '[6/7  OFF THE KEYBOARD]',
      '',
      'NEW CITIES, NEW FRIENDS, GOOD FOOD, ROCKETS. CURIOUS ABOUT ALMOST EVERYTHING.',
      '',
      { key: '1', text: 'NEXT', to: 'about-7' },
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  'about-7': {
    title: 'About me (7/7)',
    lines: [
      'ABOUT ME',
      '[7/7  NEXT STOP]',
      '',
      'LUGANO IS HOME. THE DREAM? THE FREEDOM TO WORK FROM ANYWHERE, WHEN I FEEL LIKE IT.',
      '',
      { key: '1', text: 'START OVER', to: 'about' },
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  projects: {
    title: 'Projects',
    lines: [
      'PROJECTS',
      'STUFF I BUILT',
      '',
      { key: '1', text: 'SPLIT-FLAP PORTFOLIO', to: 'split-flap' },
      { key: '2', text: 'GLUTZ EACCESS', label: 'Glutz eAccess', to: 'glutz' },
      { key: '3', text: 'NOESIUM', to: 'noesium' },
      { key: '4', text: "BUCK'S ROW", label: "Buck's Row", to: 'bucks-row' },
      '',
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  links: {
    title: 'Links',
    lines: [
      'LINKS',
      'FIND ME ONLINE',
      '',
      { key: '1', text: 'LINKEDIN', label: 'LinkedIn', href: 'https://www.linkedin.com/in/michelegreco3/' },
      { key: '2', text: 'GITHUB', label: 'GitHub', href: 'https://github.com/miitchpls' },
      '',
      { key: '0', text: 'BACK TO MENU', to: 'home' },
    ],
  },
  'split-flap': {
    title: 'Split-flap portfolio',
    lines: [
      'SPLIT-FLAP PORTFOLIO',
      '[ON TIME]',
      '',
      "YOU'RE LOOKING AT IT. A PLAIN WEBSITE FELT TOO BORING.",
      '',
      { key: '1', text: 'VIEW ON GITHUB', label: 'View on GitHub', href: 'https://github.com/miitchpls/split-flap-portfolio' },
      { key: '0', text: 'BACK TO PROJECTS', to: 'projects' },
    ],
  },
  glutz: {
    title: 'Glutz eAccess',
    lines: [
      'GLUTZ EACCESS',
      '[HOME ASSISTANT]',
      '',
      "TOO LAZY TO OPEN YET ANOTHER APP. THE INTEGRATION DIDN'T EXIST, SO I BUILT IT.",
      '',
      { key: '1', text: 'VIEW ON GITHUB', label: 'View on GitHub', href: 'https://github.com/miitchpls/hass-glutz-eaccess' },
      { key: '0', text: 'BACK TO PROJECTS', to: 'projects' },
    ],
  },
  noesium: {
    title: 'Noesium',
    lines: [
      'NOESIUM',
      '[AI-POWERED WIKI]',
      '',
      'AN AI THAT FORGETS EVERYTHING FELT KIND OF DUMB. SO I GAVE IT A MEMORY.',
      '',
      { key: '1', text: 'OPEN NOESIUM', label: 'Open noesium.app', href: 'https://noesium.app/' },
      { key: '0', text: 'BACK TO PROJECTS', to: 'projects' },
    ],
  },
  'bucks-row': {
    title: "Buck's Row",
    lines: [
      "BUCK'S ROW",
      '[DEDUCTION GAME]',
      '',
      'ONE HIDDEN KILLER AGAINST FIVE DETECTIVES.',
      '',
      { key: '1', text: 'PLAY NOW', label: "Play Buck's Row", href: 'https://bucksrow.miitchpls.com/' },
      { key: '0', text: 'BACK TO PROJECTS', to: 'projects' },
    ],
  },
};

/* =====================================================================
   SETTINGS
   ===================================================================== */
export const SETTINGS = {
  flipSpeed: 55,      // ms per half flap as a flap lands on its letter: higher = slower
  spinSpeed: 18,      // ms per half flap while it is still far from its letter
  stagger: 30,        // ms between neighbouring columns (wave effect)
  align: 'left',      // default horizontal alignment: "left" or "center"
  valign: 'center',   // default vertical alignment: "center" or "top"
  inset: 1,           // blank columns kept on each side of the text
  columns: { wide: 24, medium: 18, narrow: 14 },  // large / medium / phone screens
};
