import type { Page } from '@playwright/test';

/** Mock POST /api/penny — returns a fixed non-streaming reply. */
export async function mockPenny(page: Page): Promise<void> {
  await page.route('**/api/penny', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply:
          'Your savings rate is 25%. Consider building your emergency fund to 6 months of expenses.',
      }),
    });
  });
}

/** Mock POST /api/penny/stream — returns a minimal SSE sequence. */
export async function mockPennyStream(page: Page): Promise<void> {
  await page.route('**/api/penny/stream', (route) => {
    const body = [
      'event: token\ndata: {"token":"Your savings rate looks healthy."}\n\n',
      'event: done\ndata: {}\n\n',
    ].join('');
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body,
    });
  });
}

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
