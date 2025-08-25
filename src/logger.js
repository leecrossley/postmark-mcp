function serialize(message, meta) {
  const payload = { level: meta?.level || 'info', msg: String(message), ts: new Date().toISOString() };
  if (meta && typeof meta === 'object') {
    const { level, ...rest } = meta;
    Object.assign(payload, rest);
  }
  return JSON.stringify(payload);
}

export const logger = {
  info(message, meta) {
    console.log(serialize(message, { ...meta, level: 'info' }));
  },
  warn(message, meta) {
    console.warn(serialize(message, { ...meta, level: 'warn' }));
  },
  error(message, meta) {
    console.error(serialize(message, { ...meta, level: 'error' }));
  },
  debug(message, meta) {
    if (process.env.DEBUG) console.log(serialize(message, { ...meta, level: 'debug' }));
  },
};


