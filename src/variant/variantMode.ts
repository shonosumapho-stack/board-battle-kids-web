export type VariantModeId = 'BLOCKER' | 'CUBE' | 'WILD';

export const VARIANT_MODES: { id: VariantModeId; label: string }[] = [
  { id: 'BLOCKER', label: 'ブロッカー（障害マスあり）' },
  { id: 'CUBE', label: '立体風（3×3×3）' },
  { id: 'WILD', label: 'ワイルド中央マス' },
];

export function parseVariantMode(s: string | null): VariantModeId {
  if (s === 'BLOCKER' || s === 'CUBE' || s === 'WILD') return s;
  return 'BLOCKER';
}
