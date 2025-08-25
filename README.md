# Postmark MCP Server

An MCP server implementation for Postmark email services.

## Features
- Exposes a Model Context Protocol (MCP) server for sending emails via Postmark
- Complete template management (CRUD operations)
- Local template file discovery and management
- **Template inspiration tools** - Access to Postmark's official email template library for LLM-powered design inspiration
- Template synchronization between Postmark servers
- Simple configuration via environment variables
- Comprehensive error handling and graceful shutdown
- Secure logging practices (no sensitive data exposure)
- Automatic email tracking configuration

## Feedback
We'd love to hear from you! Please share your feedback and suggestions through our [feedback form](https://forms.gle/zVdZLAJPM81Vo2Wh8).

## Requirements
- Node.js (v16 or higher recommended)
- A Postmark account and server token

## Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/ActiveCampaign/postmark-mcp
   cd postmark-mcp
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`:
     ```sh
     cp .env.example .env
     ```
   - Edit `.env` and fill in your Postmark credentials and settings.

   | Variable                | Description                                      | Required |
   |------------------------|--------------------------------------------------|----------|
   | POSTMARK_SERVER_TOKEN  | Your Postmark server API token                   | Yes      |
   | POSTMARK_ACCOUNT_TOKEN | Your Postmark account API token (for template push) | No*   |
   | DEFAULT_SENDER_EMAIL   | Default sender email address                     | Yes      |
   | DEFAULT_MESSAGE_STREAM | Postmark message stream (e.g., 'outbound')      | Yes      |

   *Required only for template push operations between servers

4. **Set up the Postmark Templates repository (for template inspiration tools):**

   The server includes tools that provide LLMs with access to Postmark's official email template library for inspiration. To enable these features:

   ```sh
   # Clone the official Postmark templates repository
   git clone https://github.com/ActiveCampaign/postmark-templates.git
   ```

   This will create a `postmark-templates` directory containing:
   - **Template Categories**: `basic`, `basic-full`, `plain`
   - **Template Types**: welcome, password-reset, receipt, invoice, user-invitation, and more
   - **Content Formats**: Both HTML (`content.html`) and plain text (`content.txt`) versions

   > **Note**: This step is optional. If you don't need the template inspiration tools (`getTemplateContent`, `getTemplateIdeas`, `listTemplateCategories`, `listTemplatesInCategory`), you can skip this step.

5. **Run the server:**
   ```sh
   npm start
   ```

6. **Run tests:**

   ```sh
   npm test
   # or watch mode
   npm run test:watch
   # coverage
   npm run coverage
   ```

## Quick Install via Cursor Deeplink

You can quickly install this MCP server in Cursor by clicking the following button:

<div>
  <a href="cursor://anysphere.cursor-deeplink/mcp/install?name=Postmark&config=eyJjb21tYW5kIjoibm9kZSIsImFyZ3MiOlsiaW5kZXguanMiXSwiZW52Ijp7IlBPU1RNQVJLX1NFUlZFUl9UT0tFTiI6IiIsIkRFRkFVTFRfU0VOREVSX0VNQUlMIjoiIiwiREVGQVVMVF9NRVNTQUdFX1NUUkVBTSI6Im91dGJvdW5kIn19">
    <img src="https://img.shields.io/badge/Add_Postmark_MCP_Server-to_Cursor-00A4DB?style=for-the-badge&logo=cursor&logoColor=white" alt="Add Postmark MCP Server to Cursor" />
  </a>
</div>

> **Note**: After clicking the button, you'll need to:
> 1. Set your `POSTMARK_SERVER_TOKEN` in the MCP configuration
> 2. Set your `DEFAULT_SENDER_EMAIL` in the MCP configuration
> 3. Set your `DEFAULT_MESSAGE_STREAM` in the MCP configuration (defaults to "outbound")

## Claude and Cursor MCP Configuration Example

```json
{
  "mcpServers": {
    "postmark": {
      "command": "node",
      "args": ["path/to/postmark-mcp/index.js"],
      "env": {
        "POSTMARK_SERVER_TOKEN": "your-postmark-server-token",
        "DEFAULT_SENDER_EMAIL": "your-sender-email@example.com",
        "DEFAULT_MESSAGE_STREAM": "your-message-stream"
      }
    }
  }
}
```

## Tool Reference

This section provides a complete reference for the Postmark MCP server tools, including example prompts and expected payloads for each.

### Table of Contents

- [Email Management Tools](#email-management-tools)
  - [sendEmail](#1-sendemail)
  - [sendEmailWithTemplate](#2-sendemailwithtemplate)
- [Template Management Tools](#template-management-tools)
  - [listTemplates](#3-listtemplates)
  - [createTemplate](#4-createtemplate)
  - [updateTemplate](#5-updatetemplate)
  - [deleteTemplate](#6-deletetemplate)
- [Local Template File Management](#local-template-file-management)
  - [listTemplateCategories](#7-listtemplatecategories)
  - [listTemplatesInCategory](#8-listtemplatesincategory)
- [Template Inspiration Tools](#template-inspiration-tools)
  - [getTemplateContent](#9-gettemplatecontent)
  - [getTemplateIdeas](#10-gettemplateIdeas)
- [Template Synchronization](#template-synchronization)
  - [simulateTemplatePush](#11-simulatetemplatepush)
  - [executeTemplatePush](#12-executetemplatepush)
- [Statistics & Tracking Tools](#statistics--tracking-tools)
  - [getDeliveryStats](#13-getdeliverystats)

## Email Management Tools

### 1. sendEmail

Sends a single text email.

**Example Prompt:**
```
Send an email using Postmark to recipient@example.com with the subject "Meeting Reminder" and the message "Don't forget our team meeting tomorrow at 2 PM. Please bring your quarterly statistics report (and maybe some snacks).""
```

**Expected Payload:**
```json
{
  "to": "recipient@example.com",
  "subject": "Meeting Reminder",
  "textBody": "Don't forget our team meeting tomorrow at 2 PM. Please bring your quarterly statistics report (and maybe some snacks).",
  "htmlBody": "HTML version of the email body", // Optional
  "from": "sender@example.com", // Optional, uses DEFAULT_SENDER_EMAIL if not provided
  "tag": "meetings" // Optional
}
```

**Response Format:**
```
Email sent successfully!
MessageID: message-id-here
To: recipient@example.com
Subject: Meeting Reminder
```

### 2. sendEmailWithTemplate

Sends an email using a pre-defined template.

**Example Prompt:**
```
Send an email with Postmark template alias "welcome" to customer@example.com with the following template variables:
{
  "name": "John Doe",
  "product_name": "MyApp",
  "login_url": "https://myapp.com/login"
}
```

**Expected Payload:**
```json
{
  "to": "customer@example.com",
  "templateId": 12345, // Either templateId or templateAlias must be provided, but not both
  "templateAlias": "welcome", // Either templateId or templateAlias must be provided, but not both
  "templateModel": {
    "name": "John Doe",
    "product_name": "MyApp",
    "login_url": "https://myapp.com/login"
  },
  "from": "sender@example.com", // Optional, uses DEFAULT_SENDER_EMAIL if not provided
  "tag": "onboarding" // Optional
}
```

**Response Format:**
```
Template email sent successfully!
MessageID: message-id-here
To: recipient@example.com
Template: template-id-or-alias-here
```

## Template Management Tools

### 3. listTemplates

Lists all available templates.

**Example Prompt:**
```
Show me a list of all the email templates available in our Postmark account.
```

**Response Format:**
```
📋 Found 2 templates:

