// MSW stub for PostHog (test-plan §10: PostHog stubbed at the HTTP layer; Voyage/Claude are
// fixtures, never live in CI). Import { server } in a suite and call server.listen()/resetHandlers()/close().
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Canonical-ish HogQL /query response shape (PostHog returns { columns, results } or { rows }).
export const posthogQueryHandler = http.post(
  '*/api/projects/:projectId/query/',
  async () => {
    return HttpResponse.json({
      columns: ['event', 'count'],
      results: [
        ['Page Viewed', 1240],
        ['Donate Completed', 312],
        ['Share Clicked', 488],
      ],
    });
  },
);

// posthog-js capture endpoint (browser) — swallow so unit/component tests don't make real calls.
export const posthogCaptureHandler = http.post('*/e/', () => new HttpResponse(null, { status: 200 }));
export const posthogDecideHandler = http.post('*/decide/*', () =>
  HttpResponse.json({ featureFlags: {}, sessionRecording: false }),
);

export const handlers = [posthogQueryHandler, posthogCaptureHandler, posthogDecideHandler];

export const server = setupServer(...handlers);
