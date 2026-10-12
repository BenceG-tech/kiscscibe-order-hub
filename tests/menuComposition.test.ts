import { describe, expect, it } from 'bun:test';
import { menuComposition } from '../src/lib/menuComposition';

const soup = { is_menu_part: true, menu_role: 'leves' };
const main = { is_menu_part: true, menu_role: 'főétel' };

describe('Daily menu composition', () => {
  it('accepts exactly one soup and one main', () => {
    expect(menuComposition([main, soup]).complete).toBe(true);
    expect(menuComposition([main, soup]).soup).toBe(soup);
  });
  it('never arbitrarily chooses among two mains', () => {
    const result = menuComposition([soup, main, main]);
    expect(result.complete).toBe(false);
    expect(result.main).toBeNull();
    expect(result.warning).toContain('2 főétel');
  });
  it('warns for duplicate soups', () => {
    expect(menuComposition([soup, soup, main]).warning).toContain('2 leves');
  });
  it('warns for a missing part', () => {
    expect(menuComposition([soup]).warning).toContain('Hiányos');
  });
  it('ignores unselected items and leaves empty days without warnings', () => {
    expect(menuComposition([soup, main, { ...main, is_menu_part: false }]).complete).toBe(true);
    expect(menuComposition([]).warning).toBeNull();
  });
});