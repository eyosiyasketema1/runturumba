/**
 * Assets exported from Figma — Turumba / Channel (node 1793:18579).
 *
 * The `src` URLs below point at Figma's MCP asset host and EXPIRE ~7 DAYS after
 * export. Run `scripts/download-figma-assets.sh` to pull the exact bytes into
 * `public/figma/`, then set ASSET_BASE to '/figma' to serve them locally.
 *
 * Each icon records the geometry Figma laid it out with:
 *   box   — the icon frame size in px (the outer, clipped box)
 *   inset — where the glyph sits inside that frame
 *   bleed — the negative inset that accounts for stroke overflow
 * Keeping all three preserves the designed padding. Scaling the raw SVG to fill
 * the frame instead would silently enlarge every glyph.
 */

/** Flip to true once you've run the download script. */
export const USE_LOCAL_ASSETS = false;
const LOCAL_DIR = '/figma';

const remote = (id: string) =>
  USE_LOCAL_ASSETS ? `${LOCAL_DIR}/${id}` : `https://www.figma.com/api/mcp/asset/${id}`;

export interface FigmaIconSpec {
  src: string;
  box: number;
  inset: string;
  bleed: string;
}

const icon = (id: string, inset: string, bleed: string, box = 16): FigmaIconSpec => ({
  src: remote(id),
  box,
  inset,
  bleed,
});

/* ---------------------------------------------------------------- sidebar */

export const sidebarIcons = {
  workspace: icon('47cc2b3b-6762-4bd0-86db-784cf7da41ff.svg', '8.33% 12.5%', '-5.63% -6.25% -5.62% -6.25%'),
  chevronUpDown: icon('cf586308-e863-4079-b393-6c517076b283.svg', '16.67% 29.17%', '-7.03% -11.25%'),
  dashboard: icon('faab8122-04c7-40fe-891d-2f98b89d23c0.svg', '12.5%', '-6.25%'),
  contacts: icon('951a03c7-63ca-44d1-9ea9-ba1291520715.svg', '8.33% 12.5%', '-5.63% -6.25% -5.62% -6.25%'),
  message: icon('bddbbf02-bd1a-4f34-a40e-5efb77d930e2.svg', '12.5%', '-6.25%'),
  conversations: icon('42067c38-f771-40b0-8ae0-92e032d317c6.svg', '8.33%', '-5.63%'),
  seekers: icon('365c7153-f755-4c77-a649-dcd911413040.svg', '12.5% 8.33%', '-6.25% -5.63%'),
  usersDiscipleship: icon('a91cbee7-f1bb-441a-b36b-fc5936e394bd.svg', '8.33% 16.67% 8.32% 16.67%', '-5.62% -7.03%'),
  channels: icon('7fa44ff2-7f47-42f5-89bb-20b86ae3d5cd.svg', '20.42% 8.23%', '-7.92% -5.61%'),
  automations: icon('c4b5b1f1-2c08-4599-9a58-4c78c1dbbff7.svg', '8.32% 12.49%', '-5.62% -6.25%'),
  skillSets: icon('7f973e74-cc64-4c4d-bc40-5e601d691120.svg', '8.3% 8.33% 8.35% 8.33%', '-5.62%'),
  usersSystem: icon('d8002c78-180d-40f4-a77c-2fff5ac08fe0.svg', '12.5% 20.83%', '-6.25% -8.04%'),
  setting: icon('b12be619-b2b3-4d0c-8a9a-a843f53bd4a0.svg', '8.33% 12.43%', '-5.63% -6.24% -5.62% -6.24%'),
} satisfies Record<string, FigmaIconSpec>;

/* ----------------------------------------------------------------- navbar */

export const navIcons = {
  panelLeft: icon('a8470657-fa97-42f0-a0cf-3b686a690940.svg', '12.5%', '-5%', 20),
  bell: icon('527158c2-e446-4847-8341-4ae0395faf39.svg', '8.33% 12.5% 8.31% 12.5%', '-5.62% -6.25%'),
  languages: icon('3b802c44-7bd4-4a69-b909-2ca79f5e8450.svg', '8.33%', '-5.63%'),
} satisfies Record<string, FigmaIconSpec>;

export const navImages = {
  notificationDot: remote('4362b2a2-1f7c-419b-853d-55e9aa1bded6.svg'),
  avatar: remote('cd1c9c9d-6e73-4629-9381-b9e1d5cd3d38.png'),
};

/* ---------------------------------------------------------------- content */

export const contentIcons = {
  plus: icon('8613ed45-a99a-4039-9bdb-75d95c79de1b.svg', '20.83%', '-8.04%'),
  search: icon('7d8a1f51-ce72-40fd-993d-7bb9bdb183ff.svg', '12.5%', '-6.25%'),
  chevronDown: icon('f91512eb-bbab-4800-a6cd-f2a7f86a54df.svg', '37.5% 25%', '-18.75% -9.38%'),
  connected: icon('7518fbcf-7aed-4870-9de0-264c8b482513.svg', '8.31% 8.33% 8.36% 8.33%', '-5.63%'),
  disconnected: icon('828648bb-79e2-4a16-9076-5103050dbcf6.svg', '8.33%', '-5.63%'),
  error: icon('0fb42aae-8974-4213-9f13-6e17c369ebca.svg', '12.44% 8.34% 12.5% 8.26%', '-6.25% -5.62%'),
  bot: icon('ffe99ff8-cf4e-4edf-a8fc-1bb1c577ef24.svg', '16.67% 8.33%', '-4.5% -3.6%', 25),
} satisfies Record<string, FigmaIconSpec>;

