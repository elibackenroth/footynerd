import type { FootygridPlayer, FootygridHeader } from './types';

export function footygridDefFits(player: FootygridPlayer | undefined, def: FootygridHeader | undefined): boolean {
  if (!player || !def) return false;
  if (def.isClub) return player.clubs.includes(def.key);
  if (def.isFlag) return player.country === def.key;
  return player.trophies.includes(def.key);
}

export function footygridPlayerFits(player: FootygridPlayer | undefined, rowDef: FootygridHeader | undefined, colDef: FootygridHeader | undefined): boolean {
  return footygridDefFits(player, rowDef) && footygridDefFits(player, colDef);
}
