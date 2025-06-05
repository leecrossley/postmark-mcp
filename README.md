# Postmark MCP Server

An MCP server implementation for Postmark email services.

## Features
- Exposes a Model Context Protocol (MCP) server for sending emails via Postmark
- Simple configuration via environment variables

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

   | Variable                | Description                                               | Required |
   |------------------------|-----------------------------------------------------------|----------|
   | POSTMARK_SERVER_TOKEN  | Your Postmark server API token                            | Yes      |
   | DEFAULT_SENDER_EMAIL   | Default sender email address                              | Yes      |
   | DEFAULT_MESSAGE_STREAM | Postmark message stream (defaults to 'outbound' if unset) | No       |

4. **Run the server:**
   ```sh
   node index.js
   ```

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
  - [getOutboundMessages](#5-getoutboundmessages)

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
Send an email with Postmark template alias "welcome" to customer@example.com. Use the following template variables:
- product_url: https://myfakeapp.com
- product_name: MyFakeApp
- name: John Doe
- action_url: https://myfakeapp.com/register
- login_url: https://myfakeapp.com/login
- username: johndoe
- trial_length: 30 days
- trial_start_date: 2025-06-01
- trial_end_date: 2025-07-01
- support_email: info@myfakeapp.com
- live_chat_url: https://myfakeapp.com/chat
- sender_name: MyFakeApp Team
- help_url: https://myfakeapp.com/help
- company_name: MyFakeApp
- company_address: 123 Main St, Anytown, USA
```

**Expected Payload:**
```json
{
  "to": "customer@example.com",
  "templateId": 12345, // Either templateId or templateAlias must be provided, but not both
  "templateAlias": "welcome", // Either templateId or templateAlias must be provided, but not both
  "templateModel": {
    "product_url": "https://myfakeapp.com",
    "product_name": "MyFakeApp",
    "name": "John Doe",
    "action_url": "https://myfakeapp.com/register",
    "login_url": "https://myfakeapp.com/login",
    "username": "johndoe",
    "trial_length": "30 days",
    "trial_start_date": "2025-06-01",
    "trial_end_date": "2025-07-01",
    "support_email": "info@myfakeapp.com",
  },
  "from": "sender@example.com", // Optional, uses DEFAULT_SENDER_EMAIL if not provided
  "tag": "orders" // Optional
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

Lists all available templates. Returns template IDs, aliases, and subjects.

**Example Prompt:**
```
Show me a list of all the email templates available in our Postmark account.
```

**Expected Payload:**
```json
{
  "random_string": "any" // Required dummy parameter
}
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

The response includes:
- Total number of templates
- For each template:
  - Template name
  - Template ID
  - Template alias (used for referencing in sendEmailWithTemplate)
  - Subject line (if predefined)

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
  "fromDate": "2025-05-01", // Must be in YYYY-MM-DD format
  "toDate": "2025-06-01", // Must be in YYYY-MM-DD format
  "messageStream": "outbound" // Optional
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

## Combined Operation Examples

### Email Campaign Analysis:

**Example Prompt:**
```
Help me analyze our email campaign performance:
1. First, list all our available templates
2. Then, check our delivery statistics from 2025-05-01 to 2025-06-01 for the "welcome-email" tag
```

**Expected Payloads (Sequential):**

1. listTemplates:
```json
{
  "random_string": "any"
}
```

2. getDeliveryStats:
```json
{
  "fromDate": "2025-04-20",
  "toDate": "2025-05-20"
}
```

## Implementation Notes

- All emails are automatically configured with:
  - `TrackOpens: true`
  - `TrackLinks: "HtmlAndText"`
  - Message stream is set to the value of `DEFAULT_MESSAGE_STREAM` (defaults to 'outbound')
- These settings are not configurable via the API to ensure consistent tracking and delivery.
- All tool responses include formatted success messages with relevant details:
  - For email sending: MessageID, recipient, and subject
  - For template listing: Total count and details of each template
  - For statistics: Formatted summary with open rates, click rates, and date ranges

---

*This document serves as a reference for the Postmark MCP server tools. For more information about Postmark API, visit [Postmark's Developer Documentation](https://postmarkapp.com/developer).* 