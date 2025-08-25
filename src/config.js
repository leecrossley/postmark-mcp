import { join } from 'path';

function getEnv(name, options = { required: false, fallback: undefined }) {
  const value = process.env[name];
  if (value && value.trim().length > 0) return value;
  if (options.required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return options.fallback;
}

export function getTemplatesBasePath() {
  const override = getEnv('POSTMARK_TEMPLATES_PATH') || getEnv('TEMPLATES_BASE_PATH');
  return override || join(process.cwd(), 'postmark-templates', 'templates-inlined');
}

export function getConfig() {
  const serverToken = getEnv('POSTMARK_SERVER_TOKEN', { required: true });
  const defaultSender = getEnv('DEFAULT_SENDER_EMAIL', { required: true });
  const defaultMessageStream = getEnv('DEFAULT_MESSAGE_STREAM', { required: true });
  const accountToken = getEnv('POSTMARK_ACCOUNT_TOKEN', { required: false });
  const templatesBasePath = getTemplatesBasePath();

  return {
    postmark: {
      serverToken,
      accountToken,
    },
    emailDefaults: {
      defaultSender,
      defaultMessageStream,
    },
    templatesBasePath,
  };
}


