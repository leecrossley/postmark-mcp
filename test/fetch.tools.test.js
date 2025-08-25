import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerTools } from '../index.js';

describe('fetch-based tools', () => {
  let originalFetch;
  let toolDefs;
  let mockServer;

  beforeEach(() => {
    originalFetch = global.fetch;
    toolDefs = new Map();
    mockServer = { tool: vi.fn((name, schema, handler) => toolDefs.set(name, { schema, handler })) };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('getDeliveryStats formats response and computes rates', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ Sent: 10, Tracked: 8, UniqueOpens: 4, TotalTrackedLinksSent: 6, UniqueLinksClicked: 3 }) });

    registerTools(mockServer, {});
    const { handler } = toolDefs.get('getDeliveryStats');
    const res = await handler({ tag: 'news', fromDate: '2025-05-01', toDate: '2025-05-02' });
    expect(res.content[0].text).toContain('Open Rate: 50.0%');
    expect(res.content[0].text).toContain('Click Rate: 50.0%');
  });

  it('simulateTemplatePush returns formatted list', async () => {
    process.env.POSTMARK_ACCOUNT_TOKEN = 'acct';
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ TotalCount: 1, Templates: [{ Name: 'Welcome Email', Alias: 'welcome', Action: 'Create', TemplateType: 'Standard', TemplateId: null }] }) });

    registerTools(mockServer, {});
    const { handler } = toolDefs.get('simulateTemplatePush');
    const res = await handler({ sourceServerID: 's', destinationServerID: 'd' });
    expect(res.content[0].text).toContain('Template Push Simulation Results');
    expect(res.content[0].text).toContain('Welcome Email');
  });
});