• Basic
  - ID: 12345678
  - Alias: basic
  - Subject: none

• Welcome
  - ID: 02345679
  - Alias: welcome
  - Subject: none
```

## Statistics & Tracking Tools

### 13. getDeliveryStats

Retrieves email delivery statistics.

**Example Prompt:**
```
Show me our Postmark email delivery statistics from 2025-05-01 to 2025-05-15 for the "marketing" tag.
```

**Expected Payload:**
```json
{
  "tag": "marketing", // Optional
  "fromDate": "2025-05-01", // Optional, YYYY-MM-DD format
  "toDate": "2025-05-15" // Optional, YYYY-MM-DD format
}
```

**Response Format:**
```
Email Statistics Summary

Sent: 100 emails
Open Rate: 45.5% (45/99 tracked emails)
Click Rate: 15.2% (15/99 tracked links)

Period: 2025-05-01 to 2025-05-15
Tag: marketing
```

### 4. createTemplate

Creates a new email template in Postmark.

**Example Prompt:**
> "Create a new template called 'Welcome Email' with the subject 'Welcome to our service, {{name}}!' and HTML body '<h1>Welcome {{name}}!</h1><p>Thanks for joining us.</p>'"

**Parameters:**
- `name` (string, required): Template name
- `subject` (string, required): Email subject line
- `htmlBody` (string, optional): HTML content (required if textBody not provided)
- `textBody` (string, optional): Plain text content (required if htmlBody not provided)
- `alias` (string, optional): Template alias for easy reference

**Response Format:**
```
Template created successfully!

Template ID: 12345
Name: Welcome Email
Subject: Welcome to our service, {{name}}!
Alias: welcome-v1
Active: Yes
```

### 5. updateTemplate

Updates an existing email template in Postmark.

**Example Prompt:**
> "Update template 12345 to change the subject to 'Welcome aboard, {{name}}!'"

**Parameters:**
- `templateIdOrAlias` (string, required): Template ID or alias to update
- `name` (string, optional): New template name
- `subject` (string, optional): New email subject
- `htmlBody` (string, optional): New HTML content
- `textBody` (string, optional): New plain text content
- `alias` (string, optional): New template alias

**Response Format:**
```
Template updated successfully!

