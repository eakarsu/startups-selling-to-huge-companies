INSERT INTO users (email, password_hash, name, role) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year) VALUES
('Apple Inc.', 'Technology', 394.33, 164000, 'F10', 'https://apple.com', 'Cupertino', 'USA', 'AAPL', 1976),
('JPMorgan Chase', 'Financial Services', 154.79, 293723, 'F10', 'https://jpmorganchase.com', 'New York', 'USA', 'JPM', 1799),
('UnitedHealth Group', 'Healthcare', 371.62, 400000, 'F10', 'https://unitedhealthgroup.com', 'Minnetonka', 'USA', 'UNH', 1977),
('ExxonMobil', 'Energy', 398.68, 63000, 'F10', 'https://exxonmobil.com', 'Spring', 'USA', 'XOM', 1870),
('Amazon', 'Technology/Retail', 574.78, 1540000, 'F10', 'https://amazon.com', 'Seattle', 'USA', 'AMZN', 1994),
('Berkshire Hathaway', 'Conglomerate', 364.48, 396500, 'F10', 'https://berkshirehathaway.com', 'Omaha', 'USA', 'BRK.A', 1839),
('Walmart', 'Retail', 648.13, 2300000, 'F10', 'https://walmart.com', 'Bentonville', 'USA', 'WMT', 1945),
('CVS Health', 'Healthcare/Retail', 357.78, 300000, 'F10', 'https://cvshealth.com', 'Woonsocket', 'USA', 'CVS', 1963),
('McKesson', 'Healthcare Distribution', 308.95, 50000, 'F10', 'https://mckesson.com', 'Irving', 'USA', 'MCK', 1833),
('AmerisourceBergen', 'Healthcare Distribution', 259.18, 42000, 'F50', 'https://amerisourcebergen.com', 'Conshohocken', 'USA', 'ABC', 1985),
('Cigna', 'Healthcare', 195.27, 74000, 'F50', 'https://cigna.com', 'Bloomfield', 'USA', 'CI', 1792),
('AT&T', 'Telecommunications', 120.74, 160700, 'F50', 'https://att.com', 'Dallas', 'USA', 'T', 1983),
('Ford Motor Company', 'Automotive', 185.0, 177000, 'F50', 'https://ford.com', 'Dearborn', 'USA', 'F', 1903),
('General Motors', 'Automotive', 171.84, 163000, 'F50', 'https://gm.com', 'Detroit', 'USA', 'GM', 1908),
('Chevron', 'Energy', 200.94, 43846, 'F50', 'https://chevron.com', 'San Ramon', 'USA', 'CVX', 1879),
('Bank of America', 'Financial Services', 98.58, 216823, 'F50', 'https://bankofamerica.com', 'Charlotte', 'USA', 'BAC', 1998),
('Wells Fargo', 'Financial Services', 82.6, 234000, 'F100', 'https://wellsfargo.com', 'San Francisco', 'USA', 'WFC', 1852),
('Verizon', 'Telecommunications', 134.0, 117100, 'F50', 'https://verizon.com', 'New York', 'USA', 'VZ', 1983),
('Comcast', 'Media/Telecom', 121.43, 186000, 'F50', 'https://comcast.com', 'Philadelphia', 'USA', 'CMCSA', 1963),
('Phillips 66', 'Energy', 175.7, 14000, 'F50', 'https://phillips66.com', 'Houston', 'USA', 'PSX', 1917)
ON CONFLICT DO NOTHING;

INSERT INTO contacts (company_id, name, title, email, phone, decision_maker, relationship_strength, last_contacted) VALUES
(1, 'Sarah Mitchell', 'VP of Engineering', 'sarah.mitchell@apple.com', '+1-408-555-0101', true, 'champion', CURRENT_DATE - 5),
(1, 'James Chen', 'Director of Infrastructure', 'james.chen@apple.com', '+1-408-555-0102', false, 'warm', CURRENT_DATE - 12),
(2, 'Robert Winters', 'CTO', 'robert.winters@jpmorgan.com', '+1-212-555-0201', true, 'engaged', CURRENT_DATE - 3),
(2, 'Jennifer Park', 'VP Technology', 'jennifer.park@jpmorgan.com', '+1-212-555-0202', false, 'warm', CURRENT_DATE - 18),
(5, 'Michael Torres', 'SVP of Cloud Infrastructure', 'michael.torres@amazon.com', '+1-206-555-0501', true, 'sponsor', CURRENT_DATE - 1),
(5, 'Lisa Wang', 'Director of AI/ML', 'lisa.wang@amazon.com', '+1-206-555-0502', false, 'champion', CURRENT_DATE - 7),
(7, 'David Martinez', 'Chief Digital Officer', 'david.martinez@walmart.com', '+1-479-555-0701', true, 'engaged', CURRENT_DATE - 14),
(7, 'Amy Johnson', 'VP of Technology', 'amy.johnson@walmart.com', '+1-479-555-0702', false, 'warm', CURRENT_DATE - 21),
(13, 'Kevin Brown', 'CTO', 'kevin.brown@ford.com', '+1-313-555-1301', true, 'cold', CURRENT_DATE - 30),
(14, 'Patricia Lee', 'VP Digital Transformation', 'patricia.lee@gm.com', '+1-313-555-1401', true, 'warm', CURRENT_DATE - 8),
(18, 'Thomas Garcia', 'Director of Network Technology', 'thomas.garcia@verizon.com', '+1-212-555-1801', false, 'engaged', CURRENT_DATE - 5),
(3, 'Emily Davis', 'SVP Technology Innovation', 'emily.davis@uhg.com', '+1-952-555-0301', true, 'champion', CURRENT_DATE - 2),
(12, 'Christopher Wilson', 'VP Enterprise Technology', 'christopher.wilson@att.com', '+1-214-555-1201', true, 'warm', CURRENT_DATE - 20),
(16, 'Sandra Thompson', 'CIO', 'sandra.thompson@bofa.com', '+1-704-555-1601', true, 'engaged', CURRENT_DATE - 9),
(19, 'Daniel Harris', 'EVP Technology', 'daniel.harris@comcast.com', '+1-215-555-1901', true, 'cold', CURRENT_DATE - 45)
ON CONFLICT DO NOTHING;

