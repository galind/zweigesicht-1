// Shared with server-rendered structured data; the visible copy stays in About.
export const aboutDescription =
  'This is an independent interactive exploration of Marco Lang’s Zweigesicht-1 and its Calibre ML-01. It uses Marco Lang’s publicly released CAD to examine the movement’s construction and individual components. Surface finishes, lighting and rendering are authored interpretations informed by reference material. The project is not affiliated with Marco Lang.';

export const makerUrl = 'https://www.marcolangwatches.com/en/main-page/';
export const cadUrl =
  'https://www.marcolangwatches.com/en/cad-2/zweigesicht-1/';
export const watchSourceUrl = 'https://www.marcolangwatches.com/en/watches/';
// Reused from the maker-attributed facts in experience/copy.ts. No sketch values.
export const watchFeatures = [
  {
    title: 'Two faces, one movement',
    text: 'One side displays hours, minutes and central seconds. The other offers hours and minutes with a view into the movement.',
  },
  {
    title: 'Energy in tandem',
    text: 'Two barrels connected in series give the ML–01 a stated power reserve of 70 hours.',
  },
  {
    title: 'A record of impact',
    text: 'An optional, resettable shock indicator records impacts in four directions along the X and Y axes.',
  },
];
export const movementSpecs = [
  ['Displays', 'Hours, minutes, central seconds · reverse hours & minutes'],
  ['Barrels', 'Two, in series'],
  ['Power reserve', '70 hours'],
  ['Balance frequency', '3 Hz'],
  ['Hairspring', 'Breguet'],
  ['Regulation', 'Eccentric adjustment'],
  ['Setting', 'Seconds stop'],
];
