# Postmark MCP Server

An MCP server implementation for Postmark email services.

## Features
- Exposes a Model Context Protocol (MCP) server for sending emails via Postmark
- Simple configuration via environment variables
- Comprehensive error handling and graceful shutdown
- Secure logging practices (no sensitive data exposure)
- Automatic email tracking configuration

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
   | DEFAULT_SENDER_EMAIL   | Default sender email address                     | Yes      |
   | DEFAULT_MESSAGE_STREAM | Postmark message stream (e.g., 'outbound')      | Yes      |

4. **Run the server:**
   ```sh
   npm start
   ```

## Quick Install via Cursor Deeplink

You can quickly install this MCP server in Cursor by clicking the following link:

[Add Postmark MCP Server to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=Postmark&config=eyJjb21tYW5kIjoibm9kZSIsImFyZ3MiOlsiaW5kZXguanMiXSwiZW52Ijp7IlBPU1RNQVJLX1NFUlZFUl9UT0tFTiI6IiIsIkRFRkFVTFRfU0VOREVSX0VNQUlMIjoiIiwiREVGQVVMVF9NRVNTQUdFX1NUUkVBTSI6Im91dGJvdW5kIn19)

> **Note**: After clicking the link, you'll need to:
> 1. Set your `POSTMARK_SERVER_TOKEN` in the MCP configuration
> 2. Set your `DEFAULT_SENDER_EMAIL` in the MCP configuration
> 3. Optionally customize the `DEFAULT_MESSAGE_STREAM` (defaults to "outbound")

## Tool Reference

This section provides a complete reference for the Postmark MCP server tools, including example prompts and expected payloads for each.

### Table of Contents

- [Email Management Tools](#email-management-tools)
  - [sendEmail](#1-sendemail)
  - [sendEmailWithTemplate](#2-sendemailwithtemplate)
- [Template Management Tools](#template-management-tools)
  - [listTemplates](#3-listtemplates)
- [Statistics & Tracking Tools](#statistics--tracking-tools)
  - [getDeliveryStats](#4-getdeliverystats)

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
✅ Email sent successfully!
📧 MessageID: message-id-here
👤 To: recipient@example.com
📝 Subject: Meeting Reminder
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
✅ Template email sent successfully!
📧 MessageID: message-id-here
👤 To: recipient@example.com
🎯 Template: template-id-or-alias-here
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

### 4. getDeliveryStats

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
📊 Email Statistics Summary

📤 Sent: 100 emails
👁️ Open Rate: 45.5% (45/99 tracked emails)
🔗 Click Rate: 15.2% (15/99 tracked links)

📅 Period: 2025-05-01 to 2025-05-15
🏷️ Tag: marketing
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