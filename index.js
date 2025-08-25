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
import { logger } from "./src/logger.js";

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
 * @returns {Promise<{ok: boolean, categories?: string[], code?: string, message?: string}>}
 */
export async function listTemplateCategories(directoryPath) {
  try {
    return await listTemplateCategoriesImpl(directoryPath);
  } catch (error) {
    logger.error("An error occurred while listing template categories", {
      message: error?.message,
      stack: error?.stack,
    });
    return { ok: false, code: 'UNEXPECTED_ERROR', message: `An unexpected error occurred: ${error?.message || String(error)}` };
  }
}

/**
 * Lists the names of all template sub-directories within a specific category directory.
 * @param {string} templatesBasePath The absolute path to the root templates folder.
 * @param {string} categoryName The name of the category to inspect.
 * @returns {Promise<{ok: boolean, templates?: string[], code?: string, message?: string}>}
 */
export async function listTemplatesInCategory(templatesBasePath, categoryName) {
  try {
    return await listTemplatesInCategoryImpl(templatesBasePath, categoryName);
  } catch (error) {
    logger.error("An error occurred while listing templates in category", {
      categoryName,
      message: error?.message,
      stack: error?.stack,
    });
    return { ok: false, code: 'UNEXPECTED_ERROR', message: `An unexpected error occurred: ${error?.message || String(error)}` };
  }
}

/**
 * Reads the content of a specific template file (HTML or text).
 * @param {string} templatesBasePath The absolute path to the root templates folder.
 * @param {string} categoryName The name of the category.
 * @param {string} templateName The name of the template.
 * @param {string} format The format to retrieve ('html' or 'text').
 * @returns {Promise<{ok: boolean, content?: string, code?: string, message?: string}>}
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
    logger.error("An error occurred while reading template content", {
      categoryName,
      templateName,
      format,
      message: error?.message,
      stack: error?.stack,
    });
    return { ok: false, code: 'UNEXPECTED_ERROR', message: `An unexpected error occurred: ${error?.message || String(error)}` };
  }
}

/**
 * Searches across all template categories and names to find templates matching a given topic.
 * @param {string} templatesBasePath The absolute path to the root templates folder.
 * @param {string} topic The topic to search for.
 * @returns {Promise<{ok: boolean, ideas?: Array<{category: string, template: string}>, code?: string, message?: string}>}
 */
export async function getTemplateIdeas(templatesBasePath, topic) {
  try {
    return await getTemplateIdeasImpl(templatesBasePath, topic);
  } catch (error) {
    logger.error("An error occurred while searching for template ideas", {
      topic,
      message: error?.message,
      stack: error?.stack,
    });
    return { ok: false, code: 'UNEXPECTED_ERROR', message: `An unexpected error occurred: ${error?.message || String(error)}` };
  }
}

// Global error handlers
/**
 * Handles uncaught exceptions by logging the error message and exiting the process.
 * This ensures that unhandled errors do not leave the application in an undefined state.
 * @param {Error} error - The uncaught exception object.
 */
async function handleGlobalError(errorOrReason, eventType) {
  try {
    const isError = errorOrReason instanceof Error;
    const errorDetails = isError
      ? {
          name: errorOrReason.name,
          message: errorOrReason.message,
          stack: errorOrReason.stack,
          cause:
            errorOrReason.cause instanceof Error
              ? {
                  name: errorOrReason.cause.name,
                  message: errorOrReason.cause.message,
                  stack: errorOrReason.cause.stack,
                }
              : errorOrReason.cause,
        }
      : { reason: errorOrReason };

    logger.error("Global error", {
      event: eventType,
      pid: process.pid,
      node: process.version,
      platform: process.platform,
      uptimeSec: Number(process.uptime().toFixed(3)),
      ...errorDetails,
    });

    if (globalThis.__mcpServer && typeof globalThis.__mcpServer.disconnect === "function") {
      try {
        await globalThis.__mcpServer.disconnect();
        logger.warn("Server disconnected from global error handler");
      } catch (shutdownError) {
        logger.error("Failed to disconnect server during global error handling", {
          name: shutdownError?.name,
          message: shutdownError?.message,
          stack: shutdownError?.stack,
        });
      } finally {
        globalThis.__mcpServer = undefined;
      }
    }
  } catch (logError) {
    // Last-resort fallback to ensure we still exit
    try {
      console.error("Global error handler failed:", logError?.message || logError);
    } catch {}
  } finally {
    process.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  void handleGlobalError(error, "uncaughtException");
});
/**
 * Handles unhandled promise rejections by logging the error message or reason
 * and exiting the process with an error code.
 * @param {Error|any} reason - The rejection reason, which can be an Error object or any other value.
 */
process.on("unhandledRejection", (reason) => {
  void handleGlobalError(reason, "unhandledRejection");
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
