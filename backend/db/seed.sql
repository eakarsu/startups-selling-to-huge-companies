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
