export interface MenuPart {
  is_menu_part: boolean;
  menu_role?: string | null;
}

export function menuComposition<T extends MenuPart>(items: T[]) {
  const soups = items.filter(item => item.is_menu_part && item.menu_role === 'leves');
  const mains = items.filter(item => item.is_menu_part && item.menu_role === 'főétel');
  const complete = soups.length === 1 && mains.length === 1;
  return {
    complete,
    soup: complete ? soups[0] : null,
    main: complete ? mains[0] : null,
    warning: soups.length > 1 || mains.length > 1
      ? `Ellenőrizendő menü: ${soups.length} leves és ${mains.length} főétel van kijelölve. Menünként egy leves és egy főétel maradjon.`
      : !complete && items.length > 0
        ? 'Hiányos menü: jelölj ki egy levest és egy főételt.'
        : null,
  };
}