// src/services/demo-agent/templates/healthcare.template.ts
import type { IndustryTemplate } from '../types';
import { daysFromNow } from './base-template';

export const healthcareTemplate: IndustryTemplate = {
  industry: 'healthcare',

  brand: {
    name: 'MedFlow Solutions',
    tagline: 'Transforming Patient Care Through Innovation',
    mission: 'To empower healthcare organizations with intelligent software that improves patient outcomes, streamlines operations, and reduces costs.',
    description: 'MedFlow Solutions is a leading healthcare technology company providing AI-powered clinical workflow management, patient engagement platforms, and data analytics for hospitals, clinics, and health systems across Europe.',
    tone_attributes: ['Professional', 'Empathetic', 'Evidence-based', 'Trustworthy'],
    primary_color: '#0EA5E9',
    secondary_color: '#0369A1',
    usps: ['HIPAA & GDPR compliant by design', 'AI-powered clinical decision support', '40% reduction in administrative burden', 'Real-time patient outcome tracking'],
    brand_values: ['Patient-first', 'Innovation', 'Data security', 'Accessibility', 'Evidence-based'],
    audiences: ['Hospital administrators', 'Chief Medical Officers', 'Healthcare IT directors', 'Clinical operations managers'],
    industries: ['Healthcare', 'Medical devices', 'Health-tech', 'Pharmaceuticals'],
    messaging_dos: 'Use data and evidence to support claims. Emphasize patient outcomes and safety. Reference compliance standards. Use empathetic language when discussing patient care.',
    messaging_donts: 'Never make unsubstantiated health claims. Avoid overly technical jargon without explanation. Do not minimize data security concerns.',
    preferred_vocabulary: ['patient outcomes', 'clinical workflow', 'care coordination', 'interoperability', 'value-based care', 'digital health'],
    banned_phrases: ['guaranteed cure', 'replace doctors', 'cheap healthcare'],
    voice_name: 'MedFlow Professional',
    voice_description: 'Authoritative yet compassionate. Uses evidence-based language with clear explanations. Balances innovation messaging with patient safety priorities.',
  },

  agentTasks: {
    social_task: 'Creating thought leadership content about AI-driven patient triage for #DigitalHealth community',
    email_task: 'A/B testing nurture sequence for hospital CIOs — personalized case studies by bed count',
    ads_task: 'Optimizing Google Ads for "clinical workflow software" and "patient engagement platform" keywords',
    analytics_task: 'Analyzing conversion funnel for healthcare IT directors — 42% increase in demo requests detected',
    orchestrator_task: 'Coordinating campaign launch for HIMSS 2026 conference lead generation',
  },

  leads: [
    { name: 'Dr. Elisabeth van der Berg', email: 'e.vanderberg@amsterdamumc.nl', company: 'Amsterdam UMC', title: 'Chief Medical Information Officer', composite_score: 96, stage: 'sql', conversion_probability: 0.89, predicted_value: 185000, hot_signals: ['Requested enterprise demo', 'Downloaded interoperability whitepaper', 'Visited pricing 4x'], cold_signals: [], source: 'HIMSS Conference', tags: ['enterprise', 'academic-hospital'], next_best_action: 'Schedule executive demo with C-suite', intent_level: 'very_high', buying_stage: 'evaluation' },
    { name: 'Thomas Bakker', email: 't.bakker@erasmusmc.nl', company: 'Erasmus MC Rotterdam', title: 'Director of Digital Health', composite_score: 91, stage: 'sql', conversion_probability: 0.82, predicted_value: 150000, hot_signals: ['Attended webinar on AI triage', 'Engaged with 5 case studies', 'Connected on LinkedIn'], cold_signals: [], source: 'Webinar', tags: ['enterprise', 'innovation-leader'], next_best_action: 'Send ROI calculator customized for academic hospitals', intent_level: 'high', buying_stage: 'evaluation' },
    { name: 'Marie-Claire Dubois', email: 'mc.dubois@chbruxelles.be', company: 'Centre Hospitalier de Bruxelles', title: 'VP Operations', composite_score: 87, stage: 'mql', conversion_probability: 0.71, predicted_value: 120000, hot_signals: ['Downloaded patient engagement guide', 'Opened 8 emails this month'], cold_signals: ['Budget cycle in Q4'], source: 'Content Download', tags: ['mid-market', 'belgium'], next_best_action: 'Invite to private roundtable event', intent_level: 'high', buying_stage: 'consideration' },
    { name: 'Henrik Andersen', email: 'h.andersen@rigshospitalet.dk', company: 'Rigshospitalet Copenhagen', title: 'Head of Clinical IT', composite_score: 84, stage: 'mql', conversion_probability: 0.65, predicted_value: 95000, hot_signals: ['Visited product pages 6x', 'Submitted contact form'], cold_signals: ['Long procurement cycle'], source: 'Organic Search', tags: ['enterprise', 'nordic'], next_best_action: 'Send Nordic healthcare customer success stories', intent_level: 'medium', buying_stage: 'consideration' },
    { name: 'Sarah Jansen', email: 's.jansen@isala.nl', company: 'Isala Ziekenhuis', title: 'Manager Patient Services', composite_score: 79, stage: 'mql', conversion_probability: 0.58, predicted_value: 75000, hot_signals: ['Engaged with patient engagement content', 'Attended product demo'], cold_signals: ['Decision requires board approval'], source: 'LinkedIn Ad', tags: ['mid-market', 'patient-engagement'], next_best_action: 'Share Isala-sized hospital case study', intent_level: 'medium', buying_stage: 'awareness' },
    { name: 'Prof. Klaus Weber', email: 'k.weber@charite.de', company: 'Charit\u00e9 Berlin', title: 'Chief Digital Officer', composite_score: 93, stage: 'sql', conversion_probability: 0.85, predicted_value: 220000, hot_signals: ['Requested pilot program details', 'Downloaded technical architecture docs', 'CTO referral'], cold_signals: [], source: 'Partner Referral', tags: ['enterprise', 'germany', 'academic'], next_best_action: 'Arrange technical deep-dive with engineering team', intent_level: 'very_high', buying_stage: 'decision' },
    { name: 'Ingrid Petersen', email: 'i.petersen@karolinska.se', company: 'Karolinska University Hospital', title: 'Director of Innovation', composite_score: 76, stage: 'lead', conversion_probability: 0.45, predicted_value: 130000, hot_signals: ['Downloaded AI in healthcare report'], cold_signals: ['Early research phase'], source: 'Content Marketing', tags: ['enterprise', 'sweden'], next_best_action: 'Enroll in monthly innovation newsletter', intent_level: 'low', buying_stage: 'awareness' },
    { name: 'Jan de Vries', email: 'j.devries@maxima-mc.nl', company: 'M\u00e1xima MC Eindhoven', title: 'IT Infrastructure Manager', composite_score: 72, stage: 'lead', conversion_probability: 0.40, predicted_value: 60000, hot_signals: ['Visited integration documentation'], cold_signals: ['Technical evaluation only'], source: 'Google Ads', tags: ['mid-market', 'technical'], next_best_action: 'Send technical integration guide', intent_level: 'medium', buying_stage: 'awareness' },
    { name: 'Dr. Amara Okafor', email: 'a.okafor@nhs-trust.uk', company: 'NHS Greater Manchester', title: 'Clinical Transformation Lead', composite_score: 88, stage: 'mql', conversion_probability: 0.73, predicted_value: 200000, hot_signals: ['Watched 3 customer testimonial videos', 'Requested UK pricing'], cold_signals: ['NHS procurement process'], source: 'Webinar', tags: ['enterprise', 'uk', 'nhs'], next_best_action: 'Connect with UK sales team for NHS-specific demo', intent_level: 'high', buying_stage: 'consideration' },
    { name: 'Pieter Claes', email: 'p.claes@uzgent.be', company: 'UZ Gent', title: 'Head of Care Technology', composite_score: 81, stage: 'mql', conversion_probability: 0.60, predicted_value: 90000, hot_signals: ['Attended 2 webinars', 'Downloaded comparison guide'], cold_signals: ['Evaluating 3 vendors'], source: 'LinkedIn', tags: ['academic', 'belgium'], next_best_action: 'Send competitive differentiation deck', intent_level: 'medium', buying_stage: 'evaluation' },
  ],

  campaigns: [
    { name: 'HIMSS Europe 2026 Lead Generation', description: 'Pre-event, on-site, and post-event campaign for HIMSS Europe conference', objective: 'lead_generation', status: 'active', budget_total: 45000, budget_spent: 28500, days_remaining: 18, roi: 340, conversions: 127, ai_managed: true, performance_score: 94 },
    { name: 'AI Clinical Workflow Awareness', description: 'Multi-channel campaign educating hospital decision-makers about AI-powered clinical workflows', objective: 'awareness', status: 'active', budget_total: 30000, budget_spent: 18900, days_remaining: 25, roi: 280, conversions: 89, ai_managed: true, performance_score: 91 },
    { name: 'Patient Engagement Platform Launch', description: 'Product launch campaign for new patient engagement module', objective: 'product_launch', status: 'active', budget_total: 55000, budget_spent: 32000, days_remaining: 30, roi: 420, conversions: 156, ai_managed: false, performance_score: 96 },
    { name: 'Healthcare CIO Nurture Program', description: 'Long-term nurture campaign targeting healthcare CIOs with case studies and thought leadership', objective: 'nurture', status: 'active', budget_total: 15000, budget_spent: 9200, days_remaining: 45, roi: 520, conversions: 34, ai_managed: true, performance_score: 88 },
    { name: 'Interoperability Webinar Series', description: 'Monthly webinar series on healthcare data interoperability and FHIR standards', objective: 'thought_leadership', status: 'active', budget_total: 12000, budget_spent: 7800, days_remaining: 60, roi: 380, conversions: 210, ai_managed: false, performance_score: 92 },
  ],

  content: [
    { title: '5 Ways AI is Transforming Patient Triage in Emergency Departments', body: 'Discover how artificial intelligence is revolutionizing emergency department workflows, reducing wait times by up to 35%, and improving patient outcome scores.', content_type: 'blog_post', channels: ['blog', 'linkedin', 'email'], status: 'published', tags: ['AI', 'emergency-medicine', 'thought-leadership'], performance: { impressions: 34500, clicks: 2890, shares: 456, conversions: 67 } },
    { title: 'The Complete Guide to Healthcare Data Interoperability', body: 'A comprehensive guide covering FHIR standards, HL7 integration, and practical steps for achieving seamless data exchange between healthcare systems.', content_type: 'whitepaper', channels: ['email', 'linkedin'], status: 'published', tags: ['interoperability', 'FHIR', 'guide'], performance: { impressions: 12300, clicks: 1560, shares: 234, conversions: 89 } },
    { title: 'Case Study: How Amsterdam UMC Reduced Administrative Burden by 40%', body: 'Learn how one of the Netherlands\' top academic hospitals implemented MedFlow to streamline clinical documentation and free up 12 hours per week per physician.', content_type: 'case_study', channels: ['email', 'linkedin', 'blog'], status: 'published', tags: ['case-study', 'ROI', 'academic-hospital'] },
    { title: 'GDPR Compliance in Digital Health: What Every Hospital Needs to Know', body: 'Navigate the complexities of GDPR compliance in healthcare with this practical guide for hospital IT and compliance teams.', content_type: 'blog_post', channels: ['blog', 'linkedin'], status: 'published', tags: ['GDPR', 'compliance', 'security'] },
    { title: 'Patient Engagement in 2026: Beyond the Portal', body: 'Explore the future of patient engagement, from AI-powered chatbots to predictive health monitoring and personalized care pathways.', content_type: 'blog_post', channels: ['blog', 'linkedin', 'twitter'], status: 'published', tags: ['patient-engagement', 'trends', 'innovation'] },
    { title: 'ROI Calculator: Clinical Workflow Automation', body: 'Interactive tool showing the financial impact of automating clinical workflows based on hospital size, specialty mix, and current efficiency metrics.', content_type: 'interactive', channels: ['email', 'linkedin'], status: 'published', tags: ['ROI', 'calculator', 'lead-magnet'] },
    { title: 'Webinar: AI-Powered Clinical Decision Support — Friend or Foe?', body: 'Join our panel of leading clinicians and AI researchers as they discuss the promise and pitfalls of AI in clinical decision-making.', content_type: 'webinar', channels: ['email', 'linkedin', 'facebook'], status: 'published', tags: ['webinar', 'AI', 'clinical-decision-support'] },
    { title: 'Infographic: The State of Healthcare IT in Europe 2026', body: 'Visual overview of healthcare IT adoption, digital health investment trends, and technology priorities across European hospitals.', content_type: 'infographic', channels: ['linkedin', 'twitter', 'instagram'], status: 'published', tags: ['infographic', 'market-data', 'europe'] },
    { title: 'How to Build a Business Case for Healthcare AI', body: 'Step-by-step guide for healthcare leaders on building a compelling business case for AI investment, including ROI frameworks and stakeholder alignment.', content_type: 'guide', channels: ['email', 'blog'], status: 'scheduled', tags: ['business-case', 'AI', 'leadership'] },
    { title: 'Video: Customer Success Story — Erasmus MC', body: 'Watch how Erasmus MC Rotterdam improved patient flow and reduced wait times with MedFlow\'s AI-powered scheduling module.', content_type: 'video', channels: ['youtube', 'linkedin', 'email'], status: 'scheduled', tags: ['video', 'customer-story', 'testimonial'] },
    { title: 'Telehealth Integration: Connecting Virtual and In-Person Care', body: 'How MedFlow bridges the gap between telehealth and in-person visits with unified patient records and seamless handoffs.', content_type: 'blog_post', channels: ['blog', 'linkedin'], status: 'draft', tags: ['telehealth', 'integration', 'patient-care'] },
    { title: 'Social Post: HIMSS Europe Preview', body: 'We\'re excited to announce our presence at HIMSS Europe 2026! Visit booth #247 for live demos of our new Patient Engagement Platform.', content_type: 'social_post', channels: ['linkedin', 'twitter', 'facebook'], status: 'scheduled', tags: ['event', 'HIMSS', 'announcement'] },
    { title: 'Email: Monthly Healthcare Innovation Digest', body: 'Curated monthly newsletter featuring the latest in healthcare technology, clinical AI breakthroughs, and MedFlow product updates.', content_type: 'newsletter', channels: ['email'], status: 'published', tags: ['newsletter', 'monthly', 'innovation'] },
    { title: 'Podcast: Digital Health Leaders — Episode 12', body: 'Interview with Dr. van der Berg on the future of AI in academic hospitals and lessons learned from large-scale digital transformation.', content_type: 'podcast', channels: ['spotify', 'linkedin', 'email'], status: 'draft', tags: ['podcast', 'interview', 'thought-leadership'] },
    { title: 'LinkedIn Carousel: 7 KPIs Every Hospital CDO Should Track', body: 'Visual guide to the most important digital health KPIs, from patient satisfaction scores to system uptime and interoperability metrics.', content_type: 'carousel', channels: ['linkedin'], status: 'published', tags: ['carousel', 'KPIs', 'CDO'] },
  ],

  competitors: [
    { name: 'MediTech Pro', description: 'Legacy healthcare IT vendor with strong EHR market presence', website: 'meditechpro.com', market_share: 28, strengths: ['Large install base', 'Comprehensive EHR', 'Strong hospital partnerships'], weaknesses: ['Slow innovation', 'Complex implementation', 'Poor user experience'] },
    { name: 'CareCloud AI', description: 'Fast-growing startup focused on AI-powered healthcare analytics', website: 'carecloud-ai.com', market_share: 12, strengths: ['Strong AI capabilities', 'Modern interface', 'Quick deployment'], weaknesses: ['Limited enterprise features', 'Small customer base', 'No on-premise option'] },
    { name: 'HealthBridge Systems', description: 'Mid-market player specializing in healthcare data integration', website: 'healthbridgesystems.eu', market_share: 18, strengths: ['Best-in-class interoperability', 'FHIR expertise', 'Strong EU presence'], weaknesses: ['No AI features', 'Limited analytics', 'Basic reporting'] },
    { name: 'VitalConnect Platform', description: 'Patient engagement and remote monitoring specialist', website: 'vitalconnect.io', market_share: 8, strengths: ['Excellent patient experience', 'Remote monitoring', 'Mobile-first'], weaknesses: ['Narrow focus', 'No workflow automation', 'Limited integrations'] },
  ],

  events: [
    { name: 'HIMSS Europe 2026', type: 'conference', description: 'Largest healthcare IT conference in Europe with 8,000+ attendees', location: 'RAI Amsterdam', city: 'Amsterdam', country: 'Netherlands', date_start: daysFromNow(18), date_end: daysFromNow(21), expected_attendees: 8500, target_audience_match: 92, estimated_roi: 450, estimated_leads: 85, networking_value: 95, cost: 25000, topics: ['Digital Health', 'AI in Healthcare', 'Interoperability', 'Patient Engagement'], status: 'confirmed', priority_score: 98 },
    { name: 'Digital Health Summit Berlin', type: 'summit', description: 'Exclusive summit for healthcare digital transformation leaders', location: 'Berlin Congress Center', city: 'Berlin', country: 'Germany', date_start: daysFromNow(45), date_end: daysFromNow(46), expected_attendees: 1200, target_audience_match: 88, estimated_roi: 320, estimated_leads: 35, networking_value: 90, cost: 8000, topics: ['Digital Transformation', 'Healthcare AI', 'Value-based Care'], status: 'evaluating', priority_score: 85 },
    { name: 'FHIR DevDays', type: 'technical', description: 'Premier conference for FHIR and healthcare interoperability standards', location: 'Amsterdam', city: 'Amsterdam', country: 'Netherlands', date_start: daysFromNow(60), date_end: daysFromNow(62), expected_attendees: 600, target_audience_match: 75, estimated_roi: 180, estimated_leads: 20, networking_value: 80, cost: 5000, topics: ['FHIR', 'HL7', 'Interoperability', 'API Standards'], status: 'evaluating', priority_score: 72 },
  ],

  personas: [
    { name: 'Dr. Digital — The Healthcare CIO', description: 'Experienced healthcare IT leader managing digital transformation for a large hospital system', demographics: { age: '45-55', education: 'MD + MBA', income: '€180K-€250K', location: 'Urban hospital system' }, psychographics: { motivation: 'Modernize legacy systems', decision_style: 'Data-driven, consensus-builder', risk_tolerance: 'Moderate — needs proven ROI' }, pain_points: ['Legacy system integration complexity', 'Budget constraints', 'Staff resistance to change', 'Compliance requirements'], goals: ['Reduce operational costs by 25%', 'Improve patient satisfaction scores', 'Achieve full interoperability'], preferred_channels: ['LinkedIn', 'Email', 'Industry conferences', 'Peer recommendations'] },
    { name: 'Maria — The Clinical Operations Manager', description: 'Mid-level manager responsible for day-to-day clinical workflow efficiency', demographics: { age: '35-45', education: 'Nursing + Healthcare Management', income: '€75K-€100K', location: 'Regional hospital' }, psychographics: { motivation: 'Reduce administrative burden for clinical staff', decision_style: 'Practical, user-experience focused', risk_tolerance: 'Low — needs quick wins and easy adoption' }, pain_points: ['Paper-based processes', 'Staff burnout', 'Inefficient patient flow', 'Multiple disconnected systems'], goals: ['Save 10+ hours/week on admin tasks', 'Improve staff satisfaction', 'Better patient flow management'], preferred_channels: ['Email', 'Webinars', 'Professional associations', 'Case studies'] },
    { name: 'Tech-Forward Thomas — The Innovation Director', description: 'Forward-thinking executive exploring cutting-edge health technologies', demographics: { age: '38-48', education: 'Computer Science + Healthcare Informatics', income: '€120K-€160K', location: 'Academic medical center' }, psychographics: { motivation: 'Lead digital innovation in healthcare', decision_style: 'Early adopter, technology-first', risk_tolerance: 'High — willing to pilot new solutions' }, pain_points: ['Slow procurement processes', 'Vendor lock-in', 'Proving ROI for innovation projects', 'Data silos'], goals: ['Implement AI across clinical workflows', 'Build a connected health ecosystem', 'Publish research on digital health outcomes'], preferred_channels: ['LinkedIn', 'Tech conferences', 'Academic publications', 'Developer documentation'] },
  ],

  products: [
    { name: 'MedFlow Clinical Hub', description: 'AI-powered clinical workflow management platform that streamlines documentation, scheduling, and care coordination', category: 'Platform', status: 'active', price_range: '€50K-€200K/year', target_audience: 'Hospitals with 200+ beds', key_features: ['AI clinical documentation', 'Smart scheduling', 'Care pathway automation', 'Real-time dashboards'], competitive_advantages: ['40% admin reduction', 'FHIR-native architecture', '99.99% uptime SLA'] },
    { name: 'MedFlow Patient Connect', description: 'Patient engagement platform with portal, messaging, appointment booking, and health tracking', category: 'Module', status: 'active', price_range: '€20K-€80K/year', target_audience: 'All healthcare organizations', key_features: ['Patient portal', 'Secure messaging', 'Telehealth integration', 'Health tracking'], competitive_advantages: ['95% patient satisfaction', 'Multi-language support', 'Accessibility compliant'] },
    { name: 'MedFlow Analytics Pro', description: 'Advanced healthcare analytics with predictive modeling, population health insights, and outcome tracking', category: 'Add-on', status: 'active', price_range: '€15K-€60K/year', target_audience: 'Data-driven health systems', key_features: ['Predictive analytics', 'Population health', 'Outcome tracking', 'Custom reporting'], competitive_advantages: ['AI-powered predictions', 'Real-time data processing', 'Regulatory reporting automation'] },
  ],

  strategicObjectives: [
    { name: 'Market Leadership in EU Healthcare IT', description: 'Become the #1 healthcare workflow platform in Europe by 2027', category: 'growth', target_value: 25, current_value: 18, unit: 'market_share_%', priority: 'high' },
    { name: 'ARR Growth Target', description: 'Achieve €12M ARR by end of 2026', category: 'revenue', target_value: 12000000, current_value: 8400000, unit: 'EUR', priority: 'critical' },
    { name: 'Customer Satisfaction Excellence', description: 'Maintain NPS score above 70 across all products', category: 'customer_success', target_value: 70, current_value: 74, unit: 'NPS', priority: 'high' },
    { name: 'Product Innovation', description: 'Launch 3 new AI-powered modules in 2026', category: 'product', target_value: 3, current_value: 1, unit: 'modules', priority: 'medium' },
  ],

  organizationEntities: [
    { name: 'Product & Engineering', type: 'department', description: 'Core product development, AI/ML research, and platform engineering' },
    { name: 'Sales & Business Development', type: 'department', description: 'Enterprise sales, partner channels, and new market expansion' },
    { name: 'Marketing & Communications', type: 'department', description: 'Brand, content, demand generation, and events' },
    { name: 'Customer Success', type: 'department', description: 'Implementation, training, support, and account management' },
    { name: 'Clinical Advisory Board', type: 'advisory', description: 'External panel of clinicians guiding product development' },
  ],

  // Finance data
  financeCustomers: [
    { name: 'Amsterdam UMC', email: 'finance@amsterdamumc.nl', phone: '+31 20 566 9111', address: 'Meibergdreef 9', city: 'Amsterdam', postal_code: '1105 AZ', country: 'Netherlands', contact_person: 'Dr. Elisabeth van der Berg', kvk_number: '34567890', btw_number: 'NL123456789B01', payment_terms: 30, status: 'active' },
    { name: 'Erasmus MC Rotterdam', email: 'inkoop@erasmusmc.nl', phone: '+31 10 704 0704', address: 'Dr. Molewaterplein 40', city: 'Rotterdam', postal_code: '3015 GD', country: 'Netherlands', contact_person: 'Thomas Bakker', kvk_number: '45678901', btw_number: 'NL234567890B01', payment_terms: 30, status: 'active' },
    { name: 'Charit\u00e9 Berlin', email: 'procurement@charite.de', phone: '+49 30 450 50', address: 'Charit\u00e9platz 1', city: 'Berlin', postal_code: '10117', country: 'Germany', contact_person: 'Prof. Klaus Weber', kvk_number: '', btw_number: 'DE123456789', payment_terms: 45, status: 'active' },
    { name: 'Centre Hospitalier de Bruxelles', email: 'comptabilite@chbruxelles.be', phone: '+32 2 555 3111', address: 'Rue Haute 322', city: 'Brussels', postal_code: '1000', country: 'Belgium', contact_person: 'Marie-Claire Dubois', kvk_number: '', btw_number: 'BE0123456789', payment_terms: 30, status: 'active' },
    { name: 'Isala Ziekenhuis', email: 'crediteuren@isala.nl', phone: '+31 38 424 5000', address: 'Dokter van Heesweg 2', city: 'Zwolle', postal_code: '8025 AB', country: 'Netherlands', contact_person: 'Sarah Jansen', kvk_number: '56789012', btw_number: 'NL345678901B01', payment_terms: 30, status: 'active' },
    { name: 'NHS Greater Manchester', email: 'accounts@nhs-manchester.uk', phone: '+44 161 276 1234', address: 'Oxford Road', city: 'Manchester', postal_code: 'M13 9WL', country: 'United Kingdom', contact_person: 'Dr. Amara Okafor', kvk_number: '', btw_number: 'GB123456789', payment_terms: 60, status: 'active' },
    { name: 'Rigshospitalet Copenhagen', email: 'okonomi@rh.dk', phone: '+45 35 45 35 45', address: 'Blegdamsvej 9', city: 'Copenhagen', postal_code: '2100', country: 'Denmark', contact_person: 'Henrik Andersen', kvk_number: '', btw_number: 'DK12345678', payment_terms: 30, status: 'active' },
    { name: 'UZ Gent', email: 'facturatie@uzgent.be', phone: '+32 9 332 21 11', address: 'Corneel Heymanslaan 10', city: 'Gent', postal_code: '9000', country: 'Belgium', contact_person: 'Pieter Claes', kvk_number: '', btw_number: 'BE0987654321', payment_terms: 30, status: 'active' },
  ],

  financeSuppliers: [
    { name: 'Azure Cloud Services', email: 'billing@microsoft.com', phone: '+1 800 642 7676', address: 'One Microsoft Way', city: 'Redmond', postal_code: '98052', country: 'USA', contact_person: 'Cloud Services Team', kvk_number: '', btw_number: 'US987654321', payment_terms: 30, status: 'active' },
    { name: 'HL7 Europe', email: 'membership@hl7.eu', phone: '+32 2 888 7777', address: 'Brussels Health Hub', city: 'Brussels', postal_code: '1000', country: 'Belgium', contact_person: 'Standards Team', kvk_number: '', btw_number: 'BE0111222333', payment_terms: 15, status: 'active' },
    { name: 'MedTech Marketing Agency', email: 'accounts@medtechagency.nl', phone: '+31 20 555 0100', address: 'Herengracht 100', city: 'Amsterdam', postal_code: '1015 BS', country: 'Netherlands', contact_person: 'Lisa de Groot', kvk_number: '67890123', btw_number: 'NL456789012B01', payment_terms: 14, status: 'active' },
    { name: 'SecureHealth Hosting', email: 'finance@securehealth.eu', phone: '+49 69 555 1234', address: 'Frankfurter Allee 50', city: 'Frankfurt', postal_code: '60311', country: 'Germany', contact_person: 'IT Infrastructure', kvk_number: '', btw_number: 'DE987654321', payment_terms: 30, status: 'active' },
    { name: 'Clinical Talent Partners', email: 'invoicing@clinicaltalent.nl', phone: '+31 30 555 0200', address: 'Stadhuisplein 1', city: 'Utrecht', postal_code: '3511 LH', country: 'Netherlands', contact_person: 'HR Services', kvk_number: '78901234', btw_number: 'NL567890123B01', payment_terms: 14, status: 'active' },
  ],

  financeInvoices: [
    { invoice_type: 'sales', entity_name: 'Amsterdam UMC', description: 'MedFlow Clinical Hub — Annual License Q1 2026', subtotal: 45000, tax_amount: 9450, total_amount: 54450, status: 'paid', days_offset: -60 },
    { invoice_type: 'sales', entity_name: 'Erasmus MC Rotterdam', description: 'MedFlow Patient Connect — Implementation + License', subtotal: 38000, tax_amount: 7980, total_amount: 45980, status: 'paid', days_offset: -45 },
    { invoice_type: 'sales', entity_name: 'Charit\u00e9 Berlin', description: 'MedFlow Clinical Hub — Enterprise License', subtotal: 65000, tax_amount: 12350, total_amount: 77350, status: 'pending', days_offset: -15 },
    { invoice_type: 'sales', entity_name: 'NHS Greater Manchester', description: 'MedFlow Analytics Pro — Annual Subscription', subtotal: 42000, tax_amount: 8400, total_amount: 50400, status: 'pending', days_offset: -10 },
    { invoice_type: 'sales', entity_name: 'Isala Ziekenhuis', description: 'MedFlow Patient Connect — License + Training', subtotal: 28000, tax_amount: 5880, total_amount: 33880, status: 'paid', days_offset: -90 },
    { invoice_type: 'sales', entity_name: 'Centre Hospitalier de Bruxelles', description: 'MedFlow Clinical Hub — Pilot Program', subtotal: 18000, tax_amount: 3780, total_amount: 21780, status: 'overdue', days_offset: -75 },
    { invoice_type: 'sales', entity_name: 'Rigshospitalet Copenhagen', description: 'Consulting — Interoperability Assessment', subtotal: 12500, tax_amount: 2625, total_amount: 15125, status: 'paid', days_offset: -30 },
    { invoice_type: 'sales', entity_name: 'UZ Gent', description: 'MedFlow Analytics Pro — Quarterly License', subtotal: 15000, tax_amount: 3150, total_amount: 18150, status: 'pending', days_offset: -5 },
    { invoice_type: 'purchase', entity_name: 'Azure Cloud Services', description: 'Cloud Hosting — Healthcare Infrastructure Q1', subtotal: 18500, tax_amount: 3885, total_amount: 22385, status: 'paid', days_offset: -30 },
    { invoice_type: 'purchase', entity_name: 'SecureHealth Hosting', description: 'HIPAA-Compliant Backup Services', subtotal: 4500, tax_amount: 855, total_amount: 5355, status: 'paid', days_offset: -45 },
    { invoice_type: 'purchase', entity_name: 'MedTech Marketing Agency', description: 'HIMSS Europe 2026 Campaign Design', subtotal: 12000, tax_amount: 2520, total_amount: 14520, status: 'pending', days_offset: -14 },
    { invoice_type: 'purchase', entity_name: 'Clinical Talent Partners', description: 'Healthcare Domain Expert — 3 month contract', subtotal: 22500, tax_amount: 4725, total_amount: 27225, status: 'paid', days_offset: -60 },
    { invoice_type: 'purchase', entity_name: 'HL7 Europe', description: 'FHIR Implementation Guide License', subtotal: 3200, tax_amount: 672, total_amount: 3872, status: 'paid', days_offset: -20 },
    { invoice_type: 'sales', entity_name: 'Amsterdam UMC', description: 'MedFlow Analytics Pro — Add-on Module', subtotal: 22000, tax_amount: 4620, total_amount: 26620, status: 'draft', days_offset: 0 },
    { invoice_type: 'purchase', entity_name: 'Azure Cloud Services', description: 'Cloud Hosting — Healthcare Infrastructure Q2', subtotal: 19200, tax_amount: 4032, total_amount: 23232, status: 'draft', days_offset: 0 },
  ],

  financeBudgets: [
    { category: 'Cloud Infrastructure', budgeted_amount: 80000, actual_amount: 62500 },
    { category: 'Marketing & Events', budgeted_amount: 120000, actual_amount: 85000 },
    { category: 'Research & Development', budgeted_amount: 350000, actual_amount: 280000 },
    { category: 'Personnel', budgeted_amount: 950000, actual_amount: 720000 },
    { category: 'Compliance & Certifications', budgeted_amount: 45000, actual_amount: 28000 },
    { category: 'Sales & Business Development', budgeted_amount: 85000, actual_amount: 58000 },
  ],

  financeGoals: [
    { goal: 'Achieve €12M ARR', category: 'revenue', target_value: 12000000, current_value: 8400000, unit: 'EUR', status: 'on_track' },
    { goal: 'Maintain gross margin above 75%', category: 'profitability', target_value: 75, current_value: 78, unit: '%', status: 'achieved' },
    { goal: 'Reduce customer acquisition cost by 20%', category: 'efficiency', target_value: 20, current_value: 14, unit: '%', status: 'on_track' },
    { goal: 'Secure Series B funding', category: 'funding', target_value: 15000000, current_value: 0, unit: 'EUR', status: 'in_progress' },
  ],

  yearPlanName: 'MedFlow Solutions — Financial Plan 2026',
};
