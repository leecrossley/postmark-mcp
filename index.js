#!/usr/bin/env node

/**
 * @file Postmark MCP Server - Official SDK Implementation
 * @description Universal MCP server for Postmark using the official TypeScript SDK
 * @author Jabal Torres
 * @version 1.0.0
 * @license MIT
 */

import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import postmark from "postmark";
import { registerTools } from "./src/tools/registerTools.js";
export { registerTools } from "./src/tools/registerTools.js";
export { listTemplateCategories, listTemplatesInCategory, getTemplateContent, getTemplateIdeas } from "./src/helpers/templates.js";
import { listTemplateCategories as listTemplateCategoriesImpl, listTemplatesInCategory as listTemplatesInCategoryImpl, getTemplateContent as getTemplateContentImpl, getTemplateIdeas as getTemplateIdeasImpl } from "./src/helpers/templates.js";

// Postmark configuration
const serverToken = process.env.POSTMARK_SERVER_TOKEN;
const accountToken = process.env.POSTMARK_ACCOUNT_TOKEN;
const defaultSender = process.env.DEFAULT_SENDER_EMAIL;
const defaultMessageStream = process.env.DEFAULT_MESSAGE_STREAM;

// Initialize Postmark client and MCP server
export async function initializeServices() {
  try {
    // Validate required environment variables
    if (!serverToken) {
      console.error("Error: POSTMARK_SERVER_TOKEN is not set");
      process.exit(1);
    }
    if (!defaultSender) {
      console.error("Error: DEFAULT_SENDER_EMAIL is not set");
      process.exit(1);
    }
    if (!defaultMessageStream) {
      console.error("Error: DEFAULT_MESSAGE_STREAM is not set");
      process.exit(1);
    }

    console.error("Initializing Postmark MCP server (Official SDK)...");
    console.error("Default sender:", defaultSender);
    console.error("Message stream:", defaultMessageStream);

    // Initialize Postmark client
    const client = new postmark.ServerClient(serverToken);

    // Verify Postmark client by making a test API call
    await client.getServer();

    // Create MCP server
    const mcpServer = new McpServer({
      name: "postmark-mcp",
      version: "1.0.0",
    });

    return { postmarkClient: client, mcpServer };
  } catch (error) {
    if (error.code || error.message) {
      throw new Error(
        `Initialization failed: ${error.code ? `${error.code} - ` : ""}${
          error.message
        }`
      );
    }
    throw new Error("Initialization failed: An unexpected error occurred");
  }
}

