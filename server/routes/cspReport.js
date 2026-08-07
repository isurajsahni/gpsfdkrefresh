const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// CSP violation reports (F-07). Browsers POST these automatically when a CSP
// directive is violated. This endpoint only LOGS them for visibility — it never
// touches the database and returns 204 quickly, so it can't be turned into a
// write-amplification or DB-abuse vector.

// Reports can arrive in bursts (one per violation, per visitor). Cap them.
const cspReportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reports' },
});

// report-uri sends `application/csp-report`; the Reporting API (report-to) sends
// `application/reports+json`. The global express.json() only parses
// `application/json`, so this route needs its own parser for those types.
const parseReports = express.json({
  type: ['application/csp-report', 'application/reports+json', 'application/json'],
  limit: '50kb',
});

router.post('/', cspReportLimiter, parseReports, (req, res) => {
  try {
    const body = req.body;
    // report-to: array of { type, body }; report-uri: { "csp-report": {...} }
    const reports = Array.isArray(body)
      ? body.filter((r) => r && r.type === 'csp-violation').map((r) => r.body)
      : body && body['csp-report']
        ? [body['csp-report']]
        : [];
    for (const r of reports) {
      if (!r) continue;
      const directive =
        r['effective-directive'] || r.effectiveDirective ||
        r['violated-directive'] || r.violatedDirective || '?';
      const blocked = r['blocked-uri'] || r.blockedURL || '?';
      const doc = r['document-uri'] || r.documentURL || '?';
      // eslint-disable-next-line no-console
      console.warn(`[CSP] blocked "${blocked}" — directive "${directive}" on ${doc}`);
    }
  } catch {
    // Telemetry must never fail loudly.
  }
  // 204: nothing to return; keeps the browser's reporting path cheap.
  res.status(204).end();
});

module.exports = router;