Template ID: 12345
Name: Welcome Email
Subject: Welcome aboard, {{name}}!
Alias: welcome-v1
Active: Yes
```

### 6. deleteTemplate

Deletes an email template from Postmark.

**Example Prompt:**
> "Delete template with ID 12345"

**Parameters:**
- `templateIdOrAlias` (string, required): Template ID or alias to delete

**Response Format:**
```
Template deleted successfully!

Template ID/Alias: 12345
Status: Deleted

Note: This action has been logged for auditing purposes.
```

## Local Template File Management

### 7. listTemplateCategories

Lists available template categories from the local `postmark-templates/templates-inlined` directory.

**Example Prompt:**
> "Show me all available template categories"

**Parameters:** None

**Response Format:**
```
Found 4 template categories:

• basic
• marketing
• receipts
• transactional
```

### 8. listTemplatesInCategory

Lists templates within a specific category directory.

**Example Prompt:**
> "Show me all templates in the transactional category"

**Parameters:**
- `categoryName` (string, required): Name of the category to list templates from

**Response Format:**
```
Found 2 templates in category 'transactional':

• order-confirmation
• password-reset
```

## Template Inspiration Tools

These tools provide LLMs with access to Postmark's official email template library for design inspiration and learning. They require the `postmark-templates` repository to be cloned (see setup instructions above).

### 9. getTemplateContent

Retrieves the HTML or plain text content of a specific template for analysis and inspiration.

**Example Prompt:**
> "Show me the HTML content of the welcome template from the basic category"

**Parameters:**
- `categoryName` (string, required): Template category (e.g., "basic", "basic-full", "plain")
- `templateName` (string, required): Template name (e.g., "welcome", "password-reset")
- `format` (string, optional): Content format - "html" or "text" (default: "html")

**Response Format:**
```
Template content for 'welcome' in category 'basic' (html format):

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"...
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ...
  </head>
  <body>
    ...
  </body>
</html>
```
```

### 10. getTemplateIdeas

Searches across all template categories and names to find templates matching a specific topic or keyword.

**Example Prompt:**
> "Find all templates related to password reset"

**Parameters:**
- `topic` (string, required): Search term to find in template names

**Response Format:**
```
Found 6 template ideas for topic 'password':

• **password-reset** (in category: basic)
• **password-reset-help** (in category: basic)
• **password-reset** (in category: basic-full)
• **password-reset-help** (in category: basic-full)
• **password-reset** (in category: plain)
• **password-reset-help** (in category: plain)
```

## Template Synchronization

### 11. simulateTemplatePush

Simulates pushing templates from one Postmark server to another without making changes.

**Example Prompt:**
> "Simulate pushing templates from server 12345 to server 67890"

**Parameters:**
- `sourceServerID` (string, required): Server ID containing the templates to push
- `destinationServerID` (string, required): Server ID to receive the templates

**Response Format:**
```
Template Push Simulation Results

Source Server ID: 12345
Destination Server ID: 67890
Total Templates Affected: 2

Templates that would be affected:

• Welcome Email (welcome-v1)
  - Action: Create
  - Type: Standard
  - Template ID: N/A

• Order Confirmation (order-confirm)
  - Action: Edit
  - Type: Standard
  - Template ID: 98765

Note: This was a simulation only. No changes were made.
```

### 12. executeTemplatePush

Executes the actual push of templates from one Postmark server to another.

**Example Prompt:**
> "Push templates from server 12345 to server 67890"

**Parameters:**
- `sourceServerID` (string, required): Server ID containing the templates to push
- `destinationServerID` (string, required): Server ID to receive the templates

**Response Format:**
```
Template Push Execution Results

Source Server ID: 12345
Destination Server ID: 67890
Total Templates Processed: 2

Templates that were processed:

• Welcome Email (welcome-v1)
  - Action: Create
  - Type: Standard
  - Template ID: 11111

• Order Confirmation (order-confirm)
  - Action: Edit
  - Type: Standard
  - Template ID: 98765

Note: Changes have been applied to the destination server.
```

## Implementation Details

### Automatic Configuration
All emails are automatically configured with:
- `TrackOpens: true`
- `TrackLinks: "HtmlAndText"`
- Message stream from `DEFAULT_MESSAGE_STREAM` environment variable

### Error Handling
The server implements comprehensive error handling:
- Validation of all required environment variables
- Graceful shutdown on SIGTERM and SIGINT
- Proper error handling for API calls
- No exposure of sensitive information in logs
- Consistent error message formatting

### Logging
- Uses appropriate log levels (`info` for normal operations, `error` for errors)
- Excludes sensitive information from logs
- Provides clear operation status and results

---

*For more information about the Postmark API, visit [Postmark's Developer Documentation](https://postmarkapp.com/developer).* 