import type { Page } from '@playwright/test';

/** Mock POST /api/penny/stream — returns a minimal SSE sequence. */
export async function mockPennyStream(page: Page): Promise<void> {
  await page.route('**/api/penny/stream', (route) => {
    // Backend _sse_format JSON-encodes data; for a token the payload is a JSON string.
    // PennyPanel: data = JSON.parse(ev.data) → string, then String(data) = the string.
    const body = [
      'event: token\ndata: "Your savings rate looks healthy."\n\n',
      'event: done\ndata: {}\n\n',
    ].join('');
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body,
    });
  });
}

/** Available for specs that call /api/simulate/* endpoints. */
/** Mock all /api/simulate/* endpoints — return empty-but-valid shapes. */
export async function mockSimulate(page: Page): Promise<void> {
  await page.route('**/api/simulate/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}
