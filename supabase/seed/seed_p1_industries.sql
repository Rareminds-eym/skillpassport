-- ============================================================================
-- Seed Data: Industries
-- Source: Master sheet.xlsx - Industry list (Column 3: Description)
-- Date: 2026-06-22
-- Table: public.industries
-- ============================================================================

INSERT INTO public.industries (code, name, description, created_at, updated_at)
VALUES
  ('IND_AGR_001', 'Agriculture, Forestry & Fishing', 'Covers crop production, livestock, forestry, fisheries, and related services focused on producing, harvesting, and managing natural resources.', now(), now()),
  ('IND_MMM_002', 'Mining, Metals & Minerals', 'Includes exploration, extraction, processing, and trading of minerals, metals, and other mined raw materials used across industrial value chains.', now(), now()),
  ('IND_OGP_003', 'Oil, Gas & Petrochemicals', 'Covers upstream, midstream, downstream, and petrochemical activities, including exploration, refining, distribution, and production of fuel- and chemical-based products.', now(), now()),
  ('IND_UPW_004', 'Utilities, Power & Water', 'Includes electricity, gas, water, and waste utility operations, covering generation, distribution, grid management, treatment, metering, and customer service.', now(), now()),
  ('IND_CAM_005', 'Chemicals & Advanced Materials', 'Covers specialty chemicals, industrial chemicals, polymers, composites, coatings, and advanced material innovation for industrial and consumer applications.', now(), now()),
  ('IND_CIE_006', 'Construction, Infrastructure & Engineering', 'Includes building construction, civil infrastructure, engineering services, project management, design, contracting, and maintenance of physical assets.', now(), now()),
  ('IND_MFG_007', 'Industrial Manufacturing', 'Covers production of machinery, equipment, components, industrial products, and factory operations across discrete and process manufacturing environments.', now(), now()),
  ('IND_AME_008', 'Automotive, Mobility & EV', 'Includes automotive manufacturing, mobility platforms, electric vehicles, charging ecosystems, fleet services, connected vehicles, and related supply chains.', now(), now()),
  ('IND_ADS_009', 'Aerospace, Defense & Space', 'Covers aircraft, defense systems, satellites, space platforms, mission systems, and high-reliability engineering for aviation, security, and space applications.', now(), now()),
  ('IND_TLS_010', 'Transportation, Logistics & Supply Chain', 'Includes freight, warehousing, last-mile delivery, shipping, fleet operations, procurement logistics, and end-to-end supply chain planning and execution.', now(), now()),
  ('IND_WDS_011', 'Wholesale & Distribution', 'Covers B2B trade, distribution networks, inventory management, channel sales, dealer operations, and bulk movement of goods between producers and customers.', now(), now()),
  ('IND_RCE_012', 'Retail, Consumer Goods & E-commerce', 'Includes consumer brands, retail operations, marketplaces, direct-to-consumer channels, merchandising, store operations, and digital commerce experiences.', now(), now()),
  ('IND_BCP_013', 'Banking, Capital Markets & Payments', 'Covers banking, lending, investment services, capital markets, cards, digital payments, fintech platforms, risk, compliance, and financial infrastructure.', now(), now()),
  ('IND_INS_014', 'Insurance', 'Includes life, health, property, casualty, and specialty insurance, covering underwriting, claims, distribution, actuarial work, and policy administration.', now(), now()),
  ('IND_REF_015', 'Real Estate & Facilities', 'Covers property development, leasing, brokerage, facilities management, workplace operations, asset maintenance, and real estate portfolio management.', now(), now()),
  ('IND_HPS_016', 'Healthcare Providers & Services', 'Includes hospitals, clinics, diagnostics, care delivery, health systems, patient services, medical operations, and healthcare administration.', now(), now()),
  ('IND_PBM_017', 'Pharma, Biotech & MedTech', 'Covers drug discovery, biotechnology, medical devices, diagnostics, clinical development, manufacturing, regulatory affairs, and commercialization of healthcare products.', now(), now()),
  ('IND_EDS_018', 'Education & Skilling', 'Includes schools, universities, training providers, edtech platforms, workforce skilling, curriculum design, learning delivery, and student services.', now(), now()),
  ('IND_ITS_019', 'Information Technology, Software & Data', 'Covers software products, IT services, cloud platforms, enterprise systems, data engineering, digital transformation, and technology operations.', now(), now()),
  ('IND_TLC_020', 'Telecommunications & Connectivity', 'Includes telecom networks, broadband, mobile services, fiber, IoT connectivity, network infrastructure, customer operations, and communication platforms.', now(), now()),
  ('IND_MEG_021', 'Media, Entertainment & Gaming', 'Covers content creation, publishing, broadcasting, streaming, advertising, gaming media, entertainment platforms, and audience engagement businesses.', now(), now()),
  ('IND_HTT_022', 'Hospitality, Travel & Tourism', 'Includes hotels, airlines, travel platforms, tourism services, restaurants, events, guest experience, reservations, and destination operations.', now(), now()),
  ('IND_GPS_023', 'Government, Public Sector & Smart Cities', 'Covers public administration, civic services, urban infrastructure, smart city programs, digital governance, public utilities, and citizen-facing services.', now(), now()),
  ('IND_LCP_024', 'Legal, Consulting & Professional Services', 'Includes law firms, consulting firms, accounting, advisory, outsourcing, staffing, and other knowledge-based professional service businesses.', now(), now()),
  ('IND_NCS_025', 'Nonprofit, CSR & Social Impact', 'Covers charitable organizations, foundations, CSR programs, social enterprises, development initiatives, grantmaking, advocacy, and impact measurement.', now(), now()),
  ('IND_FNB_026', 'Food & Beverage', 'Includes packaged foods, beverages, food processing, restaurants, agriculture-linked food supply chains, quality, safety, and distribution.', now(), now()),
  ('IND_EGR_027', 'Energy (Generation & Renewables)', 'Covers power generation, renewable energy, energy storage, grid integration, project development, asset operations, and transition-focused energy solutions.', now(), now()),
  ('IND_DAI_028', 'Data & AI', 'Includes data platforms, analytics, machine learning, artificial intelligence products, model operations, data governance, and AI-enabled business solutions.', now(), now()),
  ('IND_CYB_029', 'Cybersecurity', 'Covers security products and services that protect networks, applications, cloud systems, identities, endpoints, data, and organizations from digital threats.', now(), now()),
  ('IND_GAM_030', 'Gaming', 'Includes video game development, publishing, esports, game platforms, monetization, live operations, virtual goods, and interactive entertainment ecosystems.', now(), now()),
  ('IND_CRE_031', 'Creator Economy', 'Covers creators, influencers, creator tools, monetization platforms, content commerce, fan communities, digital media production, and audience-driven businesses.', now(), now()),
  ('IND_HWS_032', 'HR & Workforce Services', 'Includes recruitment, payroll, benefits, workforce management, HR technology, employee experience, staffing, learning, and talent operations.', now(), now()),
  ('IND_DFM_033', 'Defense Manufacturing', 'Covers design, production, assembly, testing, and sustainment of defense equipment, systems, components, and mission-critical manufacturing capabilities.', now(), now()),
  ('IND_SPT_034', 'Sports', 'Includes sports leagues, teams, venues, fitness, sports media, sponsorships, athlete management, fan engagement, and sports technology.', now(), now()),
  ('IND_SPC_035', 'Space Economy', 'Covers commercial space activities including launch, satellites, space data, in-orbit services, ground infrastructure, exploration technologies, and downstream applications.', now(), now());
