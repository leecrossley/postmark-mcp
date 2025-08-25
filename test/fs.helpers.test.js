import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { listTemplateCategories, listTemplatesInCategory, getTemplateContent, getTemplateIdeas } from '../index.js';

const fixtures = join(process.cwd(), 'test', 'fixtures');

describe('filesystem helpers', () => {
  it('returns empty list for non-existent directory', async () => {
    const res = await listTemplateCategories(join(fixtures, 'missing'));
    expect(res).toEqual([]);
  });

  it('lists templates in a category', async () => {
    const base = join(fixtures, 'templates-inlined');
    const cats = await listTemplateCategories(base);
    expect(cats).toContain('basic');
    const tpls = await listTemplatesInCategory(base, 'basic');
    expect(tpls).toContain('welcome');
  });

  it('reads html and text content', async () => {
    const base = join(fixtures, 'templates-inlined');
    const html = await getTemplateContent(base, 'basic', 'welcome', 'html');
    const text = await getTemplateContent(base, 'basic', 'welcome', 'text');
    expect(html).toContain('<h1>Welcome</h1>');
    expect(text).toContain('Welcome');
  });

  it('finds ideas by topic', async () => {
    const base = join(fixtures, 'templates-inlined');
    const ideas = await getTemplateIdeas(base, 'welcome');
    expect(ideas.some(i => i.template === 'welcome')).toBe(true);
  });
});


