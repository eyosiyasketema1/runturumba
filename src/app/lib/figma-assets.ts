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
