import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('postmark', () => ({ default: { ServerClient: vi.fn() } }));

describe('registerTools', () => {
  let mockServer;
  let toolDefs;
  let registerTools;

  beforeEach(async () => {
    toolDefs = new Map();
    mockServer = {
      tool: vi.fn((name, schema, handler) => {
        toolDefs.set(name, { schema, handler });
      }),
    };
    vi.resetModules();
    process.env.VITEST = '1';
    process.env.DEFAULT_SENDER_EMAIL = 'from@example.com';
    process.env.DEFAULT_MESSAGE_STREAM = 'outbound';
    ({ registerTools } = await import('../index.js'));
  });

  it('registers expected tools', () => {
    const mockClient = {};
    registerTools(mockServer, mockClient);

    const names = Array.from(toolDefs.keys());
    // Core set: ensure key tools exist
    ['sendEmail','sendEmailWithTemplate','listTemplates','getDeliveryStats','getTemplateContent','getTemplateIdeas','createTemplate','updateTemplate','deleteTemplate','listTemplateCategories','listTemplatesInCategory','simulateTemplatePush','executeTemplatePush']
      .forEach(name => expect(names).toContain(name));
  });

  it('sendEmail constructs payload with defaults', async () => {
    const mockClient = { sendEmail: vi.fn().mockResolvedValue({ MessageID: 'mid-1' }) };

    registerTools(mockServer, mockClient);
    const { handler } = toolDefs.get('sendEmail');

    const res = await handler({ to: 'to@example.com', subject: 'S', textBody: 'T' });
    expect(mockClient.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      From: 'from@example.com',
      To: 'to@example.com',
      Subject: 'S',
      TextBody: 'T',
      MessageStream: 'outbound',
      TrackOpens: true,
      TrackLinks: 'HtmlAndText',
    }));
    expect(res.content[0].text).toContain('Email sent successfully');
  });
});


