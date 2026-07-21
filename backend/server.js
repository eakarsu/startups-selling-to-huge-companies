require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/team', require('./routes/team'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/utils', require('./routes/utils'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 3014;
const HOST = process.env.HOST || '127.0.0.1';
app.use('/api/gap-ai-multi-threading-coach', require('./routes/gap-ai-multi-threading-coach'));
app.use('/api/gap-ai-procurement-decoder', require('./routes/gap-ai-procurement-decoder'));
app.use('/api/gap-ai-champion-identifier', require('./routes/gap-ai-champion-identifier'));
app.use('/api/gap-ai-budget-cycle-predictor', require('./routes/gap-ai-budget-cycle-predictor'));
app.use('/api/gap-ai-legal-review-automator', require('./routes/gap-ai-legal-review-automator'));
app.use('/api/gap-nonai-calendar-integration', require('./routes/gap-nonai-calendar-integration'));
app.use('/api/gap-nonai-email-sync', require('./routes/gap-nonai-email-sync'));
app.use('/api/gap-nonai-esign-integration', require('./routes/gap-nonai-esign-integration'));
app.use('/api/gap-nonai-revenue-forecast', require('./routes/gap-nonai-revenue-forecast'));
app.use('/api/gap-nonai-org-chart', require('./routes/gap-nonai-org-chart'));
app.use('/api/gap-nonai-call-recording', require('./routes/gap-nonai-call-recording'));
app.use('/api/cf-f100-playbook', require('./routes/cf-f100-playbook'));
app.use('/api/cf-champion-map', require('./routes/cf-champion-map'));
app.use('/api/cf-security-questionnaires', require('./routes/cf-security-questionnaires'));
app.use('/api/cf-msa-redlines', require('./routes/cf-msa-redlines'));
app.use('/api/cf-pilot-scorecards', require('./routes/cf-pilot-scorecards'));

// Deep features (2026-05-14) — DB-backed feature modules
app.use('/api/deep-msa-redlines', require('./routes/deep-msa-redlines'));
app.use('/api/deep-security-questionnaires', require('./routes/deep-security-questionnaires'));
app.use('/api/deep-champion-map', require('./routes/deep-champion-map'));
app.use('/api/deep-procurement-playbook', require('./routes/deep-procurement-playbook'));
app.use('/api/deep-pilot-scorecards', require('./routes/deep-pilot-scorecards'));
app.use('/api/deep-compliance-posture', require('./routes/deep-compliance-posture'));

// Health probe (no auth)
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Custom Views — MUST be mounted BEFORE the 404 handler
app.use('/api/custom-views', require('./routes/customViews'));

// 404 fallback for unmatched /api routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));

app.listen(PORT, HOST, () => console.log(`EnterpriseOS backend running at http://${HOST}:${PORT}`));
