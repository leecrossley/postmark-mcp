import { join } from "path";
import { z } from "zod";
import { getTemplateContent, getTemplateIdeas, listTemplateCategories, listTemplatesInCategory } from "../helpers/templates.js";
import { logger } from "../logger.js";

/**
 * Registers all Postmark-related MCP tools on the provided server instance.
 * Each tool validates input via zod schemas and delegates to the Postmark client or local helpers.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {import('postmark').ServerClient} postmarkClient
 */
export function registerTools(server, postmarkClient) {
  const resolveTemplatesBasePath = () => {
    const envPath = process.env.POSTMARK_TEMPLATES_PATH || process.env.TEMPLATES_BASE_PATH;
    return envPath ? envPath : join(process.cwd(), "postmark-templates", "templates-inlined");
  };
  server.tool(
    "sendEmail",
    {
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      textBody: z.string().describe("Plain text body of the email"),
      htmlBody: z.string().optional().describe("HTML body of the email (optional)"),
      from: z.string().email().optional().describe("Sender email address (optional, uses default if not provided)"),
      tag: z.string().optional().describe("Optional tag for categorization"),
    },
    async ({ to, subject, textBody, htmlBody, from, tag }) => {
      const emailData = {
        From: from || process.env.DEFAULT_SENDER_EMAIL,
        To: to,
        Subject: subject,
        TextBody: textBody,
        MessageStream: process.env.DEFAULT_MESSAGE_STREAM,
        TrackOpens: true,
        TrackLinks: "HtmlAndText",
      };
      if (htmlBody) emailData.HtmlBody = htmlBody;
      if (tag) emailData.Tag = tag;
      logger.info("Sending email...", { to, subject });
      const result = await postmarkClient.sendEmail(emailData);
      logger.info("Email sent successfully", { messageId: result.MessageID });
      return { content: [{ type: "text", text: `Email sent successfully!\nMessageID: ${result.MessageID}\nTo: ${to}\nSubject: ${subject}` }] };
    }
  );

  server.tool(
    "sendEmailWithTemplate",
    {
      to: z.string().email().describe("Recipient email address"),
      templateId: z.number().optional().describe("Template ID (use either this or templateAlias)"),
      templateAlias: z.string().optional().describe("Template alias (use either this or templateId)"),
      templateModel: z.object({}).passthrough().describe("Data model for template variables"),
      from: z.string().email().optional().describe("Sender email address (optional)"),
      tag: z.string().optional().describe("Optional tag for categorization"),
    },
    async ({ to, templateId, templateAlias, templateModel, from, tag }) => {
      if (!templateId && !templateAlias) throw new Error("Either templateId or templateAlias must be provided");
      const emailData = {
        From: from || process.env.DEFAULT_SENDER_EMAIL,
        To: to,
        TemplateModel: templateModel,
        MessageStream: process.env.DEFAULT_MESSAGE_STREAM,
        TrackOpens: true,
        TrackLinks: "HtmlAndText",
      };
      if (templateId) emailData.TemplateId = templateId; else emailData.TemplateAlias = templateAlias;
      if (tag) emailData.Tag = tag;
      logger.info("Sending template email...", { to, templateId: templateId || templateAlias });
      const result = await postmarkClient.sendEmailWithTemplate(emailData);
      logger.info("Template email sent successfully", { messageId: result.MessageID });
      return { content: [{ type: "text", text: `Template email sent successfully!\nMessageID: ${result.MessageID}\nTo: ${to}\nTemplate: ${templateId || templateAlias}` }] };
    }
  );

  server.tool("listTemplates", {}, async () => {
    logger.info("Fetching templates...");
    const result = await postmarkClient.getTemplates();
    logger.info("Templates fetched", { count: result.Templates.length });
    const templateList = result.Templates.map((t) => `• **${t.Name}**\n  - ID: ${t.TemplateId}\n  - Alias: ${t.Alias || "none"}\n  - Subject: ${t.Subject || "none"}`).join("\n\n");
    return { content: [{ type: "text", text: `Found ${result.Templates.length} templates:\n\n${templateList}` }] };
  });

  server.tool(
    "getDeliveryStats",
    {
      tag: z.string().optional().describe("Filter by tag (optional)"),
      fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date in YYYY-MM-DD format (optional)"),
      toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("End date in YYYY-MM-DD format (optional)"),
    },
    async ({ tag, fromDate, toDate }) => {
      const query = [];
      if (fromDate) query.push(`fromdate=${encodeURIComponent(fromDate)}`);
      if (toDate) query.push(`todate=${encodeURIComponent(toDate)}`);
      if (tag) query.push(`tag=${encodeURIComponent(tag)}`);
      const url = `https://api.postmarkapp.com/stats/outbound${query.length ? "?" + query.join("&") : ""}`;
      logger.info("Fetching delivery stats...");
      const response = await fetch(url, { headers: { Accept: "application/json", "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN } });
      if (!response.ok) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      const data = await response.json();
      logger.info("Stats retrieved successfully");
      const sent = data.Sent || 0;
      const tracked = data.Tracked || 0;
      const uniqueOpens = data.UniqueOpens || 0;
      const totalTrackedLinks = data.TotalTrackedLinksSent || 0;
      const uniqueLinksClicked = data.UniqueLinksClicked || 0;
      const openRate = tracked > 0 ? ((uniqueOpens / tracked) * 100).toFixed(1) : "0.0";
      const clickRate = totalTrackedLinks > 0 ? ((uniqueLinksClicked / totalTrackedLinks) * 100).toFixed(1) : "0.0";
      return { content: [{ type: "text", text: `Email Statistics Summary\n\nSent: ${sent} emails\nOpen Rate: ${openRate}% (${uniqueOpens}/${tracked} tracked emails)\nClick Rate: ${clickRate}% (${uniqueLinksClicked}/${totalTrackedLinks} tracked links)\n\n${fromDate || toDate ? `Period: ${fromDate || "start"} to ${toDate || "now"}\n` : ""}${tag ? `Tag: ${tag}\n` : ""}` }] };
    }
  );

  server.tool("listTemplateCategories", {}, async () => {
    const templatesBasePath = resolveTemplatesBasePath();
    logger.info("Listing template categories...");
    const categoriesRes = await listTemplateCategories(templatesBasePath);
    if (!categoriesRes.ok) {
      return { content: [{ type: "text", text: categoriesRes.message }] };
    }
    const categories = categoriesRes.categories;
    logger.info("Template categories listed", { count: categories.length });
    if (categories.length === 0) {
      return { content: [{ type: "text", text: "No template categories found. The postmark-templates/templates-inlined directory may not exist or may be empty." }] };
    }
    const categoryList = categories.map((cat) => `• ${cat}`).join("\n");
    return { content: [{ type: "text", text: `Found ${categories.length} template categories:\n\n${categoryList}` }] };
  });

  server.tool(
    "listTemplatesInCategory",
    { categoryName: z.string().describe("The name of the template category to list templates from") },
    async ({ categoryName }) => {
      const templatesBasePath = resolveTemplatesBasePath();
      logger.info("Listing templates in category", { categoryName });
      const templatesRes = await listTemplatesInCategory(templatesBasePath, categoryName);
      if (!templatesRes.ok) {
        return { content: [{ type: "text", text: templatesRes.message }] };
      }
      const templates = templatesRes.templates;
      logger.info("Templates listed", { categoryName, count: templates.length });
      if (templates.length === 0) {
        return { content: [{ type: "text", text: `No templates found in category '${categoryName}'. The category may not exist or may be empty.` }] };
      }
      const templateList = templates.map((template) => `• ${template}`).join("\n");
      return { content: [{ type: "text", text: `Found ${templates.length} templates in category '${categoryName}':\n\n${templateList}` }] };
    }
  );

  server.tool(
    "getTemplateContent",
    {
      categoryName: z.string().describe("The name of the template category"),
      templateName: z.string().describe("The name of the template"),
      format: z.string().optional().describe("The format to retrieve: 'html' or 'text' (default: 'html')"),
    },
    async ({ categoryName, templateName, format = "html" }) => {
      const templatesBasePath = resolveTemplatesBasePath();
      logger.info("Getting template content", { categoryName, templateName, format });
      if (format !== "html" && format !== "text") {
        return { content: [{ type: "text", text: `Invalid format '${format}'. Please use 'html' or 'text'.` }] };
      }
      const contentRes = await getTemplateContent(templatesBasePath, categoryName, templateName, format);
      if (!contentRes.ok) {
        return { content: [{ type: "text", text: `Template ${format} content for '${templateName}' in category '${categoryName}' not found.` }] };
      }
      logger.info("Template content retrieved", { templateName, format });
      return { content: [{ type: "text", text: `Template content for '${templateName}' in category '${categoryName}' (${format} format):\n\n\`\`\`${format}\n${contentRes.content}\n\`\`\`` }] };
    }
  );

  server.tool(
    "getTemplateIdeas",
    { topic: z.string().describe("The topic to search for in template names") },
    async ({ topic }) => {
      const templatesBasePath = resolveTemplatesBasePath();
      logger.info("Searching for template ideas", { topic });
      const ideasRes = await getTemplateIdeas(templatesBasePath, topic);
      if (!ideasRes.ok) {
        return { content: [{ type: "text", text: ideasRes.message }] };
      }
      const ideas = ideasRes.ideas;
      logger.info("Template ideas found", { topic, count: ideas.length });
      if (ideas.length === 0) {
        return { content: [{ type: "text", text: `No templates found matching the topic '${topic}'. Try a different search term.` }] };
      }
      const ideaList = ideas.map((idea) => `• **${idea.template}** (in category: ${idea.category})`).join("\n");
      return { content: [{ type: "text", text: `Found ${ideas.length} template ideas for topic '${topic}':\n\n${ideaList}` }] };
    }
  );

  server.tool(
    "createTemplate",
    {
      name: z.string().describe("Template name (required)"),
      subject: z.string().describe("Email subject (required)"),
      htmlBody: z.string().optional().describe("HTML body of the template (optional if textBody is provided)"),
      textBody: z.string().optional().describe("Plain text body of the template (optional if htmlBody is provided)"),
      alias: z.string().optional().describe("Template alias for easy reference (optional)"),
    },
    async ({ name, subject, htmlBody, textBody, alias }) => {
      if (!htmlBody && !textBody) throw new Error("Either htmlBody or textBody must be provided");
      logger.info("Creating new template...", { name, subject, alias });
      const templateData = { Name: name, Subject: subject };
      if (htmlBody) templateData.HtmlBody = htmlBody;
      if (textBody) templateData.TextBody = textBody;
      if (alias) templateData.Alias = alias;
      const result = await postmarkClient.createTemplate(templateData);
      logger.info("Template created successfully", { templateId: result.TemplateId });
      return { content: [{ type: "text", text: `Template created successfully!\n\nTemplate ID: ${result.TemplateId}\nName: ${result.Name}\nSubject: ${result.Subject}\nAlias: ${result.Alias || "none"}\nActive: ${result.Active ? "Yes" : "No"}` }] };
    }
  );

  server.tool(
    "updateTemplate",
    {
      templateIdOrAlias: z.string().describe("Template ID or alias to update"),
      name: z.string().optional().describe("New template name (optional)"),
      subject: z.string().optional().describe("New email subject (optional)"),
      htmlBody: z.string().optional().describe("New HTML body of the template (optional)"),
      textBody: z.string().optional().describe("New plain text body of the template (optional)"),
      alias: z.string().optional().describe("New template alias (optional)"),
    },
    async ({ templateIdOrAlias, name, subject, htmlBody, textBody, alias }) => {
      logger.info("Updating template...", { templateIdOrAlias, name, subject, alias });
      const updateData = {};
      if (name !== undefined) updateData.Name = name;
      if (subject !== undefined) updateData.Subject = subject;
      if (htmlBody !== undefined) updateData.HtmlBody = htmlBody;
      if (textBody !== undefined) updateData.TextBody = textBody;
      if (alias !== undefined) updateData.Alias = alias;
      if (Object.keys(updateData).length === 0) throw new Error("At least one field must be provided to update");
      const result = await postmarkClient.editTemplate(templateIdOrAlias, updateData);
      logger.info("Template updated successfully", { templateId: result.TemplateId });
      return { content: [{ type: "text", text: `Template updated successfully!\n\nTemplate ID: ${result.TemplateId}\nName: ${result.Name}\nSubject: ${result.Subject}\nAlias: ${result.Alias || "none"}\nActive: ${result.Active ? "Yes" : "No"}` }] };
    }
  );

  server.tool(
    "deleteTemplate",
    { templateIdOrAlias: z.string().describe("Template ID or alias to delete") },
    async ({ templateIdOrAlias }) => {
      logger.info("Deleting template...", { templateIdOrAlias });
      const result = await postmarkClient.deleteTemplate(templateIdOrAlias);
      logger.info("Template deleted successfully", { templateIdOrAlias });
      return { content: [{ type: "text", text: `Template deleted successfully!\n\nTemplate ID/Alias: ${templateIdOrAlias}\nStatus: ${result.Message || "Deleted"}\n\nNote: This action has been logged for auditing purposes.` }] };
    }
  );

  server.tool(
    "simulateTemplatePush",
    {
      sourceServerID: z.string().describe("Server ID of the source server containing the templates"),
      destinationServerID: z.string().describe("Server ID of the destination server receiving the templates"),
    },
    async ({ sourceServerID, destinationServerID }) => {
      if (!process.env.POSTMARK_ACCOUNT_TOKEN) {
        throw new Error("POSTMARK_ACCOUNT_TOKEN environment variable is required for template push operations");
      }
      logger.info("Simulating template push...", { sourceServerID, destinationServerID });
      const response = await fetch("https://api.postmarkapp.com/templates/push", {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Account-Token": process.env.POSTMARK_ACCOUNT_TOKEN },
        body: JSON.stringify({ SourceServerID: sourceServerID, DestinationServerID: destinationServerID, PerformChanges: false }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Postmark API Error (${response.status}): ${errorData.Message || response.statusText}`);
      }
      const result = await response.json();
      logger.info("Template push simulation completed", { total: result.TotalCount });
      const templatesList = result.Templates.map((t) => `• **${t.Name}** (${t.Alias || "no alias"})\n  - Action: ${t.Action}\n  - Type: ${t.TemplateType}\n  - Template ID: ${t.TemplateId || "N/A"}`).join("\n\n");
      return { content: [{ type: "text", text: `Template Push Simulation Results\n\nSource Server ID: ${sourceServerID}\nDestination Server ID: ${destinationServerID}\nTotal Templates Affected: ${result.TotalCount}\n\n${result.TotalCount > 0 ? `Templates that would be affected:\n\n${templatesList}` : "No templates would be affected."}\n\nNote: This was a simulation only. No changes were made.` }] };
    }
  );

  server.tool(
    "executeTemplatePush",
    {
      sourceServerID: z.string().describe("Server ID of the source server containing the templates"),
      destinationServerID: z.string().describe("Server ID of the destination server receiving the templates"),
    },
    async ({ sourceServerID, destinationServerID }) => {
      if (!process.env.POSTMARK_ACCOUNT_TOKEN) {
        throw new Error("POSTMARK_ACCOUNT_TOKEN environment variable is required for template push operations");
      }
      logger.info("Executing template push...", { sourceServerID, destinationServerID });
      const response = await fetch("https://api.postmarkapp.com/templates/push", {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Account-Token": process.env.POSTMARK_ACCOUNT_TOKEN },
        body: JSON.stringify({ SourceServerID: sourceServerID, DestinationServerID: destinationServerID, PerformChanges: true }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Postmark API Error (${response.status}): ${errorData.Message || response.statusText}`);
      }
      const result = await response.json();
      logger.info("Template push executed successfully", { total: result.TotalCount });
      const templatesList = result.Templates.map((t) => `• **${t.Name}** (${t.Alias || "no alias"})\n  - Action: ${t.Action}\n  - Type: ${t.TemplateType}\n  - Template ID: ${t.TemplateId || "N/A"}`).join("\n\n");
      return { content: [{ type: "text", text: `Template Push Execution Results\n\nSource Server ID: ${sourceServerID}\nDestination Server ID: ${destinationServerID}\nTotal Templates Processed: ${result.TotalCount}\n\n${result.TotalCount > 0 ? `Templates that were processed:\n\n${templatesList}` : "No templates were processed."}\n\nNote: Changes have been applied to the destination server.` }] };
    }
  );
}


