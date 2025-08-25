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
    globalThis.__mcpServer = server;
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
    globalThis.__mcpServer = undefined;
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
process.on("uncaughtException", async (error) => {
  console.error("Uncaught exception:", error.message);
  try {
    if (globalThis.__mcpServer && typeof globalThis.__mcpServer.disconnect === "function") {
      await globalThis.__mcpServer.disconnect();
      globalThis.__mcpServer = undefined;
    }
  } finally {
    process.exit(1);
  }
});
/**
 * Handles unhandled promise rejections by logging the error message or reason
 * and exiting the process with an error code.
 * @param {Error|any} reason - The rejection reason, which can be an Error object or any other value.
 */
process.on("unhandledRejection", async (reason) => {
  console.error(
    "Unhandled rejection:",
    reason instanceof Error ? reason.message : reason
  );
  try {
    if (globalThis.__mcpServer && typeof globalThis.__mcpServer.disconnect === "function") {
      await globalThis.__mcpServer.disconnect();
      globalThis.__mcpServer = undefined;
    }
  } finally {
    process.exit(1);
  }
});

/**
 * Tool registrations are defined in src/tools/registerTools.js
 */

// Start the server unless running under Vitest
if (!process.env.VITEST) {
  main().catch((error) => {
    console.error("💥 Failed to start server:", error.message);
    process.exit(1);
  });
}