INSERT INTO deals (company_id, title, value_usd, stage, probability, expected_close, owner_id, next_action, arr_usd) VALUES
(5, 'Amazon AWS AI Platform Integration', 28500000, 'negotiation', 75, CURRENT_DATE + 45, 1, 'Send revised pricing proposal', 9500000),
(1, 'Apple Enterprise Security Suite', 15200000, 'proposal', 60, CURRENT_DATE + 60, 1, 'Present ROI analysis to VP Engineering', 5066000),
(7, 'Walmart Digital Operations Platform', 42000000, 'legal_review', 85, CURRENT_DATE + 30, 1, 'Legal review - final contract negotiation', 14000000),
(2, 'JPMorgan AI Risk Analytics', 8900000, 'discovery', 35, CURRENT_DATE + 90, 1, 'Schedule deep-dive technical workshop', 2966000),
(3, 'UnitedHealth AI Claims Processing', 22000000, 'negotiation', 70, CURRENT_DATE + 35, 1, 'Address compliance requirements', 7333000),
(12, 'AT&T Network Intelligence Platform', 11500000, 'qualification', 25, CURRENT_DATE + 120, 1, 'Identify budget owner and timeline', 3833000),
(13, 'Ford Autonomous Systems Data Platform', 18700000, 'prospecting', 10, CURRENT_DATE + 180, 1, 'Send initial capabilities overview', 6233000),
(14, 'GM Manufacturing Analytics Suite', 9800000, 'discovery', 40, CURRENT_DATE + 85, 1, 'Run proof-of-concept on factory floor data', 3266000),
(16, 'Bank of America Fraud Detection AI', 31000000, 'proposal', 55, CURRENT_DATE + 55, 1, 'Customize proposal for BofA compliance requirements', 10333000),
(18, 'Verizon Network Optimization Platform', 16400000, 'qualification', 30, CURRENT_DATE + 100, 1, 'Technical assessment of current infrastructure', 5466000),
(9, 'McKesson Supply Chain AI', 24500000, 'negotiation', 80, CURRENT_DATE + 25, 1, 'Final pricing negotiation - CTO approval pending', 8166000),
(4, 'ExxonMobil Predictive Maintenance', 13200000, 'discovery', 45, CURRENT_DATE + 70, 1, 'Site visit to refineries scheduled', 4400000),
(11, 'Cigna Member Experience Platform', 7800000, 'closed_won', 100, CURRENT_DATE - 15, 1, 'Kickoff meeting scheduled', 2600000),
(8, 'CVS Health Analytics Dashboard', 4900000, 'closed_lost', 0, CURRENT_DATE - 30, 1, 'Lost to competitor - revisit in Q3', 0),
(19, 'Comcast Content Intelligence System', 6200000, 'prospecting', 15, CURRENT_DATE + 150, 1, 'Initial discovery call to schedule', 2066000)
ON CONFLICT DO NOTHING;