/* ------------------------------------------------------------------ brand */

export const brandLogos = {
  whatsapp: remote('35070677-ab9f-4fcd-8469-4ae35daff259.svg'),
  telegram: remote('506ff817-67cd-4fc7-a3c5-a39125085489.svg'),
  sms: remote('155d8dfb-4e48-4b53-acc1-5ede32fced08.png'),
  agelgil: remote('649507ee-6a47-487d-92b8-84314961c41e.svg'),
};

/** Decorative circle that bleeds off the bottom-right of each channel card. */
export const cardFlourish = {
  green: remote('d00263ab-0b84-4a71-add4-973a12feca5c.svg'),
  neutral: remote('12cb53fc-041e-4a2a-b043-ec4274284a9b.svg'),
};

/** Switch thumb — exported with its drop shadow baked in. */
export const switchThumb = {
  md: remote('90a805fa-370f-42e6-8ac7-8e9edbc353e7.svg'),
  sm: remote('de7e6b30-9617-4c75-8f13-cd2c412ec2f1.svg'),
};

/* ============================================================
   Catalog page assets
   ============================================================ */

/** Inline SVG helper — produces a data URI that FigmaIcon can render. */
const inlineSvg = (svg: string, box = 16): FigmaIconSpec => ({
  src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
  box,
  inset: '0%',
  bleed: '0%',
});

export const catalogIcons = {
  back: inlineSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="%230a0a0a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg>',
  ),
  link: inlineSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="%230a0a0a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5l3-3"/><path d="M7.17 5.17l.83-.84a2.83 2.83 0 114 4l-.83.84"/><path d="M8.83 10.83l-.83.84a2.83 2.83 0 11-4-4l.83-.84"/></svg>',
  ),
};

export const tabIcons = {
  all: inlineSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>',
  ),
  social: inlineSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13V3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2z"/></svg>',
  ),
  sms: inlineSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="1" width="10" height="14" rx="2"/><line x1="8" y1="12" x2="8" y2="12.01"/></svg>',
  ),
  email: inlineSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="14" height="10" rx="1"/><path d="M1 4l7 5 7-5"/></svg>',
  ),
  liveChat: inlineSvg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1h10a1 1 0 011 1v7z"/><circle cx="5.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="8" cy="6.5" r=".5" fill="currentColor"/><circle cx="10.5" cy="6.5" r=".5" fill="currentColor"/></svg>',
  ),
};

/* ---------------------------------------------------------------- brand marks */

export type BrandMarkSpec =
  | {
      kind: 'image';
      src: string;
      fit?: 'contain' | 'cover' | 'fill';
      rounded?: boolean;
      clip?: boolean;
    }
  | {
      kind: 'layers';
      layers: Array<{
        src: string;
        inset?: string;
        left?: number;
        top?: number;
        width?: number;
        height?: number;
      }>;
      background?: string;
      rounded?: boolean;
      clip?: boolean;
    };

/** Helper: single-image brand mark from a colored circle SVG with a letter. */
const brandCircle = (color: string, letter: string): BrandMarkSpec => ({
  kind: 'image',
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="${color}"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-family="sans-serif" font-weight="600">${letter}</text></svg>`,
  )}`,
  fit: 'contain',
  rounded: true,
  clip: true,
});

/** Helper: brand mark from an existing remote asset. */
const brandImage = (src: string, rounded = false): BrandMarkSpec => ({
  kind: 'image',
  src,
  fit: 'contain',
  rounded,
  clip: true,
});

export const brandMarks = {
  whatsapp: brandImage(brandLogos.whatsapp),
  telegram: brandImage(brandLogos.telegram),
  tiktok: brandCircle('#000000', 'T'),
  messenger: brandCircle('#0084FF', 'M'),
  viber: brandCircle('#7360F2', 'V'),
  instagram: brandCircle('#C506E9', 'I'),
  line: brandCircle('#06C755', 'L'),
  slack: brandCircle('#ECB22E', 'S'),
  gmail: brandCircle('#EA4335', 'G'),
  twilio: brandCircle('#F22F46', 'T'),
  sms: brandImage(brandLogos.sms),
  mail: brandCircle('#2196F3', 'E'),
  smpp: brandCircle('#33B672', 'S'),
  webChat: brandImage(brandLogos.agelgil),
};

/** Glow: decorative radial gradient behind each catalog card. */
const glow = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="g"><stop offset="0%" stop-color="${color}" stop-opacity="0.3"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="100" r="100" fill="url(%23g)"/></svg>`,
  )}`;

export const catalogGlow = {
  whatsapp: glow('#25D366'),
  telegram: glow('#26A5E4'),
  tiktok: glow('#25F4EE'),
  messenger: glow('#0084FF'),
  viber: glow('#7360F2'),
  instagram: glow('#C506E9'),
  line: glow('#06C755'),
  slack: glow('#ECB22E'),
  gmail: glow('#EA4335'),
  twilio: glow('#F22F46'),
  blue: glow('#2196F3'),
  smpp: glow('#33B672'),
  webChat: glow('#2563EB'),
};
