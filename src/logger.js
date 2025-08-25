import { inspect } from 'util';

function safeStringify(object) {
  try {
    const seen = new WeakSet();
    return JSON.stringify(object, (key, value) => {
      // Handle primitives and simple types
      if (typeof value === 'bigint') return value.toString();
      if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
      if (typeof value === 'symbol') return value.toString();

      // Error instances
      if (value instanceof Error) {
        return { name: value.name, message: value.message, stack: value.stack };
      }

      // Node buffers
      if (value && typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value)) {
        return `Buffer(${value.length})`;
      }

      // Dates and regexps
      if (value instanceof Date) return value.toISOString();
      if (value instanceof RegExp) return value.toString();

      // Maps/Sets
      if (value instanceof Map) return { type: 'Map', entries: Array.from(value.entries()) };
      if (value instanceof Set) return { type: 'Set', values: Array.from(value.values()) };

      // Circular references
      if (value && typeof value === 'object') {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }

      return value;
    });
  } catch (err) {
    // Fallback: never throw from logger
    try {
      return JSON.stringify({ error: 'LoggerSerializationError', reason: String(err && err.message || err), snapshot: inspect(object, { depth: 2 }) });
    } catch {
      return '{"level":"error","msg":"Logger serialization failed"}';
    }
  }
}

function serialize(message, meta) {
  const payload = { level: meta?.level || 'info', msg: String(message), ts: new Date().toISOString() };
  if (meta && typeof meta === 'object') {
    const { level, ...rest } = meta;
    Object.assign(payload, rest);
  }
  return safeStringify(payload);
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