INSERT INTO activities (deal_id, contact_id, activity_type, subject, outcome, scheduled_at, completed_at, duration_mins, created_by) VALUES
(1, 5, 'meeting', 'Amazon AI Platform - Executive Business Review', 'Positive - proceed to legal', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 90, 1),
(1, 6, 'call', 'Technical architecture deep-dive', 'All technical requirements met', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 45, 1),
(2, 1, 'demo', 'Apple Security Suite Live Demo', 'Strong interest - wants pricing', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 60, 1),
(3, 7, 'meeting', 'Walmart Digital Platform - Legal Review Kickoff', 'Legal team engaged', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 120, 1),
(4, 3, 'call', 'JPMorgan Risk Analytics Discovery Call', 'Needs more technical detail', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 30, 1),
(5, 12, 'meeting', 'UHG Compliance Workshop', 'HIPAA requirements documented', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 180, 1),
(1, 5, 'email', 'Follow-up on revised pricing', 'Awaiting response', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 15, 1),
(9, 14, 'demo', 'BofA Fraud Detection Demo', 'Impressive results - advancing to proposal', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 75, 1),
(11, 9, 'meeting', 'McKesson Final Negotiation', 'Terms agreed, contract being drafted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 120, 1),
(2, 1, 'call', 'Pricing discussion - Apple', 'Budget confirmed at $15M range', NOW() + INTERVAL '3 days', NULL, 30, 1),
(6, 13, 'meeting', 'AT&T Initial Discovery', 'Multiple use cases identified', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 60, 1),
(8, 10, 'demo', 'GM Factory Analytics POC Kickoff', 'POC approved for 4 facilities', NOW() + INTERVAL '7 days', NULL, 90, 1),
(12, NULL, 'meeting', 'ExxonMobil Site Visit - Houston Refinery', 'Scheduled', NOW() + INTERVAL '14 days', NULL, 240, 1),
(7, NULL, 'email', 'Ford Capabilities Overview Sent', 'Email delivered, no response yet', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 20, 1),
(4, 3, 'call', 'JPMorgan - Budget and Timeline Clarification', 'Q2 budget confirmed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 25, 1)
ON CONFLICT DO NOTHING;

INSERT INTO sales_team (name, email, role, quota_usd, deals_won, revenue_closed, win_rate, avg_deal_size, active_deals, joined_date) VALUES
('Alex Rivera', 'alex.rivera@company.com', 'Strategic_AE', 25000000, 8, 18500000, 0.62, 2312500, 4, '2022-03-15'),
('Maria Chen', 'maria.chen@company.com', 'Senior_AE', 15000000, 12, 14200000, 0.71, 1183333, 5, '2021-07-01'),
('Jake Thompson', 'jake.thompson@company.com', 'AE', 8000000, 6, 5800000, 0.55, 966666, 3, '2023-01-10'),
('Sofia Patel', 'sofia.patel@company.com', 'Strategic_AE', 25000000, 5, 22000000, 0.58, 4400000, 3, '2020-09-20'),
('Marcus Johnson', 'marcus.johnson@company.com', 'SDR', 2000000, 0, 0, 0, 0, 8, '2024-02-01'),
('Emma Williams', 'emma.williams@company.com', 'SDR', 2000000, 0, 0, 0, 0, 6, '2024-03-15'),
('Carlos Rodriguez', 'carlos.rodriguez@company.com', 'VP_Sales', 50000000, 3, 8900000, 0.75, 2966666, 2, '2019-05-01'),
('Priya Sharma', 'priya.sharma@company.com', 'CSM', 5000000, 4, 4200000, 0.80, 1050000, 6, '2021-11-01'),
('Tyler Anderson', 'tyler.anderson@company.com', 'AE', 8000000, 7, 7100000, 0.60, 1014285, 4, '2022-08-01'),
('Rachel Kim', 'rachel.kim@company.com', 'Senior_AE', 15000000, 9, 12800000, 0.68, 1422222, 5, '2021-02-15'),
('Nathan Clark', 'nathan.clark@company.com', 'AE', 8000000, 4, 3900000, 0.48, 975000, 4, '2023-06-01')
ON CONFLICT (email) DO NOTHING;

INSERT INTO notes (deal_id, user_id, content, note_type, is_pinned) VALUES
(1, 1, 'Amazon exec team very engaged. Michael Torres (SVP Cloud) is our champion. He has budget authority up to $30M without board approval. Key concern: implementation timeline must complete before Q4 AWS re:Invent.', 'executive_summary', true),
(3, 1, 'Walmart legal has approved the standard enterprise agreement framework. Waiting on their procurement team to schedule final contract review. David Martinez confirmed this is a top-5 initiative for 2025.', 'next_steps', true),
(11, 1, 'CLOSED WON! McKesson signed at $24.5M ARR. Implementation kickoff scheduled for May 15. Success factors: strong champion in CTO office, competitive pricing, proven healthcare use cases.', 'meeting_summary', true),
(5, 1, 'UHG compliance team raised 3 HIPAA concerns: data residency in US-only regions, BAA agreement needed, SOC 2 Type II certification required. All three are achievable - need to loop in legal and security teams.', 'objection', false),
(9, 1, 'BofA fraud detection demo showed 94% accuracy on their historical data - exceeded their 90% threshold requirement. CFO was in the room and very impressed. Moving to formal proposal stage.', 'meeting_summary', false),
(2, 1, 'Apple is evaluating 2 competitors: CrowdStrike and Palo Alto. Our differentiation: deeper ML integration and better macOS native support. Sarah Mitchell prefers our approach but James Chen (Infra) is skeptical on scalability.', 'competitor_intel', false),
(1, 1, 'CRITICAL: Amazon has a Q3 budget freeze from July 1. We MUST get contract signed by June 30 or risk losing the deal until Q4. Escalate to VP Sales for executive support if needed.', 'objection', true),
(4, 1, 'JPMorgan risk team has 12-person committee for vendor selection. Decision timeline: 6 months. Budget approval goes to board for deals >$10M. Robert Winters (CTO) has final say but needs consensus.', 'general', false),
(8, 1, 'GM POC approved for Flint, Detroit, Spring Hill, and Bowling Green plants. Success metric: 15% reduction in unplanned downtime. POC duration: 8 weeks. Results expected end of June.', 'next_steps', false),
(12, 1, 'ExxonMobil site visit confirmed. Meet with 4 refinery operations managers + VP Operations. Bring technical team. They want to see predictive maintenance working on real equipment data.', 'meeting_summary', false),
(6, 1, 'AT&T has $200M+ annual budget for network operations tools. 3 incumbent vendors up for renewal in Q3. Our window: position as AI-native alternative before renewal. Key contact: Thomas Garcia is our champion.', 'competitor_intel', false),
(5, 1, 'Emily Davis (SVP UHG) confirmed she will be executive sponsor if we address compliance concerns. She has direct line to CEO and will champion internally. This is our path to $22M deal.', 'executive_summary', false),
(10, 1, 'Verizon network team did informal assessment - our platform would need 6-month integration work. They prefer a phased approach starting with analytics layer only ($5M) with option to expand.', 'general', false),
(7, 1, 'Ford CTO Kevin Brown unresponsive for 2 weeks. Try reaching through board-level connection. Alternatively, identify VP-level champion who can champion internally. Car autonomy budget is $500M+ annually.', 'next_steps', false),
(3, 1, 'Walmart procurement says they have 8-week standard contract review. Legal redlines expected. Their top concern: data security and compliance for payment card data. We are PCI DSS certified - document and send.', 'objection', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MSA clause catalog (real enterprise MSA topics)
-- ============================================================================
INSERT INTO msa_clauses (topic, clause_name, default_text, startup_position, risk_level, notes) VALUES
('Indemnification', 'Indemnification cap — 1x fees', 'Vendor liability capped at 1x fees paid in trailing 12 months', 'standard', 'low', 'Industry-standard for ARR < $1M deals'),
('Indemnification', 'Indemnification cap — super-cap IP', 'Super-cap of 3x fees for IP indemnity; 1x for all other claims', 'standard', 'medium', 'Apple, JPMC, Walmart typically demand super-cap for IP'),
('Indemnification', 'Uncapped IP indemnity', 'IP indemnification uncapped — vendor bears full IP-infringement liability', 'pushback', 'high', 'Reject. Walmart and Verizon push for this on $20M+ deals'),
('IP Ownership', 'Background IP retained by vendor', 'Vendor retains all background IP; foreground IP licensed to buyer', 'standard', 'low', 'Critical: protect vendor IP'),
('IP Ownership', 'Work-product assignment to buyer', 'All deliverables/work product assigned to buyer including derivative models', 'pushback', 'high', 'JPMC and Ford try this on ML projects — reject for model weights'),
('Data Rights', 'Customer data residency US-only', 'All customer data must be stored and processed in US data centers', 'standard', 'low', 'UHG, BofA standard requirement; we support via us-east-2 partition'),
('Data Rights', 'EU data residency (GDPR)', 'EU customer data must remain in EU; SCC executed; no US sub-processor access', 'pushback', 'medium', 'Required for AT&T-Europe; needs AWS Frankfurt setup'),
('Audit Rights', 'On-site audit 2x/year', 'Buyer may conduct on-site security audit twice per year with 30 days notice', 'pushback', 'medium', 'JPMC, BofA push for this; counter with SOC 2 Type II'),
('Audit Rights', 'Right to audit logs on demand', 'Buyer may inspect production audit logs within 5 business days of request', 'standard', 'low', 'Acceptable if redacted; common for UHG'),
('SLA / Uptime', '99.9% uptime SLA with credits', '99.9% monthly uptime; 10% credit per 0.1% below threshold; max 30%', 'standard', 'low', 'Industry standard'),
('SLA / Uptime', '99.99% uptime SLA', '99.99% monthly uptime with same credit schedule', 'pushback', 'high', 'Amazon AWS asks for this; only viable on multi-region'),
('Termination', 'Termination for convenience', 'Buyer may terminate for convenience with 30 days notice; no refund of prepaid fees', 'standard', 'medium', 'Walmart pushed termination-for-convenience with refund — declined'),
('Termination', 'Termination for cause — material breach', 'Either party may terminate on material breach with 30-day cure period', 'standard', 'low', 'Universal'),
('Insurance', 'Cyber insurance $10M', 'Vendor maintains $10M cyber-liability insurance during term', 'standard', 'low', 'BofA, JPMC require this minimum'),
('Insurance', 'Cyber insurance $25M', 'Vendor maintains $25M cyber-liability insurance with buyer as additional insured', 'pushback', 'medium', 'Walmart, Amazon ask; we carry $15M — need to upgrade for >$30M deals'),
('Service Levels', 'P1 response 15 min, P2 1 hour', 'P1 incident response within 15 min 24/7; P2 within 1 hour business-day', 'standard', 'low', 'Standard tiered support'),
('IP Ownership', 'Model training data feedback rights', 'Vendor may use de-identified usage data to improve models', 'pushback', 'high', 'UHG (HIPAA) and JPMC explicitly forbid — counter with opt-in only'),
('Termination', 'Data export upon termination', 'Buyer entitled to export data in machine-readable format for 90 days post-term', 'standard', 'low', 'Increasingly required by procurement'),
('SLA / Uptime', 'Disaster recovery RPO 1hr RTO 4hr', 'RPO 1 hour, RTO 4 hours for DR; tested annually', 'standard', 'medium', 'BofA, McKesson require'),
('Audit Rights', 'Regulator access to records', 'Buyer regulators (e.g., OCC, FDIC for financial; CMS for healthcare) may access records', 'standard', 'high', 'Required for JPMC, BofA, UHG')
ON CONFLICT DO NOTHING;

-- MSA redlines (per-F100 redline history)
INSERT INTO msa_redlines (clause_id, company_id, buyer_position, startup_counter, outcome, negotiated_value, cycle_days, notes) VALUES
(2, 1, 'Apple legal asked for 5x fees super-cap on IP', 'Countered with 3x; agreed at 3x super-cap', 'accepted', '3x fees super-cap', 18, 'James Chen approved'),
(5, 2, 'JPMC demanded full work-product assignment', 'Refused; carved out model weights as background IP', 'accepted', 'Model weights = background IP', 32, 'Robert Winters approved after 2 rounds'),
(3, 7, 'Walmart insisted on uncapped IP indemnity', 'Countered with 5x super-cap', 'accepted', '5x super-cap on IP', 41, 'David Martinez signed off'),
(8, 2, 'JPMC required quarterly on-site audits', 'Countered with annual on-site + quarterly SOC 2 reviews', 'accepted', 'Annual on-site + quarterly review', 22, 'Standard JPMC pattern'),
(11, 5, 'Amazon required 99.99% uptime with 50% credit', 'Countered with 99.95% + 30% credit cap', 'accepted', '99.95% / 30% cap', 14, 'Multi-region rollout justified'),
(17, 3, 'UHG forbade any data-feedback use; absolute opt-out', 'Agreed; HIPAA-safe harbor only', 'accepted', 'No data feedback; HIPAA-bound', 9, 'Emily Davis demand'),
(15, 7, 'Walmart asked for $50M cyber insurance', 'Countered with $25M', 'open', 'TBD', NULL, 'Negotiating'),
(2, 16, 'BofA wanted 4x super-cap on IP', 'Countered with 3x', 'accepted', '3x super-cap', 27, 'Sandra Thompson agreed'),
(7, 12, 'AT&T-Europe needed full GDPR data residency', 'Confirmed EU Frankfurt deployment + SCCs', 'accepted', 'EU data residency confirmed', 38, NULL),
(11, 5, 'Amazon asked for $50M cyber', 'Increased to $30M for Amazon special; renewed policy', 'accepted', '$30M for Amazon only', 21, 'One-off uplift'),
(17, 2, 'JPMC forbade any usage-data telemetry', 'Agreed; opt-in only for non-PII metadata', 'accepted', 'Opt-in metadata only', 17, NULL),
(5, 13, 'Ford asked for assignment of all foreground IP including models', 'Refused; foreground IP licensed only', 'open', 'Negotiating', NULL, 'Stalled with Ford CTO'),
(20, 3, 'UHG required CMS audit access', 'Accepted standard CMS-record access clause', 'accepted', 'CMS access granted', 6, 'Required for Medicare-related processing'),
(2, 5, 'Amazon proposed 2x fees super-cap', 'Accepted 2x super-cap (Amazon premium pricing)', 'accepted', '2x super-cap', 11, 'Mike Torres pushed simplification'),
(8, 16, 'BofA demanded continuous-access audit portal', 'Provided read-only audit dashboard', 'accepted', 'Read-only portal', 19, 'Sandra Thompson')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Security questions (real SIG/CAIQ/VSAQ)
-- ============================================================================
INSERT INTO security_questions (framework, question_code, domain, question_text, expected_artifact) VALUES
('SIG', 'A.1.1', 'Risk Management', 'Does the organization maintain a formal information security risk management program?', 'Risk Management Policy PDF'),
('SIG', 'B.1.1', 'Security Policy', 'Is there a written information security policy approved by senior management?', 'InfoSec Policy v2.x'),
('SIG', 'C.2.1', 'Access Control', 'Are user access rights reviewed at least quarterly?', 'Access Review Report Q1'),
('SIG', 'C.2.5', 'Access Control', 'Is multi-factor authentication required for all privileged accounts?', 'MFA Enforcement screenshot'),
('SIG', 'D.3.1', 'Encryption', 'Is customer data encrypted at rest using AES-256 or stronger?', 'Encryption-at-rest architecture diagram'),
('SIG', 'D.3.2', 'Encryption', 'Is data in transit encrypted using TLS 1.2 or higher?', 'TLS configuration screenshot'),
('SIG', 'E.4.1', 'Incident Response', 'Does the organization have a documented incident response plan tested annually?', 'IR Plan + tabletop report'),
('SIG', 'F.5.1', 'Business Continuity', 'Is there a documented and tested business continuity / DR plan?', 'BCP/DR test results'),
('SIG', 'G.6.1', 'Vendor Management', 'Are sub-processors disclosed and contractually bound to equivalent security obligations?', 'Sub-processor list + DPA'),
('CAIQ', 'IAM-02', 'Identity & Access', 'Do you support customer-managed encryption keys (BYOK / CMK)?', 'KMS BYOK documentation'),
('CAIQ', 'IAM-09', 'Identity & Access', 'Do you support SSO via SAML 2.0 or OIDC?', 'SSO configuration guide'),
('CAIQ', 'EKM-04', 'Encryption Key Mgmt', 'Are encryption keys rotated at least annually?', 'Key rotation policy'),
('CAIQ', 'GRM-09', 'Governance', 'Do you publish a SOC 2 Type II report annually?', 'Latest SOC 2 Type II'),
('CAIQ', 'AAC-03', 'Audit Assurance', 'Are you compliant with ISO 27001?', 'ISO 27001 certificate'),
('CAIQ', 'STA-09', 'Supply Chain', 'Do you assess sub-processors for SOC 2 / ISO 27001 compliance?', 'Vendor risk assessments'),
('CAIQ', 'DSI-02', 'Data Security', 'Do you support data residency (EU / US / APAC region pinning)?', 'Region-pinning configuration doc'),
('CAIQ', 'BCR-09', 'BCM', 'What is your RPO and RTO commitment?', 'SLA + DR test report'),
('VSAQ', 'V-AUTH-01', 'Authentication', 'Do you support enforced MFA for all customer users?', 'MFA admin policy'),
('VSAQ', 'V-LOG-02', 'Logging', 'Do you retain security audit logs for at least 12 months?', 'Log retention policy'),
('VSAQ', 'V-DATA-04', 'Data Handling', 'Do you support customer-initiated data deletion within 30 days of request?', 'Data deletion SOP'),
('VSAQ', 'V-NET-03', 'Network Security', 'Is your production environment segmented from corporate networks?', 'Network architecture diagram'),
('VSAQ', 'V-VULN-01', 'Vulnerability Mgmt', 'How frequently are external penetration tests performed?', 'Latest pentest report'),
('SIG', 'H.7.1', 'Cryptography', 'Are FIPS 140-2 validated modules used for cryptographic operations?', 'FIPS 140-2 cert numbers'),
('CAIQ', 'TVM-02', 'Threat Vulnerability', 'Are vulnerability scans performed at least monthly on all internet-facing assets?', 'Scan cadence + ticketing evidence')
ON CONFLICT DO NOTHING;

-- Security responses
INSERT INTO security_responses (question_id, company_id, response, evidence_link, status, confidence, reviewer) VALUES
(1, 2, 'Yes — formal risk management program documented in ISMS-001 reviewed annually by CISO', 'https://trust.example.com/isms-001', 'approved', 95, 'Erin Cole (CISO)'),
(2, 2, 'Yes — InfoSec Policy v3.2 approved by CEO and Board Audit Committee 2025-Q1', 'https://trust.example.com/policy', 'approved', 100, 'Erin Cole (CISO)'),
(4, 2, 'Yes — MFA enforced via Okta for all privileged roles including production console access', 'https://trust.example.com/mfa', 'approved', 100, 'Erin Cole (CISO)'),
(5, 7, 'Yes — AES-256-GCM at rest via AWS KMS with customer-managed keys available on request', 'https://trust.example.com/encryption', 'approved', 100, 'Walmart-assigned reviewer'),
(6, 7, 'Yes — TLS 1.3 with strong cipher suites; HSTS enforced; A+ on SSL Labs', 'https://trust.example.com/tls', 'approved', 100, 'Walmart procurement'),
(10, 5, 'Yes — BYOK supported via AWS KMS, GCP CMEK, and Azure Key Vault on enterprise tier', 'https://trust.example.com/byok', 'approved', 90, 'Amazon AWS reviewer'),
(11, 5, 'Yes — SAML 2.0 via Okta, Azure AD, Ping, Google Workspace; OIDC via Auth0', 'https://trust.example.com/sso', 'approved', 100, 'Amazon AWS reviewer'),
(13, 2, 'Yes — SOC 2 Type II issued 2025-08; covers security + availability + confidentiality', 'https://trust.example.com/soc2-2025', 'approved', 100, 'Robert Winters direct'),
(13, 3, 'Yes — SOC 2 Type II + HIPAA BAA available on request', 'https://trust.example.com/soc2-2025', 'approved', 100, 'Emily Davis (UHG)'),
(15, 3, 'Yes — quarterly vendor risk assessments; all sub-processors hold SOC 2 Type II', 'https://trust.example.com/subprocessors', 'in_review', 80, 'UHG vendor risk team'),
(16, 12, 'Yes — region pinning supported: us-east-2, eu-central-1, ap-southeast-1', 'https://trust.example.com/regions', 'approved', 100, 'AT&T-Europe reviewer'),
(13, 16, 'Yes — SOC 2 Type II; latest Aug 2025 with zero exceptions', 'https://trust.example.com/soc2-2025', 'approved', 100, 'Sandra Thompson (BofA)'),
(14, 16, 'In progress — ISO 27001 audit scheduled Q3 2026 with Schellman', NULL, 'in_review', 65, 'Sandra Thompson (BofA)'),
(18, 1, 'Yes — MFA required for all users via SAML SSO; cannot be disabled by tenant', 'https://trust.example.com/mfa', 'approved', 100, 'Apple security'),
(19, 1, 'Yes — 13 months retention default; 7-year retention available on enterprise', 'https://trust.example.com/logs', 'approved', 100, 'Apple security'),
(20, 3, 'Yes — 30-day SLA for full deletion via API or support; certificate of destruction issued', 'https://trust.example.com/deletion', 'approved', 100, 'UHG privacy team'),
(22, 5, 'Quarterly — last test by Bishop Fox 2025-10 (red team + external pentest)', 'https://trust.example.com/pentest', 'approved', 90, 'Amazon AWS reviewer'),
(23, 2, 'Yes — FIPS 140-2 Level 2 validated modules in use (HSM-backed)', 'https://trust.example.com/fips', 'in_review', 75, 'JPMC crypto team'),
(7, 2, 'Yes — IR plan tested annually; last tabletop 2025-09 with full SOC participation', 'https://trust.example.com/ir-2025', 'approved', 95, 'JPMC SOC'),
(8, 16, 'Yes — BCP tested 2025-Q4; RPO 1hr RTO 4hr met during simulated us-east failover', 'https://trust.example.com/bcp-2025', 'approved', 90, 'BofA BCM team')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Org relationships (contact-to-contact + role tagging)
-- ============================================================================
INSERT INTO org_relationships (contact_id, reports_to_id, function_area, is_line, signing_authority_usd, buyer_role) VALUES
(1, NULL, 'Engineering', TRUE, 30000000, 'economic_buyer'),
(2, 1, 'Infrastructure', TRUE, 5000000, 'technical_buyer'),
(3, NULL, 'Technology', TRUE, 50000000, 'economic_buyer'),
(4, 3, 'Technology', TRUE, 10000000, 'champion'),
(5, NULL, 'Cloud Infrastructure', TRUE, 50000000, 'champion'),
(6, 5, 'AI/ML', TRUE, 8000000, 'technical_buyer'),
(7, NULL, 'Digital Officer', TRUE, 75000000, 'economic_buyer'),
(8, 7, 'Technology', TRUE, 15000000, 'champion'),
(9, NULL, 'CTO Office', TRUE, 25000000, 'economic_buyer'),
(10, NULL, 'Digital Transformation', TRUE, 20000000, 'economic_buyer'),
(11, NULL, 'Network Technology', FALSE, 5000000, 'technical_buyer'),
(12, NULL, 'Technology Innovation', TRUE, 30000000, 'economic_buyer'),
(13, NULL, 'Enterprise Tech', TRUE, 15000000, 'champion'),
(14, NULL, 'CIO Office', TRUE, 40000000, 'economic_buyer'),
(15, NULL, 'Technology', TRUE, 10000000, 'champion')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- F100 Procurement Playbooks (real procurement stage definitions)
-- ============================================================================
INSERT INTO procurement_playbooks (company_id, stage_order, stage_name, owner_role, typical_duration_days, required_artifacts, signing_threshold_usd, notes) VALUES
(1, 1, 'Discovery', 'Engineering VP', 21, 'Use case brief, ROI model', 30000000, 'Apple: starts with eng champion, not procurement'),
(1, 2, 'POC', 'Engineering Director', 45, 'POC scope, success criteria', 30000000, 'Mandatory 6-week POC; success = green-light'),
(1, 3, 'Security Review', 'Apple Information Security', 60, 'CAIQ, SOC 2 Type II, pentest', 30000000, 'Apple has unique SIG-like assessment'),
(1, 4, 'Procurement', 'Apple Procurement', 45, 'MSA + Order Form, pricing', 30000000, 'Procurement only engages after security clears'),
(1, 5, 'Legal Review', 'Apple Legal', 30, 'Redlines on MSA', 30000000, 'Standard MSA template; deviations require GC approval'),
(1, 6, 'Signing', 'VP Engineering', 7, 'Final OF', 30000000, 'VP-Eng has $30M signing authority'),
(2, 1, 'RFI', 'JPMC Vendor Mgmt', 30, 'RFI response', 10000000, 'JPMC: formal RFI first for >$1M'),
(2, 2, 'RFP', 'JPMC Vendor Mgmt', 45, 'RFP response, financial viability', 10000000, 'Mandatory 12-vendor RFP for >$5M'),
(2, 3, 'Security Review', 'JPMC TPRM', 75, 'SIG full, BITS, pentest, FFIEC', 10000000, 'JPMC TPRM is one of the toughest in industry'),
(2, 4, 'Legal Review', 'JPMC Legal', 60, 'MSA redlines, OCC review', 10000000, 'OCC bank regulator approval required for cloud'),
(2, 5, 'Board Approval', 'JPMC Board Tech Cmte', 30, 'Board memo', 10000000, 'Deals >$10M go to Board Tech Committee'),
(2, 6, 'Signing', 'CTO + CFO', 14, 'Dual signature', 10000000, 'Dual signature required'),
(7, 1, 'Discovery', 'Walmart Digital', 30, 'Use case brief', 25000000, 'Walmart: Digital Officer is gate'),
(7, 2, 'POC', 'Walmart Labs', 60, 'POC results', 25000000, '8-week POC standard'),
(7, 3, 'Procurement Engagement', 'Walmart Procurement', 30, 'Vendor onboarding form', 25000000, 'Walmart procurement is structured'),
(7, 4, 'Security Review', 'Walmart Cyber', 60, 'CAIQ, PCI DSS, SOC 2', 25000000, 'PCI DSS required for any payment-card-adjacent system'),
(7, 5, 'Legal Review', 'Walmart Legal', 56, 'MSA + Order Form', 25000000, 'Walmart standard MSA — 8-week review window'),
(7, 6, 'Signing', 'Chief Digital Officer', 7, 'OF signature', 25000000, 'CDO has $25M signing authority'),
(5, 1, 'Sponsor Alignment', 'AWS L8+ leader', 14, 'Exec sponsor', 50000000, 'Amazon: sponsor model'),
(5, 2, 'Solution Design', 'AWS Pro Serv', 30, 'Reference architecture', 50000000, 'AWS Pro Services involvement common'),
(5, 3, 'Security Review', 'AWS Security', 45, 'CAIQ + AWS Marketplace listing', 50000000, 'Marketplace listing accelerates'),
(5, 4, 'Procurement', 'AWS Procurement', 30, 'OF + PO', 50000000, 'Faster if on AWS Marketplace'),
(5, 5, 'Signing', 'SVP Cloud', 7, 'OF signature', 50000000, 'SVP Cloud authority'),
(3, 1, 'Discovery', 'UHG Innovation', 21, 'Use case + clinical relevance', 25000000, 'UHG: clinical workflow alignment first'),
(3, 2, 'Compliance Review', 'UHG Privacy + Compliance', 60, 'HIPAA, BAA, HITRUST, SOC 2', 25000000, 'HIPAA BAA + HITRUST CSF mandatory'),
(3, 3, 'POC', 'UHG Optum Tech', 60, 'POC results, clinical validation', 25000000, 'POC must include clinical safety review'),
(3, 4, 'Procurement', 'UHG Sourcing', 45, 'MSA + Order Form', 25000000, 'Sourcing engages after compliance clears'),
(3, 5, 'Legal Review', 'UHG Legal', 45, 'BAA + MSA', 25000000, 'BAA is non-negotiable'),
(3, 6, 'Signing', 'SVP Technology + CMO', 14, 'Dual signature', 25000000, 'Tech + Chief Medical Officer dual sign for clinical AI')
ON CONFLICT DO NOTHING;

-- Deal stage progress (current state)
INSERT INTO deal_stage_progress (deal_id, playbook_id, status, entered_at, blocker) VALUES
(1, 19, 'completed', NOW() - INTERVAL '120 days', NULL),
(1, 20, 'completed', NOW() - INTERVAL '90 days', NULL),
(1, 21, 'completed', NOW() - INTERVAL '60 days', NULL),
(1, 22, 'in_progress', NOW() - INTERVAL '20 days', 'Waiting on revised pricing approval'),
(2, 1, 'completed', NOW() - INTERVAL '80 days', NULL),
(2, 2, 'completed', NOW() - INTERVAL '50 days', NULL),
(2, 3, 'in_progress', NOW() - INTERVAL '15 days', 'Apple Information Security review in progress'),
(3, 13, 'completed', NOW() - INTERVAL '110 days', NULL),
(3, 14, 'completed', NOW() - INTERVAL '70 days', NULL),
(3, 15, 'completed', NOW() - INTERVAL '40 days', NULL),
(3, 16, 'completed', NOW() - INTERVAL '20 days', NULL),
(3, 17, 'in_progress', NOW() - INTERVAL '8 days', 'Walmart legal redlines pending'),
(5, 25, 'completed', NOW() - INTERVAL '90 days', NULL),
(5, 26, 'in_progress', NOW() - INTERVAL '50 days', 'HIPAA BAA + HITRUST review'),
(4, 7, 'completed', NOW() - INTERVAL '60 days', NULL),
(4, 8, 'in_progress', NOW() - INTERVAL '25 days', 'JPMC RFP response under evaluation')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Pilots
-- ============================================================================
INSERT INTO pilots (deal_id, company_id, pilot_name, start_date, end_date, budget_usd, exec_sponsor, status, conversion_target_arr_usd, success_criteria) VALUES
(1, 5, 'AWS AI Platform Pilot — Bedrock Replacement', CURRENT_DATE - 75, CURRENT_DATE + 15, 350000, 'Michael Torres (SVP Cloud)', 'active', 9500000, 'Latency p99 < 800ms; cost-per-token 30% better than Bedrock; >5 internal teams adopt'),
(3, 7, 'Walmart Digital Ops POC — DC + Store Analytics', CURRENT_DATE - 60, CURRENT_DATE, 480000, 'David Martinez (CDO)', 'completed', 14000000, '15% reduction in DC out-of-stock; 4 DCs in scope'),
(5, 3, 'UHG Claims AI Pilot — Optum Florida', CURRENT_DATE - 45, CURRENT_DATE + 45, 600000, 'Emily Davis (SVP Innovation)', 'active', 7333000, '20% reduction in claims rework; 99.5% accuracy on auto-adjudication'),
(8, 14, 'GM Manufacturing Analytics — 4 Plants', CURRENT_DATE - 30, CURRENT_DATE + 30, 220000, 'Patricia Lee (VP DT)', 'active', 3266000, '15% reduction in unplanned downtime across Flint, Detroit, Spring Hill, Bowling Green'),
(2, 1, 'Apple Security Suite POC', CURRENT_DATE - 25, CURRENT_DATE + 35, 180000, 'Sarah Mitchell (VP Eng)', 'active', 5066000, '99.9% detection rate; <0.1% FPR; macOS native install path'),
(9, 16, 'BofA Fraud Detection Pilot', CURRENT_DATE - 50, CURRENT_DATE - 5, 300000, 'Sandra Thompson (CIO)', 'completed', 10333000, '94% accuracy on historical data; <100ms inference; PCI-DSS clean')
ON CONFLICT DO NOTHING;

-- Pilot metrics
INSERT INTO pilot_metrics (pilot_id, metric_name, target_value, current_value, unit, threshold_pct) VALUES
(1, 'Latency p99', 800, 720, 'ms', 100),
(1, 'Cost per 1M tokens', 12.0, 8.4, 'USD', 100),
(1, 'Internal teams adopted', 5, 7, 'teams', 100),
(1, 'Uptime', 99.9, 99.94, '%', 100),
(2, 'DC out-of-stock reduction', 15, 17.2, '%', 100),
(2, 'DCs in production', 4, 4, 'DCs', 100),
(2, 'False positive rate', 5.0, 3.8, '%', 100),
(3, 'Claims rework reduction', 20, 13.5, '%', 100),
(3, 'Auto-adjudication accuracy', 99.5, 99.1, '%', 100),
(3, 'PHI breach incidents', 0, 0, 'count', 100),
(4, 'Unplanned downtime reduction', 15, 11.2, '%', 100),
(4, 'Plants live', 4, 3, 'plants', 100),
(5, 'Detection rate', 99.9, 99.92, '%', 100),
(5, 'False positive rate', 0.1, 0.07, '%', 100),
(5, 'macOS deployment time', 30, 8, 'minutes', 100),
(6, 'Fraud detection accuracy', 90, 94.2, '%', 100),
(6, 'Inference latency', 100, 62, 'ms', 100),
(6, 'PCI DSS exceptions', 0, 0, 'count', 100)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Compliance certifications (startup's posture)
-- ============================================================================
INSERT INTO compliance_certifications (framework, status, auditor, issued_date, expires_date, scope, evidence_link, cost_usd, notes) VALUES
('SOC 2 Type II', 'active', 'Schellman', '2025-08-15', '2026-08-14', 'Security, Availability, Confidentiality', 'https://trust.example.com/soc2-2025', 165000, 'Annual renewal; zero exceptions 2025'),
('ISO 27001', 'in_progress', 'Schellman', NULL, NULL, 'Full ISMS', NULL, 220000, 'Audit scheduled Q3 2026; required for BofA, AT&T-Europe'),
('HIPAA BAA', 'active', 'Internal + outside counsel', '2025-01-10', NULL, 'PHI handling for healthcare customers', 'https://trust.example.com/baa', 45000, 'Required for UHG, Cigna, CVS'),
('HITRUST CSF', 'in_progress', 'Coalfire', NULL, NULL, 'r2 validated assessment for healthcare', NULL, 380000, 'UHG mandatory; targeted 2026-Q4'),
('PCI DSS Level 1', 'active', 'Coalfire', '2025-06-20', '2026-06-19', 'Payment card handling adjacent systems', 'https://trust.example.com/pci', 95000, 'Required for Walmart, retail customers'),
('FedRAMP Moderate', 'planned', 'A2LA-accredited 3PAO TBD', NULL, NULL, 'US Federal cloud authorization', NULL, 1800000, 'JAB or agency-sponsor path; targeted 2027'),
('FedRAMP High', 'planned', 'TBD', NULL, NULL, 'High-impact federal workloads', NULL, 2500000, 'After FedRAMP Moderate'),
('IRAP', 'planned', 'IRAP assessor TBD', NULL, NULL, 'Australian government cloud', NULL, 350000, 'Required for AU public sector pursuits'),
('C5', 'planned', 'BSI', NULL, NULL, 'German federal cloud catalogue', NULL, 280000, 'Required for AT&T-Europe-Germany'),
('GDPR DPA', 'active', 'Internal', '2024-05-25', NULL, 'EU data processing addendum', 'https://trust.example.com/dpa', 25000, 'Maintained continuously'),
('CSA STAR Level 2', 'active', 'Schellman', '2025-08-15', '2026-08-14', 'Cloud Security Alliance attestation', 'https://trust.example.com/star', 35000, 'Filed with CAIQ + SOC 2'),
('FFIEC compliance', 'in_progress', 'Internal + JPMC review', NULL, NULL, 'Financial-services regulator alignment', NULL, 75000, 'JPMC + BofA pre-requisite')
ON CONFLICT DO NOTHING;

-- Deal compliance requirements
INSERT INTO deal_compliance_requirements (deal_id, framework, required, is_blocker, notes) VALUES
(1, 'SOC 2 Type II', TRUE, FALSE, 'Amazon — already met'),
(1, 'ISO 27001', TRUE, TRUE, 'Amazon-Europe wants ISO 27001'),
(2, 'SOC 2 Type II', TRUE, FALSE, 'Apple — met'),
(3, 'SOC 2 Type II', TRUE, FALSE, 'Walmart — met'),
(3, 'PCI DSS Level 1', TRUE, FALSE, 'Walmart — met'),
(4, 'SOC 2 Type II', TRUE, FALSE, 'JPMC — met'),
(4, 'ISO 27001', TRUE, TRUE, 'JPMC — gap; blocker'),
(4, 'FFIEC compliance', TRUE, TRUE, 'JPMC — in progress; blocker'),
(5, 'SOC 2 Type II', TRUE, FALSE, 'UHG — met'),
(5, 'HIPAA BAA', TRUE, FALSE, 'UHG — met'),
(5, 'HITRUST CSF', TRUE, TRUE, 'UHG — in progress; blocker'),
(9, 'SOC 2 Type II', TRUE, FALSE, 'BofA — met'),
(9, 'ISO 27001', TRUE, TRUE, 'BofA — gap; blocker'),
(9, 'PCI DSS Level 1', TRUE, FALSE, 'BofA — met'),
(9, 'FFIEC compliance', TRUE, TRUE, 'BofA — in progress; blocker'),
(6, 'SOC 2 Type II', TRUE, FALSE, 'AT&T — met'),
(6, 'C5', TRUE, TRUE, 'AT&T-Europe-Germany — gap'),
(11, 'SOC 2 Type II', TRUE, FALSE, 'McKesson — met'),
(11, 'HIPAA BAA', TRUE, FALSE, 'McKesson — met')
ON CONFLICT DO NOTHING;
