/**
 * Stream-Specific Knowledge Tests (30 MCQs per stream)
 * Based on FRD Question Bank
 * 
 * @module features/assessment/data/questions/streamKnowledgeQuestions
 */

export interface StreamKnowledgeQuestion {
  id: string;
  text: string;
  options: string[];
  correct: string;
}

export type StreamId = 'cs' | 'bca' | 'bba' | 'dm' | 'animation';

export const streamKnowledgeQuestions: Record<StreamId, StreamKnowledgeQuestion[]> = {
  cs: [
    // B.Sc Computer Science - 30 questions
    { id: 'knowledge_cs1', text: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Control Processing Unit'], correct: 'Central Processing Unit' },
    { id: 'knowledge_cs2', text: 'Which is a high-level programming language?', options: ['Machine code', 'Python', 'Assembly', 'Binary'], correct: 'Python' },
    { id: 'knowledge_cs3', text: 'DBMS stands for:', options: ['Data Base Management System', 'Digital Binary Manipulation System', 'Data Backup Mailing Service', 'Database Monitoring Software'], correct: 'Data Base Management System' },
    { id: 'knowledge_cs4', text: 'Which manages hardware and software resources?', options: ['Application', 'Operating System', 'Browser', 'Compiler'], correct: 'Operating System' },
    { id: 'knowledge_cs5', text: 'Core of an OS is called:', options: ['Compiler', 'Kernel', 'Browser', 'Editor'], correct: 'Kernel' },
    { id: 'knowledge_cs6', text: 'In OOP, encapsulation means:', options: ['Multiple inheritance', 'Hiding data + methods', 'Code duplication', 'Recursion'], correct: 'Hiding data + methods' },
    { id: 'knowledge_cs7', text: 'A "foreign key" ensures:', options: ['Uniqueness', 'Sort order', 'Referential integrity', 'Faster joins'], correct: 'Referential integrity' },
    { id: 'knowledge_cs8', text: 'Which is NOT a programming paradigm?', options: ['Procedural', 'Object-oriented', 'Functional', 'Alphabetical'], correct: 'Alphabetical' },
    { id: 'knowledge_cs9', text: 'Network device that routes packets:', options: ['Switch', 'Router', 'Hub', 'Repeater'], correct: 'Router' },
    { id: 'knowledge_cs10', text: 'Sorting algorithm stable by default:', options: ['Quicksort', 'Mergesort', 'Heapsort', 'Selection sort'], correct: 'Mergesort' },
    { id: 'knowledge_cs11', text: 'Which loop runs at least once even if condition is false?', options: ['for', 'while', 'do-while', 'foreach'], correct: 'do-while' },
    { id: 'knowledge_cs12', text: 'In Python, len([1,2,3]) returns:', options: ['0', '1', '2', '3'], correct: '3' },
    { id: 'knowledge_cs13', text: 'A stack follows which order?', options: ['FIFO', 'LIFO', 'Random', 'Priority-based'], correct: 'LIFO' },
    { id: 'knowledge_cs14', text: 'Which data structure is best for BFS traversal?', options: ['Stack', 'Queue', 'Heap', 'Tree'], correct: 'Queue' },
    { id: 'knowledge_cs15', text: 'In SQL, SELECT COUNT(*) FROM Students; gives:', options: ['List of names', 'Number of rows', 'Last row', 'Duplicates only'], correct: 'Number of rows' },
    { id: 'knowledge_cs16', text: 'Normalization reduces:', options: ['Speed', 'Redundancy', 'Indexing', 'Constraints'], correct: 'Redundancy' },
    { id: 'knowledge_cs17', text: 'In C/Java, == is used for:', options: ['Assignment', 'Comparison', 'Increment', 'Division'], correct: 'Comparison' },
    { id: 'knowledge_cs18', text: 'Which is a valid IP address?', options: ['300.20.1.1', '192.168.1.10', '45.500.2.1', '12.12.12'], correct: '192.168.1.10' },
    { id: 'knowledge_cs19', text: 'DNS is used to:', options: ['Encrypt data', 'Translate domain to IP', 'Store cookies', 'Route packets'], correct: 'Translate domain to IP' },
    { id: 'knowledge_cs20', text: 'An algorithm is efficient if it uses:', options: ['More time', 'More memory', 'Optimal time & space', 'No loops'], correct: 'Optimal time & space' },
    { id: 'knowledge_cs21', text: 'Output of: x=5, y=2, print(x//y)', options: ['2.5', '2', '3', '10'], correct: '2' },
    { id: 'knowledge_cs22', text: 'Which sorting is fastest on average for large random data?', options: ['Bubble', 'Insertion', 'Quicksort', 'Selection'], correct: 'Quicksort' },
    { id: 'knowledge_cs23', text: 'In a binary tree, maximum children of a node:', options: ['1', '2', '3', 'Unlimited'], correct: '2' },
    { id: 'knowledge_cs24', text: 'Primary key must be:', options: ['Nullable', 'Unique', 'Encrypted', 'Duplicated'], correct: 'Unique' },
    { id: 'knowledge_cs25', text: 'Which is NOT a DBMS?', options: ['MySQL', 'Oracle', 'Excel', 'PostgreSQL'], correct: 'Excel' },
    { id: 'knowledge_cs26', text: 'A compiler converts:', options: ['Machine code to source', 'Source code to machine code', 'Binary to text', 'Data to information'], correct: 'Source code to machine code' },
    { id: 'knowledge_cs27', text: 'HTTP status code 404 means:', options: ['Success', 'Server error', 'Not found', 'Redirect'], correct: 'Not found' },
    { id: 'knowledge_cs28', text: 'In networking, TCP provides:', options: ['Connectionless', 'Reliable connection', 'Broadcast only', 'No error checking'], correct: 'Reliable connection' },
    { id: 'knowledge_cs29', text: 'Big O notation measures:', options: ['Code beauty', 'Algorithm complexity', 'File size', 'Network speed'], correct: 'Algorithm complexity' },
    { id: 'knowledge_cs30', text: 'Git is used for:', options: ['Design', 'Version control', 'Testing', 'Deployment only'], correct: 'Version control' }
  ],

  bca: [
    // BCA General - 20 questions
    { id: 'knowledge_bca1', text: 'HTML tag for hyperlink:', options: ['<p>', '<a>', '<div>', '<h1>'], correct: '<a>' },
    { id: 'knowledge_bca2', text: 'CSS controls:', options: ['Database', 'Page style', 'Server', 'Logic'], correct: 'Page style' },
    { id: 'knowledge_bca3', text: 'Primary purpose of DBMS:', options: ['Design posters', 'Store/manage data', 'Write code', 'Send emails'], correct: 'Store/manage data' },
    { id: 'knowledge_bca4', text: '"Bug" in software means:', options: ['Feature', 'Error', 'Update', 'Backup'], correct: 'Error' },
    { id: 'knowledge_bca5', text: 'Which is an OS?', options: ['MySQL', 'Linux', 'Chrome', 'Python'], correct: 'Linux' },
    { id: 'knowledge_bca6', text: 'Output of: 10 % 3 =', options: ['0', '1', '3', '7'], correct: '1' },
    { id: 'knowledge_bca7', text: 'Cloud computing means:', options: ['Local storage only', 'Internet-based resources', 'Paper files', 'Offline apps'], correct: 'Internet-based resources' },
    { id: 'knowledge_bca8', text: 'Strong password includes:', options: ['Name', '12345', 'Mix of letters/numbers/symbols', 'Birthday'], correct: 'Mix of letters/numbers/symbols' },
    { id: 'knowledge_bca9', text: 'Internet protocol for websites:', options: ['FTP', 'HTTP', 'SMTP', 'POP'], correct: 'HTTP' },
    { id: 'knowledge_bca10', text: 'A "loop" is used to:', options: ['Stop program', 'Repeat actions', 'Print once', 'Store data'], correct: 'Repeat actions' },
    { id: 'knowledge_bca11', text: 'IP address stands for:', options: ['Internet Protocol', 'Internal Process', 'Interface Point', 'International Path'], correct: 'Internet Protocol' },
    { id: 'knowledge_bca12', text: 'Firewall is used for:', options: ['Heating system', 'Network security', 'Data backup', 'File compression'], correct: 'Network security' },
    { id: 'knowledge_bca13', text: 'RAM is:', options: ['Read Access Memory', 'Random Access Memory', 'Readily Available Memory', 'Remote Access Memory'], correct: 'Random Access Memory' },
    { id: 'knowledge_bca14', text: 'USB stands for:', options: ['Universal System Bus', 'Universal Serial Bus', 'United Serial Bus', 'Unified System Bus'], correct: 'Universal Serial Bus' },
    { id: 'knowledge_bca15', text: 'Malware refers to:', options: ['Good software', 'Malicious software', 'Management software', 'Marketing software'], correct: 'Malicious software' },
    { id: 'knowledge_bca16', text: 'Cookie in computing is:', options: ['A snack', 'Data stored on browser', 'Security key', 'Password'], correct: 'Data stored on browser' },
    { id: 'knowledge_bca17', text: 'Backup is important for:', options: ['Speed improvement', 'Data recovery', 'Memory clearing', 'Virus removal'], correct: 'Data recovery' },
    { id: 'knowledge_bca18', text: 'Phishing is:', options: ['Fishing technique', 'Email fraud attack', 'Data encryption', 'Network speed test'], correct: 'Email fraud attack' },
    { id: 'knowledge_bca19', text: 'SSL stands for:', options: ['Secure Sockets Layer', 'System Security Layer', 'Secure Software Layer', 'Standard Socket Link'], correct: 'Secure Sockets Layer' },
    { id: 'knowledge_bca20', text: 'VPN is used for:', options: ['Virus Protection', 'Virtual Private Network', 'Video Processing', 'Volume Power Normalization'], correct: 'Virtual Private Network' }
  ],

  bba: [
    // BBA General - 20 questions
    { id: 'knowledge_bba1', text: 'Profit =', options: ['Revenue – Cost', 'Cost – Revenue', 'Assets – Liabilities', 'Tax – Revenue'], correct: 'Revenue – Cost' },
    { id: 'knowledge_bba2', text: 'Marketing "4Ps" include:', options: ['Price', 'Product', 'Place', 'All of these'], correct: 'All of these' },
    { id: 'knowledge_bba3', text: 'Balance sheet shows:', options: ['Cash flow only', 'Financial position', 'Sales targets', 'HR policy'], correct: 'Financial position' },
    { id: 'knowledge_bba4', text: 'HR function includes:', options: ['Hiring', 'Training', 'Performance appraisal', 'All of these'], correct: 'All of these' },
    { id: 'knowledge_bba5', text: 'Break-even point is where:', options: ['Profit max', 'No profit no loss', 'Loss max', 'Revenue zero'], correct: 'No profit no loss' },
    { id: 'knowledge_bba6', text: 'Operations management focuses on:', options: ['Recruitment', 'Production/service delivery', 'Ads', 'Taxes'], correct: 'Production/service delivery' },
    { id: 'knowledge_bba7', text: 'Market segmentation means:', options: ['One product for all', 'Dividing customers by types', 'Random selling', 'Ignoring demand'], correct: 'Dividing customers by types' },
    { id: 'knowledge_bba8', text: 'GST is a:', options: ['Subsidy', 'Indirect tax', 'Loan', 'Discount'], correct: 'Indirect tax' },
    { id: 'knowledge_bba9', text: 'Inventory turnover indicates:', options: ['Product demand speed', 'Team size', 'Salary growth', 'Brand value'], correct: 'Product demand speed' },
    { id: 'knowledge_bba10', text: 'A KPI is:', options: ['Holiday', 'Key performance indicator', 'Tax rule', 'Legal clause'], correct: 'Key performance indicator' },
    { id: 'knowledge_bba11', text: 'SWOT analysis includes:', options: ['Strengths, Weaknesses, Opportunities, Threats', 'Sales, Wages, Operations, Taxes', 'System, Workflow, Output, Time', 'Strategy, Work, Organization, Team'], correct: 'Strengths, Weaknesses, Opportunities, Threats' },
    { id: 'knowledge_bba12', text: 'ROI stands for:', options: ['Return on Investment', 'Rate of Interest', 'Report on Income', 'Risk of Investment'], correct: 'Return on Investment' },
    { id: 'knowledge_bba13', text: 'Fixed cost is:', options: ['Changes with output', 'Remains constant', 'Only in short run', 'Only in long run'], correct: 'Remains constant' },
    { id: 'knowledge_bba14', text: 'Variable cost:', options: ['Never changes', 'Changes with production level', 'Only in long run', 'Only in short run'], correct: 'Changes with production level' },
    { id: 'knowledge_bba15', text: 'Brand equity means:', options: ['Value of brand name', 'Cost of branding', 'Price of product', 'Logo design cost'], correct: 'Value of brand name' },
    { id: 'knowledge_bba16', text: 'Cash flow statement shows:', options: ['Revenue only', 'Inflow/outflow of cash', 'Employee salaries', 'Marketing expenses'], correct: 'Inflow/outflow of cash' },
    { id: 'knowledge_bba17', text: 'Stakeholders include:', options: ['Only employees', 'All interested parties', 'Only shareholders', 'Only management'], correct: 'All interested parties' },
    { id: 'knowledge_bba18', text: 'Supply chain management involves:', options: ['Product flow from supplier to customer', 'Only manufacturing', 'Only delivery', 'Only procurement'], correct: 'Product flow from supplier to customer' },
    { id: 'knowledge_bba19', text: 'EBITDA stands for:', options: ['Earnings Before Interest, Taxes, Depreciation, Amortization', 'Estimated Budget Income Tax Daily Amount', 'Employee Benefits Insurance Tax Deduction Account', 'Electronic Business Integration Tax Data Analytics'], correct: 'Earnings Before Interest, Taxes, Depreciation, Amortization' },
    { id: 'knowledge_bba20', text: 'Core competency is:', options: ['Basic skill', 'Unique strength of organization', 'Common ability', 'Temporary advantage'], correct: 'Unique strength of organization' }
  ],

  dm: [
    // Digital Marketing - 20 questions
    { id: 'knowledge_dm1', text: 'SEO stands for:', options: ['Search Engine Optimization', 'Social Engagement Option', 'Sales Enablement Org', 'None'], correct: 'Search Engine Optimization' },
    { id: 'knowledge_dm2', text: 'Best goal of a landing page:', options: ['Entertainment', 'Conversion', 'Long story', 'No CTA'], correct: 'Conversion' },
    { id: 'knowledge_dm3', text: 'CTR means:', options: ['Cost to reach', 'Click-through rate', 'Campaign time ratio', 'Customer tracking rule'], correct: 'Click-through rate' },
    { id: 'knowledge_dm4', text: 'Keyword "intent" refers to:', options: ['Font style', 'User purpose', 'Ad budget', 'Platform login'], correct: 'User purpose' },
    { id: 'knowledge_dm5', text: 'Organic traffic is:', options: ['Paid ads', 'Unpaid search visits', 'Bot traffic', 'Offline visits'], correct: 'Unpaid search visits' },
    { id: 'knowledge_dm6', text: 'A/B testing means:', options: ['2 random posts', 'Comparing two versions to see better performance', 'Branding', 'Backlinking'], correct: 'Comparing two versions to see better performance' },
    { id: 'knowledge_dm7', text: 'Retargeting is used to:', options: ['Block users', 'Show ads to past visitors', 'Delete cookies', 'Stop campaigns'], correct: 'Show ads to past visitors' },
    { id: 'knowledge_dm8', text: 'Bounce rate increases when:', options: ['Page slow or irrelevant', 'CTA clear', 'UX good', 'Content matches intent'], correct: 'Page slow or irrelevant' },
    { id: 'knowledge_dm9', text: 'ROAS means:', options: ['Return on ad spend', 'Rate of account signups', 'Revenue on all sales', 'Ratio of audience segments'], correct: 'Return on ad spend' },
    { id: 'knowledge_dm10', text: 'Social media "reach" is:', options: ['Sales', 'Number of unique users who saw content', 'Comments only', 'Ad cost'], correct: 'Number of unique users who saw content' },
    { id: 'knowledge_dm11', text: 'CPC stands for:', options: ['Cost Per Click', 'Customer Product Cost', 'Campaign Promotion Code', 'Content Publishing Channel'], correct: 'Cost Per Click' },
    { id: 'knowledge_dm12', text: 'Impression means:', options: ['Click on ad', 'View of ad', 'Sale from ad', 'Share of ad'], correct: 'View of ad' },
    { id: 'knowledge_dm13', text: 'Content marketing focuses on:', options: ['Creating valuable content', 'Only paid ads', 'Only social media', 'Only email'], correct: 'Creating valuable content' },
    { id: 'knowledge_dm14', text: 'Email marketing open rate shows:', options: ['People who opened email', 'People who clicked link', 'People who unsubscribed', 'People who forwarded'], correct: 'People who opened email' },
    { id: 'knowledge_dm15', text: 'Backlink means:', options: ['Link from another site to your site', 'Link within your site', 'Broken link', 'Paid link'], correct: 'Link from another site to your site' },
    { id: 'knowledge_dm16', text: 'Domain authority measures:', options: ['Site trustworthiness', 'Site speed', 'Site design', 'Site size'], correct: 'Site trustworthiness' },
    { id: 'knowledge_dm17', text: 'Lead magnet is:', options: ['Incentive to get contact info', 'Paid advertisement', 'Social media post', 'Website banner'], correct: 'Incentive to get contact info' },
    { id: 'knowledge_dm18', text: 'Marketing funnel stages include:', options: ['Awareness, Interest, Desire, Action', 'Planning, Execution, Monitoring', 'Design, Development, Testing', 'Research, Analysis, Reporting'], correct: 'Awareness, Interest, Desire, Action' },
    { id: 'knowledge_dm19', text: 'Influencer marketing uses:', options: ['Popular personalities to promote', 'Only paid ads', 'Only email', 'Only SEO'], correct: 'Popular personalities to promote' },
    { id: 'knowledge_dm20', text: 'Google Analytics tracks:', options: ['Website traffic and behavior', 'Only sales', 'Only social media', 'Only emails'], correct: 'Website traffic and behavior' }
  ],

  animation: [
    // Animation - 20 questions
    { id: 'knowledge_anim1', text: '"Frame rate" means:', options: ['Resolution', 'Frames per second', 'File size', 'Color depth'], correct: 'Frames per second' },
    { id: 'knowledge_anim2', text: '12 principles of animation include:', options: ['Squash & stretch', 'Anticipation', 'Timing', 'All of these'], correct: 'All of these' },
    { id: 'knowledge_anim3', text: 'Keyframes are:', options: ['Random frames', 'Defining important motion points', 'Sound files', 'Textures'], correct: 'Defining important motion points' },
    { id: 'knowledge_anim4', text: 'Storyboarding is used to:', options: ['Code apps', 'Plan scenes visually', 'Edit audio', 'Compress files'], correct: 'Plan scenes visually' },
    { id: 'knowledge_anim5', text: 'Perspective helps in:', options: ['Flatness', 'Depth/3D feel', 'Speed', 'Sound'], correct: 'Depth/3D feel' },
    { id: 'knowledge_anim6', text: 'Rigging is:', options: ['Coloring', 'Adding skeleton/control to character', 'Exporting file', 'Rendering'], correct: 'Adding skeleton/control to character' },
    { id: 'knowledge_anim7', text: 'Rendering means:', options: ['Sketching', 'Generating final output frames', 'Scripting', 'Retopology'], correct: 'Generating final output frames' },
    { id: 'knowledge_anim8', text: 'Onion skinning helps in:', options: ['Lighting', 'Seeing previous/next frames', 'Sound sync', 'Textures'], correct: 'Seeing previous/next frames' },
    { id: 'knowledge_anim9', text: 'Composition refers to:', options: ['File format', 'Arrangement of visual elements', 'CPU bloat', 'Export fps'], correct: 'Arrangement of visual elements' },
    { id: 'knowledge_anim10', text: 'Motion graphics is:', options: ['Still art', 'Animated design elements for communication', 'Only 3D gaming', 'Coding'], correct: 'Animated design elements for communication' },
    { id: 'knowledge_anim11', text: 'Vector graphics are:', options: ['Resolution independent', 'Pixel based', 'Only for print', 'Only for web'], correct: 'Resolution independent' },
    { id: 'knowledge_anim12', text: 'Raster graphics are:', options: ['Pixel based', 'Math based', 'Only for logos', 'Only for animation'], correct: 'Pixel based' },
    { id: 'knowledge_anim13', text: 'Tweening means:', options: ['Generating in-between frames', 'Adding color', 'Exporting video', 'Adding sound'], correct: 'Generating in-between frames' },
    { id: 'knowledge_anim14', text: 'Rotoscoping is:', options: ['Tracing over live footage', 'Creating 3D models', 'Adding music', 'Color grading'], correct: 'Tracing over live footage' },
    { id: 'knowledge_anim15', text: 'Walk cycle is:', options: ['Character walking sequence', 'Camera movement', 'Scene transition', 'Lighting setup'], correct: 'Character walking sequence' },
    { id: 'knowledge_anim16', text: 'Morphing means:', options: ['Transforming one shape to another', 'Adding color', 'Adding sound', 'Adding text'], correct: 'Transforming one shape to another' },
    { id: 'knowledge_anim17', text: 'Stop motion uses:', options: ['Physical objects moved frame by frame', 'Only computer graphics', 'Only live actors', 'Only drawings'], correct: 'Physical objects moved frame by frame' },
    { id: 'knowledge_anim18', text: 'Timecode is used to:', options: ['Identify specific frames/times', 'Add color', 'Add sound', 'Compress file'], correct: 'Identify specific frames/times' },
    { id: 'knowledge_anim19', text: 'Model sheet shows:', options: ['Character from multiple angles', 'Only one pose', 'Only background', 'Only colors'], correct: 'Character from multiple angles' },
    { id: 'knowledge_anim20', text: 'Alpha channel controls:', options: ['Transparency', 'Brightness', 'Contrast', 'Saturation'], correct: 'Transparency' }
  ]
};
