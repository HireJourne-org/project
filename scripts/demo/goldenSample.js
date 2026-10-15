// Golden Sample for the ActNow and VHS demos.
// Every person and company here is fictional, so demos never present
// invented market data about a real business.

export const demoProfile = {
  full_name: 'Jordan Reyes',
  headline: 'Transitioning Army Logistics NCO → Operations / Supply Chain',
  career_evidence: `Sergeant First Class (E-7), U.S. Army, 92A Automated Logistical Specialist / 92Y Unit Supply, 14 years.

- Brigade Support Battalion Supply Support Activity (SSA) NCOIC: ran a 3,200-line warehouse, $48M inventory, 99.2% accountability across 3 annual audits.
- Led 26 soldiers across receiving, storage, issue and turn-in; trained and certified 40+ operators on GCSS-Army (SAP-based ERP).
- Planned and executed a 1,100-container theater redeployment (sea + rail + line-haul) with zero sensitive-item losses; coordinated with 4 commercial carriers.
- Cut requisition-to-issue time 31% by redesigning slotting and introducing daily cycle counts.
- Managed the Class IX repair-parts program and a $2.1M annual budget; reconciled monthly with finance.
- Deployments: Kuwait (2), Poland (rotational, NATO multinational logistics).
- Lean Six Sigma Green Belt; CompTIA Project+; Secret clearance (active).
- Transitioning via SkillBridge; target roles: Operations Manager, Distribution Center Manager, Supply Chain Program Manager. Open to Texas, Georgia, Tennessee.`,
};