// Start the server
export async function main() {
  try {
    const { postmarkClient, mcpServer: server } = await initializeServices();

    // Register tools with validated client
    registerTools(server, postmarkClient);

    console.error("Connecting to MCP transport...");
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("Postmark MCP server is running and ready!");

    // Setup graceful shutdown
    process.on("SIGTERM", () => handleShutdown(server));
    process.on("SIGINT", () => handleShutdown(server));
  } catch (error) {
    console.error("Server initialization failed:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown handler
export async function handleShutdown(server) {
  console.error("Shutting down server...");
  try {
    await server.disconnect();
    console.error("Server shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error.message);
    process.exit(1);
  }
}

// Helper functions for template file management
/**
 * Lists the names of all sub-directories within a given path.
 * @param {string} directoryPath The absolute path to the directory to scan.
 * @returns {Promise<string[]>} An array of directory names.
 */
export async function listTemplateCategories(directoryPath) {
  try {
    // Ensure the provided path is a directory
    // Delegate to module implementation (kept for backward compatibility)
    return await listTemplateCategoriesImpl(directoryPath);
  } catch (error) {
    console.error(
      "An error occurred while listing template categories:",
      error
    );
    return []; // Return empty array on error as per acceptance criteria
  }
}

/**
 * Lists the names of all template sub-directories within a specific category directory.
 * @param {string} templatesBasePath The absolute path to the root templates folder.
 * @param {string} categoryName The name of the category to inspect.
 * @returns {Promise<string[]>} An array of template names (sub-directory names).
 */
export async function listTemplatesInCategory(templatesBasePath, categoryName) {
  try {
    return await listTemplatesInCategoryImpl(templatesBasePath, categoryName);
  } catch (error) {
    console.error(
      `An error occurred while listing templates in category '${categoryName}':`,
      error
    );
    return []; // Return empty array on any other error
  }
}

/**
 * Reads the content of a specific template file (HTML or text).
 * @param {string} templatesBasePath The absolute path to the root templates folder.
 * @param {string} categoryName The name of the category.
 * @param {string} templateName The name of the template.
 * @param {string} format The format to retrieve ('html' or 'text').
 * @returns {Promise<string|null>} The content of the template file, or null if not found.
 */
export async function getTemplateContent(
  templatesBasePath,
  categoryName,
  templateName,
  format = "html"
) {
  try {
    return await getTemplateContentImpl(
      templatesBasePath,
      categoryName,
      templateName,
      format
    );
  } catch (error) {
    console.error(
      `An error occurred while reading template content for '${templateName}' in category '${categoryName}':`,
      error
    );
    return null;
  }
}

/**
 * Searches across all template categories and names to find templates matching a given topic.
 * @param {string} templatesBasePath The absolute path to the root templates folder.
 * @param {string} topic The topic to search for.
 * @returns {Promise<Array<{category: string, template: string}>>} An array of matching templates.
 */
export async function getTemplateIdeas(templatesBasePath, topic) {
  try {
    return await getTemplateIdeasImpl(templatesBasePath, topic);
  } catch (error) {
    console.error(
      `An error occurred while searching for template ideas with topic '${topic}':`,
      error
    );
    return [];
  }
}

// Global error handlers
/**
 * Handles uncaught exceptions by logging the error message and exiting the process.
 * This ensures that unhandled errors do not leave the application in an undefined state.
 * @param {Error} error - The uncaught exception object.
 */
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});
/**
 * Handles unhandled promise rejections by logging the error message or reason
 * and exiting the process with an error code.
 * @param {Error|any} reason - The rejection reason, which can be an Error object or any other value.
 */
process.on("unhandledRejection", (reason) => {
  console.error(
    "Unhandled rejection:",
    reason instanceof Error ? reason.message : reason
  );
  process.exit(1);
});

/**
 * Registers Postmark MCP tools on the provided server, using zod-validated inputs
 * and delegating actions to the Postmark client and local helper modules.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {import('postmark').ServerClient} postmarkClient
 */
/* moved to module */ function registerTools_removed(server, postmarkClient) {
  // Define and register the sendEmail tool
  server.tool(
    "sendEmail",
    {
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      textBody: z.string().describe("Plain text body of the email"),
      htmlBody: z
        .string()
        .optional()
        .describe("HTML body of the email (optional)"),
      from: z
        .string()
        .email()
        .optional()
        .describe(
          "Sender email address (optional, uses default if not provided)"
        ),
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

      console.error("Sending email...", { to, subject });
      const result = await postmarkClient.sendEmail(emailData);
      console.error("Email sent successfully:", result.MessageID);

      return {
        content: [
          {
            type: "text",
            text: `Email sent successfully!\nMessageID: ${result.MessageID}\nTo: ${to}\nSubject: ${subject}`,
          },
        ],
      };
    }
  );

  // Define and register the sendEmailWithTemplate tool
  server.tool(
    "sendEmailWithTemplate",
    {
      to: z.string().email().describe("Recipient email address"),
      templateId: z
        .number()
        .optional()
        .describe("Template ID (use either this or templateAlias)"),
      templateAlias: z
        .string()
        .optional()
        .describe("Template alias (use either this or templateId)"),
      templateModel: z
        .object({})
        .passthrough()
        .describe("Data model for template variables"),
      from: z
        .string()
        .email()
        .optional()
        .describe("Sender email address (optional)"),
      tag: z.string().optional().describe("Optional tag for categorization"),
    },
    async ({ to, templateId, templateAlias, templateModel, from, tag }) => {
      if (!templateId && !templateAlias) {
        throw new Error("Either templateId or templateAlias must be provided");
      }

      const emailData = {
        From: from || process.env.DEFAULT_SENDER_EMAIL,
        To: to,
        TemplateModel: templateModel,
        MessageStream: process.env.DEFAULT_MESSAGE_STREAM,
        TrackOpens: true,
        TrackLinks: "HtmlAndText",
      };

      if (templateId) {
        emailData.TemplateId = templateId;
      } else {
        emailData.TemplateAlias = templateAlias;
      }

      if (tag) emailData.Tag = tag;

      console.error("Sending template email...", {
        to,
        templateId: templateId || templateAlias,
      });
      const result = await postmarkClient.sendEmailWithTemplate(emailData);
      console.error("Template email sent successfully:", result.MessageID);

      return {
        content: [
          {
            type: "text",
            text: `Template email sent successfully!\nMessageID: ${
              result.MessageID
            }\nTo: ${to}\nTemplate: ${templateId || templateAlias}`,
          },
        ],
      };
    }
  );

  // Define and register the listTemplates tool
  server.tool("listTemplates", {}, async () => {
    console.error("Fetching templates...");
    const result = await postmarkClient.getTemplates();
    console.error(`Found ${result.Templates.length} templates`);

    const templateList = result.Templates.map(
      (t) =>
        `• **${t.Name}**\n  - ID: ${t.TemplateId}\n  - Alias: ${
          t.Alias || "none"
        }\n  - Subject: ${t.Subject || "none"}`
    ).join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${result.Templates.length} templates:\n\n${templateList}`,
        },
      ],
    };
  });

  // Define and register the getDeliveryStats tool
  server.tool(
    "getDeliveryStats",
    {
      tag: z.string().optional().describe("Filter by tag (optional)"),
      fromDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Start date in YYYY-MM-DD format (optional)"),
      toDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("End date in YYYY-MM-DD format (optional)"),
    },
    async ({ tag, fromDate, toDate }) => {
      const query = [];
      if (fromDate) query.push(`fromdate=${encodeURIComponent(fromDate)}`);
      if (toDate) query.push(`todate=${encodeURIComponent(toDate)}`);
      if (tag) query.push(`tag=${encodeURIComponent(tag)}`);

      const url = `https://api.postmarkapp.com/stats/outbound${
        query.length ? "?" + query.join("&") : ""
      }`;

      console.error("Fetching delivery stats...");

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN,
        },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.error("Stats retrieved successfully");

      const sent = data.Sent || 0;
      const tracked = data.Tracked || 0;
      const uniqueOpens = data.UniqueOpens || 0;
      const totalTrackedLinks = data.TotalTrackedLinksSent || 0;
      const uniqueLinksClicked = data.UniqueLinksClicked || 0;

      const openRate =
        tracked > 0 ? ((uniqueOpens / tracked) * 100).toFixed(1) : "0.0";
      const clickRate =
        totalTrackedLinks > 0
          ? ((uniqueLinksClicked / totalTrackedLinks) * 100).toFixed(1)
          : "0.0";

      return {
        content: [
          {
            type: "text",
            text:
              `Email Statistics Summary\n\n` +
              `Sent: ${sent} emails\n` +
              `Open Rate: ${openRate}% (${uniqueOpens}/${tracked} tracked emails)\n` +
              `Click Rate: ${clickRate}% (${uniqueLinksClicked}/${totalTrackedLinks} tracked links)\n\n` +
              `${
                fromDate || toDate
                  ? `Period: ${fromDate || "start"} to ${toDate || "now"}\n`
                  : ""
              }` +
              `${tag ? `Tag: ${tag}\n` : ""}`,
          },
        ],
      };
    }
  );

  /**
   * Lists template categories from the specified directory and returns a formatted response.
   *
   * This function:
   * 1. Logs the process of listing template categories.
   * 2. Checks if any categories are found.
   * 3. Returns a response with either a list of categories or a message indicating no categories were found.
   *
   * @returns {Promise<Object>} An object with a `content` property, which is an array containing:
   *   - A text message listing the categories if found.
   *   - A text message indicating no categories were found if the directory is empty or does not exist.
   */
  server.tool("listTemplateCategories", {}, async () => {
    const templatesBasePath = join(
      __dirname,
      "postmark-templates",
      "templates-inlined"
    );
    console.error("Listing template categories...");

    const categories = await listTemplateCategories(templatesBasePath);
    console.error(`Found ${categories.length} template categories`);

    if (categories.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No template categories found. The postmark-templates/templates-inlined directory may not exist or may be empty.",
          },
        ],
      };
    }

    const categoryList = categories.map((cat) => `• ${cat}`).join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${categories.length} template categories:\n\n${categoryList}`,
        },
      ],
    };
  });

  /**
   * Lists templates in a specified category from the templates-inlined directory.
   *
   * @param {string} categoryName - The name of the category to list templates from.
   * @returns {Promise<Object>} An object containing the result:
   *   - If no templates are found, returns a message indicating the category is empty or does not exist.
   *   - If templates are found, returns a formatted list of templates in the category.
   * @throws {Error} If there is an issue reading the directory or listing templates.
   */
  server.tool(
    "listTemplatesInCategory",
    {
      categoryName: z
        .string()
        .describe("The name of the template category to list templates from"),
    },
    async ({ categoryName }) => {
      const templatesBasePath = join(
        __dirname,
        "postmark-templates",
        "templates-inlined"
      );
      console.error(`Listing templates in category: ${categoryName}`);

      const templates = await listTemplatesInCategory(
        templatesBasePath,
        categoryName
      );
      console.error(
        `Found ${templates.length} templates in category '${categoryName}'`
      );

      if (templates.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No templates found in category '${categoryName}'. The category may not exist or may be empty.`,
            },
          ],
        };
      }

      const templateList = templates
        .map((template) => `• ${template}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${templates.length} templates in category '${categoryName}':\n\n${templateList}`,
          },
        ],
      };
    }
  );

  /**
   * Retrieves the content of a Postmark template in the specified format (HTML or text).
   *
   * @param {Object} params - Parameters for fetching the template.
   * @param {string} params.categoryName - The category name of the template.
   * @param {string} params.templateName - The name of the template.
   * @param {string} [params.format='html'] - The format of the template content ('html' or 'text').
   *
   * @returns {Promise<Object>} An object containing the template content or an error message:
   * - If the format is invalid, returns an error message.
   * - If the template content is not found, returns an error message.
   * - If successful, returns the template content in the specified format.
   */
  server.tool(
    "getTemplateContent",
    {
      categoryName: z.string().describe("The name of the template category"),
      templateName: z.string().describe("The name of the template"),
      format: z
        .string()
        .optional()
        .describe("The format to retrieve: 'html' or 'text' (default: 'html')"),
    },
    async ({ categoryName, templateName, format = "html" }) => {
      const templatesBasePath = join(
        __dirname,
        "postmark-templates",
        "templates-inlined"
      );
      console.error(
        `Getting template content: ${categoryName}/${templateName} (format: ${format})`
      );

      // Validate format parameter
      if (format !== "html" && format !== "text") {
        return {
          content: [
            {
              type: "text",
              text: `Invalid format '${format}'. Please use 'html' or 'text'.`,
            },
          ],
        };
      }

      const content = await getTemplateContent(
        templatesBasePath,
        categoryName,
        templateName,
        format
      );

      if (content === null) {
        return {
          content: [
            {
              type: "text",
              text: `Template ${format} content for '${templateName}' in category '${categoryName}' not found.`,
            },
          ],
        };
      }

      console.error(
        `Successfully retrieved ${format} content for template '${templateName}'`
      );

      return {
        content: [
          {
            type: "text",
            text: `Template content for '${templateName}' in category '${categoryName}' (${format} format):\n\n\`\`\`${format}\n${content}\n\`\`\``,
          },
        ],
      };
    }
  );

  /**
   * Searches for template ideas based on a given topic and returns formatted results.
   *
   * @param {string} topic - The topic to search for template ideas.
   * @returns {Promise<Object>} An object containing the search results, formatted as a list of template ideas.
   * @property {Array<Object>} content - The content of the response, including the formatted text.
   * @property {string} content[].type - The type of content (e.g., "text").
   * @property {string} content[].text - The formatted text containing the template ideas.
   *
   * @example
   * // Returns a list of template ideas for the topic "marketing"
   * await searchTemplateIdeas("marketing");
   *
   * @throws Will log an error if no templates are found for the given topic.
   */
  server.tool(
    "getTemplateIdeas",
    {
      topic: z.string().describe("The topic to search for in template names"),
    },
    async ({ topic }) => {
      const templatesBasePath = join(
        __dirname,
        "postmark-templates",
        "templates-inlined"
      );
      console.error(`Searching for template ideas with topic: ${topic}`);

      const ideas = await getTemplateIdeas(templatesBasePath, topic);
      console.error(
        `Found ${ideas.length} template ideas for topic '${topic}'`
      );

      if (ideas.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No templates found matching the topic '${topic}'. Try a different search term.`,
            },
          ],
        };
      }

      const ideaList = ideas
        .map((idea) => `• **${idea.template}** (in category: ${idea.category})`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${ideas.length} template ideas for topic '${topic}':\n\n${ideaList}`,
          },
        ],
      };
    }
  );

  /**
   * Creates a new email template in Postmark.
   *
   * @param {Object} params - The parameters for creating the template.
   * @param {string} params.name - The name of the template.
   * @param {string} params.subject - The subject line of the email template.
   * @param {string} [params.htmlBody] - The HTML content of the email template (optional if textBody is provided).
   * @param {string} [params.textBody] - The plain text content of the email template (optional if htmlBody is provided).
   * @param {string} [params.alias] - An optional alias for the template.
   * @returns {Promise<Object>} A promise that resolves to an object containing the result of the template creation.
   * @throws {Error} Throws an error if neither htmlBody nor textBody is provided, or if the Postmark API returns an error.
   * @example
   * const result = await createTemplate({
   *   name: "Welcome Email",
   *   subject: "Welcome to our service!",
   *   htmlBody: "<h1>Welcome!</h1>",
   *   textBody: "Welcome to our service!",
   *   alias: "welcome-email"
   * });
   */
  server.tool(
    "createTemplate",
    {
      name: z.string().describe("Template name (required)"),
      subject: z.string().describe("Email subject (required)"),
      htmlBody: z
        .string()
        .optional()
        .describe(
          "HTML body of the template (optional if textBody is provided)"
        ),
      textBody: z
        .string()
        .optional()
        .describe(
          "Plain text body of the template (optional if htmlBody is provided)"
        ),
      alias: z
        .string()
        .optional()
        .describe("Template alias for easy reference (optional)"),
    },
    async ({ name, subject, htmlBody, textBody, alias }) => {
      // Validation: At least one of htmlBody or textBody must be provided
      if (!htmlBody && !textBody) {
        throw new Error("Either htmlBody or textBody must be provided");
      }

      console.error("Creating new template...", { name, subject, alias });

      try {
        const templateData = {
          Name: name,
          Subject: subject,
        };

        if (htmlBody) templateData.HtmlBody = htmlBody;
        if (textBody) templateData.TextBody = textBody;
        if (alias) templateData.Alias = alias;

        const result = await postmarkClient.createTemplate(templateData);
        console.error("Template created successfully:", result.TemplateId);

        return {
          content: [
            {
              type: "text",
              text:
                `Template created successfully!\n\n` +
                `Template ID: ${result.TemplateId}\n` +
                `Name: ${result.Name}\n` +
                `Subject: ${result.Subject}\n` +
                `Alias: ${result.Alias || "none"}\n` +
                `Active: ${result.Active ? "Yes" : "No"}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error creating template:", error);

        // Handle Postmark API errors
        if (error.code && error.message) {
          throw new Error(
            `Postmark API Error (${error.code}): ${error.message}`
          );
        }

        throw new Error(
          `Failed to create template: ${error.message || "Unknown error"}`
        );
      }
    }
  );

  /**
   * Updates an existing email template in Postmark.
   *
   * @param {string} templateIdOrAlias - The ID or alias of the template to update.
   * @param {string} [name] - The new name for the template (optional).
   * @param {string} [subject] - The new subject line for the template (optional).
   * @param {string} [htmlBody] - The new HTML content for the template (optional).
   * @param {string} [textBody] - The new plain text content for the template (optional).
   * @param {string} [alias] - The new alias for the template (optional).
   * @returns {Promise<Object>} - A promise that resolves to an object containing the updated template details.
   * @throws {Error} - Throws an error if no fields are provided for update or if the update fails.
   */
  server.tool(
    "updateTemplate",
    {
      templateIdOrAlias: z.string().describe("Template ID or alias to update"),
      name: z.string().optional().describe("New template name (optional)"),
      subject: z.string().optional().describe("New email subject (optional)"),
      htmlBody: z
        .string()
        .optional()
        .describe("New HTML body of the template (optional)"),
      textBody: z
        .string()
        .optional()
        .describe("New plain text body of the template (optional)"),
      alias: z.string().optional().describe("New template alias (optional)"),
    },
    async ({ templateIdOrAlias, name, subject, htmlBody, textBody, alias }) => {
      console.error("Updating template...", {
        templateIdOrAlias,
        name,
        subject,
        alias,
      });

      try {
        const updateData = {};

        if (name !== undefined) updateData.Name = name;
        if (subject !== undefined) updateData.Subject = subject;
        if (htmlBody !== undefined) updateData.HtmlBody = htmlBody;
        if (textBody !== undefined) updateData.TextBody = textBody;
        if (alias !== undefined) updateData.Alias = alias;

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
          throw new Error("At least one field must be provided to update");
        }

        const result = await postmarkClient.editTemplate(
          templateIdOrAlias,
          updateData
        );
        console.error("Template updated successfully:", result.TemplateId);

        return {
          content: [
            {
              type: "text",
              text:
                `Template updated successfully!\n\n` +
                `Template ID: ${result.TemplateId}\n` +
                `Name: ${result.Name}\n` +
                `Subject: ${result.Subject}\n` +
                `Alias: ${result.Alias || "none"}\n` +
                `Active: ${result.Active ? "Yes" : "No"}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error updating template:", error);

        // Handle Postmark API errors
        if (error.code && error.message) {
          throw new Error(
            `Postmark API Error (${error.code}): ${error.message}`
          );
        }

        throw new Error(
          `Failed to update template: ${error.message || "Unknown error"}`
        );
      }
    }
  );

  /**
   * Deletes a template from Postmark by its ID or alias.
   *
   * @param {string} templateIdOrAlias - The ID or alias of the template to delete.
   * @returns {Promise<Object>} An object containing the deletion result and a user-friendly message.
   * @throws {Error} If the deletion fails, an error is thrown with details about the failure.
   *
   * @example
   * // Example usage:
   * deleteTemplate('12345').then(result => console.log(result));
   *
   * @description
   * This function logs the deletion process for auditing purposes and returns a formatted message
   * indicating the success or failure of the deletion. If the deletion fails, it throws an error
   * with details from the Postmark API or a generic error message.
   */
  server.tool(
    "deleteTemplate",
    {
      templateIdOrAlias: z.string().describe("Template ID or alias to delete"),
    },
    async ({ templateIdOrAlias }) => {
      console.error("Deleting template...", { templateIdOrAlias });

      try {
        const result = await postmarkClient.deleteTemplate(templateIdOrAlias);

        // Log the deletion event for auditing purposes
        console.error(`Template ${templateIdOrAlias} deleted successfully.`);

        return {
          content: [
            {
              type: "text",
              text:
                `Template deleted successfully!\n\n` +
                `Template ID/Alias: ${templateIdOrAlias}\n` +
                `Status: ${result.Message || "Deleted"}\n\n` +
                `Note: This action has been logged for auditing purposes.`,
            },
          ],
        };
      } catch (error) {
        console.error("Error deleting template:", error);

        // Handle Postmark API errors
        if (error.code && error.message) {
          throw new Error(
            `Postmark API Error (${error.code}): ${error.message}`
          );
        }

        throw new Error(
          `Failed to delete template: ${error.message || "Unknown error"}`
        );
      }
    }
  );

  /**
   * Simulates pushing templates from a source Postmark server to a destination server without making actual changes.
   * This function performs a dry-run to show what templates would be affected by the push operation.
   *
   * @param {string} sourceServerID - The ID of the source Postmark server from which templates will be pushed.
   * @param {string} destinationServerID - The ID of the destination Postmark server to which templates will be pushed.
   * @returns {Promise<Object>} - An object containing the simulation results, including:
   *   - content: An array of text objects with detailed information about the simulation.
   * @throws {Error} - Throws an error if:
   *   - The `POSTMARK_ACCOUNT_TOKEN` environment variable is missing.
   *   - The API request to Postmark fails.
   *
   * @example
   * const result = await simulateTemplatePush('source123', 'destination456');
   * console.log(result.content[0].text);
   */

  server.tool(
    "simulateTemplatePush",
    {
      sourceServerID: z
        .string()
        .describe("Server ID of the source server containing the templates"),
      destinationServerID: z
        .string()
        .describe(
          "Server ID of the destination server receiving the templates"
        ),
    },
    async ({ sourceServerID, destinationServerID }) => {
      if (!process.env.POSTMARK_ACCOUNT_TOKEN) {
        throw new Error(
          "POSTMARK_ACCOUNT_TOKEN environment variable is required for template push operations"
        );
      }

      console.error("Simulating template push...", {
        sourceServerID,
        destinationServerID,
      });

      try {
        const response = await fetch(
          "https://api.postmarkapp.com/templates/push",
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Postmark-Account-Token": process.env.POSTMARK_ACCOUNT_TOKEN,
            },
            body: JSON.stringify({
              SourceServerID: sourceServerID,
              DestinationServerID: destinationServerID,
              PerformChanges: false,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Postmark API Error (${response.status}): ${
              errorData.Message || response.statusText
            }`
          );
        }

        const result = await response.json();
        console.error(
          `Template push simulation completed. ${result.TotalCount} templates would be affected.`
        );

        const templatesList = result.Templates.map(
          (t) =>
            `• **${t.Name}** (${t.Alias || "no alias"})\n  - Action: ${
              t.Action
            }\n  - Type: ${t.TemplateType}\n  - Template ID: ${
              t.TemplateId || "N/A"
            }`
        ).join("\n\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Template Push Simulation Results\n\n` +
                `Source Server ID: ${sourceServerID}\n` +
                `Destination Server ID: ${destinationServerID}\n` +
                `Total Templates Affected: ${result.TotalCount}\n\n` +
                `${
                  result.TotalCount > 0
                    ? `Templates that would be affected:\n\n${templatesList}`
                    : "No templates would be affected."
                }\n\n` +
                `Note: This was a simulation only. No changes were made.`,
            },
          ],
        };
      } catch (error) {
        console.error("Error simulating template push:", error);
        throw new Error(
          `Failed to simulate template push: ${
            error.message || "Unknown error"
          }`
        );
      }
    }
  );

  /**
   * Executes a push operation to transfer templates from a source Postmark server to a destination server.
   * This function performs the actual changes to the destination server.
   *
   * @param {string} sourceServerID - The ID of the source Postmark server from which templates will be pushed.
   * @param {string} destinationServerID - The ID of the destination Postmark server to which templates will be pushed.
   * @returns {Promise<Object>} - An object containing the execution results, including:
   *   - content: An array of text objects with detailed information about the execution.
   * @throws {Error} - Throws an error if:
   *   - The `POSTMARK_ACCOUNT_TOKEN` environment variable is missing.
   *   - The API request to Postmark fails.
   *
   * @example
   * const result = await executeTemplatePush('source123', 'destination456');
   * console.log(result.content[0].text);
   */
  server.tool(
    "executeTemplatePush",
    {
      sourceServerID: z
        .string()
        .describe("Server ID of the source server containing the templates"),
      destinationServerID: z
        .string()
        .describe(
          "Server ID of the destination server receiving the templates"
        ),
    },
    async ({ sourceServerID, destinationServerID }) => {
      if (!process.env.POSTMARK_ACCOUNT_TOKEN) {
        throw new Error(
          "POSTMARK_ACCOUNT_TOKEN environment variable is required for template push operations"
        );
      }

      console.error("Executing template push...", {
        sourceServerID,
        destinationServerID,
      });

      try {
        const response = await fetch(
          "https://api.postmarkapp.com/templates/push",
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Postmark-Account-Token": process.env.POSTMARK_ACCOUNT_TOKEN,
            },
            body: JSON.stringify({
              SourceServerID: sourceServerID,
              DestinationServerID: destinationServerID,
              PerformChanges: true,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Postmark API Error (${response.status}): ${
              errorData.Message || response.statusText
            }`
          );
        }

        const result = await response.json();
        console.error(
          `Template push executed successfully. ${result.TotalCount} templates were processed.`
        );

        const templatesList = result.Templates.map(
          (t) =>
            `• **${t.Name}** (${t.Alias || "no alias"})\n  - Action: ${
              t.Action
            }\n  - Type: ${t.TemplateType}\n  - Template ID: ${
              t.TemplateId || "N/A"
            }`
        ).join("\n\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Template Push Execution Results\n\n` +
                `Source Server ID: ${sourceServerID}\n` +
                `Destination Server ID: ${destinationServerID}\n` +
                `Total Templates Processed: ${result.TotalCount}\n\n` +
                `${
                  result.TotalCount > 0
                    ? `Templates that were processed:\n\n${templatesList}`
                    : "No templates were processed."
                }\n\n` +
                `Note: Changes have been applied to the destination server.`,
            },
          ],
        };
      } catch (error) {
        console.error("Error executing template push:", error);
        throw new Error(
          `Failed to execute template push: ${error.message || "Unknown error"}`
        );
      }
    }
  );
}

// Start the server unless running under Vitest
if (!process.env.VITEST) {
  main().catch((error) => {
    console.error("💥 Failed to start server:", error.message);
    process.exit(1);
  });
}
