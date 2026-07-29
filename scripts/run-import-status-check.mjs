import { createServer } from 'vite';

globalThis.DOMParser = class DOMParser {
  parseFromString(value) {
    return {
      body: {
        textContent: String(value)
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      },
    };
  }
};

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

try {
  await server.ssrLoadModule('/scripts/check-import-status.ts');
} finally {
  await server.close();
}