export const demoStrategies = [
  {
    company_name: 'Meridian Freight Systems',
    inputs: {
      demo: true,
      market: { source: 'SimilarIQ', industry: '3PL / freight brokerage', employees: '2,400', revenue_trend: 'growing', hiring_signal: 'Expanding Southeast distribution network; 3 new DCs announced' },
      tech: { source: 'TinyFish', stack: ['SAP S/4HANA', 'Manhattan WMS', 'Power BI'], team: 'Ops leadership includes several veteran hires; formal veteran ERG' },
      jobDescription: 'Operations Manager, Distribution Center (Memphis, TN)',
    },
    strategy: {
      fit_score: 88,
      fit_tier: 'strong_target',
      primary_signal: 'both',
      why: 'Both feeds point the same way: Meridian is growing its Southeast DC footprint, and its stack (SAP + Manhattan WMS) maps directly to Jordan\'s GCSS-Army (SAP) and SSA warehouse experience. Running a 3,200-line, $48M inventory operation with near-perfect accountability is the core of a DC Operations Manager role.',
      evidence_matches: [
        { career_evidence: 'SSA NCOIC, 3,200-line warehouse, $48M inventory', company_signal: '3 new distribution centers being stood up', source: 'market' },
        { career_evidence: 'Trained 40+ operators on GCSS-Army (SAP-based ERP)', company_signal: 'SAP S/4HANA + Manhattan WMS', source: 'tech' },
        { career_evidence: 'Led 26 soldiers across receiving, storage and issue', company_signal: 'DC Operations Manager owns inbound/outbound teams', source: 'market' },
      ],
      source_conflicts: [],
      gaps: ['No direct Manhattan WMS experience; frame GCSS-Army as SAP warehouse-management experience.'],
      proposed_moves: [
        'Apply to the Memphis DC Operations Manager role with a resume that leads with the $48M / 99.2% accountability result.',
        'Request an intro through the veteran ERG before applying.',
        'Prepare a STAR story on the 31% requisition-to-issue improvement.',
      ],
    },
  },
  {
    company_name: 'Northstar Fulfillment',
    inputs: {
      demo: true,
      market: { source: 'SimilarIQ', industry: 'E-commerce fulfillment', employees: '850', revenue_trend: 'flat', hiring_signal: 'Limited open roles; cost-reduction initiative announced' },
      tech: { source: 'TinyFish', stack: ['NetSuite', 'custom WMS', 'Lean/Kaizen program'], team: 'Hiring a Continuous Improvement Lead; heavy Lean culture' },
      jobDescription: 'Continuous Improvement Lead (Atlanta, GA)',
    },
    strategy: {
      fit_score: 71,
      fit_tier: 'viable_target',
      primary_signal: 'tech',
      why: 'The market feed reads as a cautious, flat company, but the tech/culture feed shows a specific Lean-focused role that fits Jordan\'s Green Belt and measured process wins. A cost-reduction push makes a proven process improver more valuable, not less.',
      evidence_matches: [
        { career_evidence: 'Lean Six Sigma Green Belt', company_signal: 'Formal Lean/Kaizen program', source: 'tech' },
        { career_evidence: 'Cut requisition-to-issue time 31% via slotting redesign and cycle counts', company_signal: 'Cost-reduction initiative', source: 'market' },
      ],
      source_conflicts: [
        { topic: 'Hiring outlook', market_says: 'Limited open roles, cost cutting', tech_says: 'Actively hiring a Continuous Improvement Lead', resolution: 'Trust the tech feed for this role: cost-reduction programs typically create CI roles even during broad hiring slowdowns.' },
      ],
      gaps: ['Smaller company; title may be individual contributor rather than people leader.'],
      proposed_moves: [
        'Apply to the Continuous Improvement Lead role, leading with Lean results and dollar impact.',
        'Quantify the 31% improvement in cost terms before the first interview.',
      ],
    },
  },
  {
    company_name: 'Harborline Logistics',
    inputs: {
      demo: true,
      market: { source: 'SimilarIQ', industry: 'Intermodal / port logistics', employees: '5,100', revenue_trend: 'growing', hiring_signal: 'Gulf Coast port expansion; program management roles open' },
      tech: { source: 'TinyFish', stack: ['Oracle TMS', 'Tableau'], team: 'Program managers typically have PMP and a commercial shipping background' },
      jobDescription: 'Supply Chain Program Manager, Port Operations (Houston, TX)',
    },
    strategy: {
      fit_score: 64,
      fit_tier: 'viable_target',
      primary_signal: 'market',
      why: 'Harborline\'s port expansion is a close match for Jordan\'s 1,100-container sea/rail/line-haul redeployment, and Houston is a target location. The tech feed shows a team that favours PMP holders with commercial shipping experience, which is the main gap to close.',
      evidence_matches: [
        { career_evidence: 'Planned 1,100-container theater redeployment (sea + rail + line-haul)', company_signal: 'Gulf Coast port expansion', source: 'market' },
        { career_evidence: 'Coordinated with 4 commercial carriers', company_signal: 'Intermodal carrier network', source: 'market' },
        { career_evidence: 'CompTIA Project+', company_signal: 'Program managers typically hold PMP', source: 'tech' },
      ],
      source_conflicts: [
        { topic: 'Candidate profile', market_says: 'Growth means many PM openings', tech_says: 'Team skews to PMP + commercial shipping backgrounds', resolution: 'Viable but competitive; position the redeployment as a commercial-scale intermodal program.' },
      ],
      gaps: ['No PMP (has Project+).', 'No commercial port experience.'],
      proposed_moves: [
        'Start PMP prep; Project+ and deployment program hours shorten the path.',
        'Rewrite the redeployment bullet in commercial terms (TEUs, carriers, on-time %).',
      ],
    },
  },
  {
    company_name: 'Vantage Cold Chain',
    inputs: {
      demo: true,
      market: { source: 'SimilarIQ', industry: 'Pharmaceutical cold-chain logistics', employees: '1,300', revenue_trend: 'growing', hiring_signal: 'Opening a new GDP-certified facility' },
      tech: { source: 'TinyFish', stack: ['Temperature telemetry', 'Validated WMS'], team: 'Ops managers require GDP/GMP compliance experience' },
      jobDescription: 'Facility Operations Manager (Nashville, TN)',
    },
    strategy: {
      fit_score: 46,
      fit_tier: 'stretch',
      primary_signal: 'market',
      why: 'Strong market momentum and a Nashville location fit, and Jordan\'s inventory accountability and audit record are relevant. But the tech feed shows regulated pharma compliance (GDP/GMP) is a hard requirement Jordan doesn\'t yet have, so this is a stretch for now.',
      evidence_matches: [
        { career_evidence: '99.2% accountability across 3 annual audits', company_signal: 'Validated, audit-heavy operations', source: 'tech' },
        { career_evidence: 'Open to Tennessee', company_signal: 'New Nashville facility', source: 'market' },
      ],
      source_conflicts: [
        { topic: 'Accessibility of the role', market_says: 'New facility, many openings', tech_says: 'GDP/GMP experience required for managers', resolution: 'Trust the tech feed on requirements; target a supervisor role first or earn a GDP certificate.' },
      ],
      gaps: ['No GDP/GMP or pharma compliance experience.'],
      proposed_moves: [
        'Take a short GDP fundamentals course before applying.',
        'Consider an Operations Supervisor role as an entry point.',
      ],
    },
  },
];
