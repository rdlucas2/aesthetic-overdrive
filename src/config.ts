import { getQueryParam } from './platform/query';

// A/B testing: pick a variant with ?variant=b. Add new knobs here, never hard-code in scenes.
export interface VariantConfig {
  xpMultiplier: number;
  levelUpChoices: number;
  spawnDensity: number;
}

const VARIANTS: Record<string, VariantConfig> = {
  a: { xpMultiplier: 1, levelUpChoices: 3, spawnDensity: 1 },
  b: { xpMultiplier: 1.5, levelUpChoices: 3, spawnDensity: 1.25 },
};

const requested = (getQueryParam('variant') ?? 'a').toLowerCase();
export const variantId = requested in VARIANTS ? requested : 'a';

export const config = {
  width: 960,
  height: 540,
  horizonY: 230,
  playerMinY: 345,
  playerMaxY: 490,
  debug: getQueryParam('debug') === '1',
  variantId,
  ...VARIANTS[variantId],
};
