import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { listTemplateCategories, listTemplatesInCategory, getTemplateContent, getTemplateIdeas } from '../index.js';

const fixtures = join(process.cwd(), 'test', 'fixtures');

describe('filesystem helpers', () => {
  it('returns structured error for non-existent directory', async () => {
    const res = await listTemplateCategories(join(fixtures, 'missing'));
    expect(res.ok).toBe(false);
    expect(res.code).toBeDefined();
  });

  it('lists templates in a category', async () => {
    const base = join(fixtures, 'templates-inlined');
    const cats = await listTemplateCategories(base);
    expect(cats.ok).toBe(true);
    expect(cats.categories).toContain('basic');
    const tpls = await listTemplatesInCategory(base, 'basic');
    expect(tpls.ok).toBe(true);
    expect(tpls.templates).toContain('welcome');
  });

  it('reads html and text content', async () => {
    const base = join(fixtures, 'templates-inlined');
    const html = await getTemplateContent(base, 'basic', 'welcome', 'html');
    const text = await getTemplateContent(base, 'basic', 'welcome', 'text');
    expect(html.ok).toBe(true);
    expect(html.content).toContain('<h1>Welcome</h1>');
    expect(text.ok).toBe(true);
    expect(text.content).toContain('Welcome');
  });

  it('finds ideas by topic', async () => {
    const base = join(fixtures, 'templates-inlined');
    const ideas = await getTemplateIdeas(base, 'welcome');
    expect(ideas.ok).toBe(true);
    expect(ideas.ideas.some(i => i.template === 'welcome')).toBe(true);
  });
});


