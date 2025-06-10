#!/usr/bin/env node

/**
 * @file Postmark MCP Server - Official SDK Implementation
 * @description Universal MCP server for Postmark using the official TypeScript SDK
 * @author Jabal Torres
 * @version 1.0.0
 * @license MIT
 */

// Load environment variables
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try to load .env file
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    }
  });
  console.error('✅ Loaded .env file');
} catch (err) {
  console.error('⚠️ No .env file found, using environment variables');
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import postmark from "postmark";

// Postmark configuration
const serverToken = process.env.POSTMARK_SERVER_TOKEN;
const defaultSender = process.env.DEFAULT_SENDER_EMAIL;
const defaultMessageStream = process.env.DEFAULT_MESSAGE_STREAM || 'outbound';

// Validate required environment variables
if (!serverToken) {
  console.error('❌ Error: POSTMARK_SERVER_TOKEN is not set');
  process.exit(1);
}
if (!defaultSender) {
  console.error('❌ Error: DEFAULT_SENDER_EMAIL is not set');
  process.exit(1);
}

console.error('🚀 Initializing Postmark MCP server (Official SDK)...');
console.error('📧 Server token:', serverToken.substring(0, 8) + '...');
console.error('👤 Default sender:', defaultSender);
console.error('📨 Message stream:', defaultMessageStream);

// Initialize Postmark client
const postmarkClient = new postmark.ServerClient(serverToken);

// Create MCP server using the official SDK pattern
const server = new McpServer({
  name: "postmark-mcp",
  version: "1.0.0"
});

// Define and register the sendEmail tool
server.tool(
  "sendEmail",
  {
    to: z.string().email().describe("Recipient email address"),
    subject: z.string().describe("Email subject"),
    textBody: z.string().describe("Plain text body of the email"),
    htmlBody: z.string().optional().describe("HTML body of the email (optional)"),
    from: z.string().email().optional().describe("Sender email address (optional, uses default if not provided)"),
    tag: z.string().optional().describe("Optional tag for categorization")
  },
  async ({ to, subject, textBody, htmlBody, from, tag }) => {
    const emailData = {
      From: from || defaultSender,
      To: to,
      Subject: subject,
      TextBody: textBody,
      MessageStream: defaultMessageStream,
      TrackOpens: true,
      TrackLinks: "HtmlAndText"
    };

    if (htmlBody) emailData.HtmlBody = htmlBody;
    if (tag) emailData.Tag = tag;

    console.error('📤 Sending email:', JSON.stringify(emailData, null, 2));
    const result = await postmarkClient.sendEmail(emailData);
    console.error('✅ Email sent successfully:', result.MessageID);
    
    return {
      content: [{
        type: "text",
        text: `✅ Email sent successfully!\n📧 MessageID: ${result.MessageID}\n👤 To: ${to}\n📝 Subject: ${subject}`
      }]
    };
  }
);

// Define and register the sendEmailWithTemplate tool
server.tool(
  "sendEmailWithTemplate",
  {
    to: z.string().email().describe("Recipient email address"),
    templateId: z.number().optional().describe("Template ID (use either this or templateAlias)"),
    templateAlias: z.string().optional().describe("Template alias (use either this or templateId)"),
    templateModel: z.object({}).passthrough().describe("Data model for template variables"),
    from: z.string().email().optional().describe("Sender email address (optional)"),
    tag: z.string().optional().describe("Optional tag for categorization")
  },
  async ({ to, templateId, templateAlias, templateModel, from, tag }) => {
    if (!templateId && !templateAlias) {
      throw new Error("Either templateId or templateAlias must be provided");
    }

    const emailData = {
      From: from || defaultSender,
      To: to,
      TemplateModel: templateModel,
      MessageStream: defaultMessageStream,
      TrackOpens: true,
      TrackLinks: "HtmlAndText"
    };

    if (templateId) {
      emailData.TemplateId = templateId;
    } else {
      emailData.TemplateAlias = templateAlias;
    }

    if (tag) emailData.Tag = tag;

    console.error('📤 Sending template email:', JSON.stringify(emailData, null, 2));
    const result = await postmarkClient.sendEmailWithTemplate(emailData);
    console.error('✅ Template email sent successfully:', result.MessageID);
    
    return {
      content: [{
        type: "text", 
        text: `✅ Template email sent successfully!\n📧 MessageID: ${result.MessageID}\n👤 To: ${to}\n🎯 Template: ${templateId || templateAlias}`
      }]
    };
  }
);

// Define and register the listTemplates tool
server.tool(
  "listTemplates",
  {},
  async () => {
    console.error('📋 Fetching templates...');
    const result = await postmarkClient.getTemplates();
    console.error(`✅ Found ${result.Templates.length} templates`);
    
    const templateList = result.Templates.map(t => 
      `• **${t.Name}**\n  - ID: ${t.TemplateId}\n  - Alias: ${t.Alias || 'none'}\n  - Subject: ${t.Subject || 'none'}`
    ).join('\n\n');
    
    return {
      content: [{
        type: "text",
        text: `📋 **Found ${result.Templates.length} templates:**\n\n${templateList}`
      }]
    };
  }
);

// Define and register the getDeliveryStats tool
server.tool(
  "getDeliveryStats",
  {
    tag: z.string().optional().describe("Filter by tag (optional)"),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date in YYYY-MM-DD format (optional)"),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("End date in YYYY-MM-DD format (optional)")
  },
  async ({ tag, fromDate, toDate }) => {
    const query = [];
    if (fromDate) query.push(`fromdate=${encodeURIComponent(fromDate)}`);
    if (toDate) query.push(`todate=${encodeURIComponent(toDate)}`);
    if (tag) query.push(`tag=${encodeURIComponent(tag)}`);
    
    const url = `https://api.postmarkapp.com/stats/outbound${query.length ? '?' + query.join('&') : ''}`;
    
    console.error('📊 Fetching delivery stats from:', url);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "X-Postmark-Server-Token": serverToken
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.error('✅ Stats retrieved:', JSON.stringify(data, null, 2));
    
    const sent = data.Sent || 0;
    const tracked = data.Tracked || 0;
    const uniqueOpens = data.UniqueOpens || 0;
    const totalTrackedLinks = data.TotalTrackedLinksSent || 0;
    const uniqueLinksClicked = data.UniqueLinksClicked || 0;
    
    const openRate = tracked > 0 ? ((uniqueOpens / tracked) * 100).toFixed(1) : '0.0';
    const clickRate = totalTrackedLinks > 0 ? ((uniqueLinksClicked / totalTrackedLinks) * 100).toFixed(1) : '0.0';
    
    return {
      content: [{
        type: "text",
        text: `📊 **Email Statistics Summary**\n\n` +
              `📤 **Sent:** ${sent} emails\n` +
              `👁️ **Open Rate:** ${openRate}% (${uniqueOpens}/${tracked} tracked emails)\n` +
              `🔗 **Click Rate:** ${clickRate}% (${uniqueLinksClicked}/${totalTrackedLinks} tracked links)\n\n` +
              `${fromDate || toDate ? `📅 **Period:** ${fromDate || 'start'} to ${toDate || 'now'}\n` : ''}` +
              `${tag ? `🏷️ **Tag:** ${tag}\n` : ''}`
      }]
    };
  }
);

// Start the server
async function main() {
  console.error('🚀 Starting MCP server...');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('✅ Postmark MCP server is running and ready!');
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});