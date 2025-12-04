// Stream-Specific Knowledge Tests (30 MCQs per stream)
// Based on FRD Question Bank

export const streamKnowledgeQuestions = {
    cs: [
        // B.Sc Computer Science - 30 questions
        { id: 'cs1', text: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Control Processing Unit'], correct: 'Central Processing Unit' },
        { id: 'cs2', text: 'Which is a high-level programming language?', options: ['Machine code', 'Python', 'Assembly', 'Binary'], correct: 'Python' },
        { id: 'cs3', text: 'DBMS stands for:', options: ['Data Base Management System', 'Digital Binary Manipulation System', 'Data Backup Mailing Service', 'Database Monitoring Software'], correct: 'Data Base Management System' },
        { id: 'cs4', text: 'Which manages hardware and software resources?', options: ['Application', 'Operating System', 'Browser', 'Compiler'], correct: 'Operating System' },
        { id: 'cs5', text: 'Core of an OS is called:', options: ['Compiler', 'Kernel', 'Browser', 'Editor'], correct: 'Kernel' },
        { id: 'cs6', text: 'In OOP, encapsulation means:', options: ['Multiple inheritance', 'Hiding data + methods', 'Code duplication', 'Recursion'], correct: 'Hiding data + methods' },
        { id: 'cs7', text: 'A "foreign key" ensures:', options: ['Uniqueness', 'Sort order', 'Referential integrity', 'Faster joins'], correct: 'Referential integrity' },
        { id: 'cs8', text: 'Which is NOT a programming paradigm?', options: ['Procedural', 'Object-oriented', 'Functional', 'Alphabetical'], correct: 'Alphabetical' },
        { id: 'cs9', text: 'Network device that routes packets:', options: ['Switch', 'Router', 'Hub', 'Repeater'], correct: 'Router' },
        { id: 'cs10', text: 'Sorting algorithm stable by default:', options: ['Quicksort', 'Mergesort', 'Heapsort', 'Selection sort'], correct: 'Mergesort' },
        { id: 'cs11', text: 'Which loop runs at least once even if condition is false?', options: ['for', 'while', 'do-while', 'foreach'], correct: 'do-while' },
        { id: 'cs12', text: 'In Python, len([1,2,3]) returns:', options: ['0', '1', '2', '3'], correct: '3' },
        { id: 'cs13', text: 'A stack follows which order?', options: ['FIFO', 'LIFO', 'Random', 'Priority-based'], correct: 'LIFO' },
        { id: 'cs14', text: 'Which data structure is best for BFS traversal?', options: ['Stack', 'Queue', 'Heap', 'Tree'], correct: 'Queue' },
        { id: 'cs15', text: 'In SQL, SELECT COUNT(*) FROM Students; gives:', options: ['List of names', 'Number of rows', 'Last row', 'Duplicates only'], correct: 'Number of rows' },
        { id: 'cs16', text: 'Normalization reduces:', options: ['Speed', 'Redundancy', 'Indexing', 'Constraints'], correct: 'Redundancy' },
        { id: 'cs17', text: 'In C/Java, == is used for:', options: ['Assignment', 'Comparison', 'Increment', 'Division'], correct: 'Comparison' },
        { id: 'cs18', text: 'Which is a valid IP address?', options: ['300.20.1.1', '192.168.1.10', '45.500.2.1', '12.12.12'], correct: '192.168.1.10' },
        { id: 'cs19', text: 'DNS is used to:', options: ['Encrypt data', 'Translate domain to IP', 'Store cookies', 'Route packets'], correct: 'Translate domain to IP' },
        { id: 'cs20', text: 'An algorithm is efficient if it uses:', options: ['More time', 'More memory', 'Optimal time & space', 'No loops'], correct: 'Optimal time & space' },
        { id: 'cs21', text: 'Output of: x=5, y=2, print(x//y)', options: ['2.5', '2', '3', '10'], correct: '2' },
        { id: 'cs22', text: 'Which sorting is fastest on average for large random data?', options: ['Bubble', 'Insertion', 'Quicksort', 'Selection'], correct: 'Quicksort' },
        { id: 'cs23', text: 'In a binary tree, maximum children of a node:', options: ['1', '2', '3', 'Unlimited'], correct: '2' },
        { id: 'cs24', text: 'Primary key must be:', options: ['Nullable', 'Unique', 'Encrypted', 'Duplicated'], correct: 'Unique' },
        { id: 'cs25', text: 'Which is NOT a DBMS?', options: ['MySQL', 'Oracle', 'Excel', 'PostgreSQL'], correct: 'Excel' },
        { id: 'cs26', text: 'A compiler converts:', options: ['Machine code to source', 'Source code to machine code', 'Binary to text', 'Data to information'], correct: 'Source code to machine code' },
        { id: 'cs27', text: 'HTTP status code 404 means:', options: ['Success', 'Server error', 'Not found', 'Redirect'], correct: 'Not found' },
        { id: 'cs28', text: 'In networking, TCP provides:', options: ['Connectionless', 'Reliable connection', 'Broadcast only', 'No error checking'], correct: 'Reliable connection' },
        { id: 'cs29', text: 'Big O notation measures:', options: ['Code beauty', 'Algorithm complexity', 'File size', 'Network speed'], correct: 'Algorithm complexity' },
        { id: 'cs30', text: 'Git is used for:', options: ['Design', 'Version control', 'Testing', 'Deployment only'], correct: 'Version control' }
    ],

    bca: [
        // BCA General - 30 questions (sample - you can expand)
        { id: 'bca1', text: 'HTML tag for hyperlink:', options: ['<p>', '<a>', '<div>', '<h1>'], correct: '<a>' },
        { id: 'bca2', text: 'CSS controls:', options: ['Database', 'Page style', 'Server', 'Logic'], correct: 'Page style' },
        { id: 'bca3', text: 'Primary purpose of DBMS:', options: ['Design posters', 'Store/manage data', 'Write code', 'Send emails'], correct: 'Store/manage data' },
        { id: 'bca4', text: '"Bug" in software means:', options: ['Feature', 'Error', 'Update', 'Backup'], correct: 'Error' },
        { id: 'bca5', text: 'Which is an OS?', options: ['MySQL', 'Linux', 'Chrome', 'Python'], correct: 'Linux' },
        // Add remaining 25 questions...
        { id: 'bca6', text: 'Output of: 10 % 3 =', options: ['0', '1', '3', '7'], correct: '1' },
        { id: 'bca7', text: 'Cloud computing means:', options: ['Local storage only', 'Internet-based resources', 'Paper files', 'Offline apps'], correct: 'Internet-based resources' },
        { id: 'bca8', text: 'Strong password includes:', options: ['Name', '12345', 'Mix of letters/numbers/symbols', 'Birthday'], correct: 'Mix of letters/numbers/symbols' },
        { id: 'bca9', text: 'Internet protocol for websites:', options: ['FTP', 'HTTP', 'SMTP', 'POP'], correct: 'HTTP' },
        { id: 'bca10', text: 'A "loop" is used to:', options: ['Stop program', 'Repeat actions', 'Print once', 'Store data'], correct: 'Repeat actions' }
    ],

    bba: [
        // BBA General - 30 questions (sample)
        { id: 'bba1', text: 'Profit =', options: ['Revenue – Cost', 'Cost – Revenue', 'Assets – Liabilities', 'Tax – Revenue'], correct: 'Revenue – Cost' },
        { id: 'bba2', text: 'Marketing "4Ps" include:', options: ['Price', 'Product', 'Place', 'All of these'], correct: 'All of these' },
        { id: 'bba3', text: 'Balance sheet shows:', options: ['Cash flow only', 'Financial position', 'Sales targets', 'HR policy'], correct: 'Financial position' },
        { id: 'bba4', text: 'HR function includes:', options: ['Hiring', 'Training', 'Performance appraisal', 'All of these'], correct: 'All of these' },
        { id: 'bba5', text: 'Break-even point is where:', options: ['Profit max', 'No profit no loss', 'Loss max', 'Revenue zero'], correct: 'No profit no loss' },
        { id: 'bba6', text: 'Operations management focuses on:', options: ['Recruitment', 'Production/service delivery', 'Ads', 'Taxes'], correct: 'Production/service delivery' },
        { id: 'bba7', text: 'Market segmentation means:', options: ['One product for all', 'Dividing customers by types', 'Random selling', 'Ignoring demand'], correct: 'Dividing customers by types' },
        { id: 'bba8', text: 'GST is a:', options: ['Subsidy', 'Indirect tax', 'Loan', 'Discount'], correct: 'Indirect tax' },
        { id: 'bba9', text: 'Inventory turnover indicates:', options: ['Product demand speed', 'Team size', 'Salary growth', 'Brand value'], correct: 'Product demand speed' },
        { id: 'bba10', text: 'A KPI is:', options: ['Holiday', 'Key performance indicator', 'Tax rule', 'Legal clause'], correct: 'Key performance indicator' }
    ],

    dm: [
        // Digital Marketing - 30 questions (sample)
        { id: 'dm1', text: 'SEO stands for:', options: ['Search Engine Optimization', 'Social Engagement Option', 'Sales Enablement Org', 'None'], correct: 'Search Engine Optimization' },
        { id: 'dm2', text: 'Best goal of a landing page:', options: ['Entertainment', 'Conversion', 'Long story', 'No CTA'], correct: 'Conversion' },
        { id: 'dm3', text: 'CTR means:', options: ['Cost to reach', 'Click-through rate', 'Campaign time ratio', 'Customer tracking rule'], correct: 'Click-through rate' },
        { id: 'dm4', text: 'Keyword "intent" refers to:', options: ['Font style', 'User purpose', 'Ad budget', 'Platform login'], correct: 'User purpose' },
        { id: 'dm5', text: 'Organic traffic is:', options: ['Paid ads', 'Unpaid search visits', 'Bot traffic', 'Offline visits'], correct: 'Unpaid search visits' },
        { id: 'dm6', text: 'A/B testing means:', options: ['2 random posts', 'Comparing two versions to see better performance', 'Branding', 'Backlinking'], correct: 'Comparing two versions to see better performance' },
        { id: 'dm7', text: 'Retargeting is used to:', options: ['Block users', 'Show ads to past visitors', 'Delete cookies', 'Stop campaigns'], correct: 'Show ads to past visitors' },
        { id: 'dm8', text: 'Bounce rate increases when:', options: ['Page slow or irrelevant', 'CTA clear', 'UX good', 'Content matches intent'], correct: 'Page slow or irrelevant' },
        { id: 'dm9', text: 'ROAS means:', options: ['Return on ad spend', 'Rate of account signups', 'Revenue on all sales', 'Ratio of audience segments'], correct: 'Return on ad spend' },
        { id: 'dm10', text: 'Social media "reach" is:', options: ['Sales', 'Number of unique users who saw content', 'Comments only', 'Ad cost'], correct: 'Number of unique users who saw content' }
    ],

    animation: [
        // Animation - 30 questions (sample)
        { id: 'anim1', text: '"Frame rate" means:', options: ['Resolution', 'Frames per second', 'File size', 'Color depth'], correct: 'Frames per second' },
        { id: 'anim2', text: '12 principles of animation include:', options: ['Squash & stretch', 'Anticipation', 'Timing', 'All of these'], correct: 'All of these' },
        { id: 'anim3', text: 'Keyframes are:', options: ['Random frames', 'Defining important motion points', 'Sound files', 'Textures'], correct: 'Defining important motion points' },
        { id: 'anim4', text: 'Storyboarding is used to:', options: ['Code apps', 'Plan scenes visually', 'Edit audio', 'Compress files'], correct: 'Plan scenes visually' },
        { id: 'anim5', text: 'Perspective helps in:', options: ['Flatness', 'Depth/3D feel', 'Speed', 'Sound'], correct: 'Depth/3D feel' },
        { id: 'anim6', text: 'Rigging is:', options: ['Coloring', 'Adding skeleton/control to character', 'Exporting file', 'Rendering'], correct: 'Adding skeleton/control to character' },
        { id: 'anim7', text: 'Rendering means:', options: ['Sketching', 'Generating final output frames', 'Scripting', 'Retopology'], correct: 'Generating final output frames' },
        { id: 'anim8', text: 'Onion skinning helps in:', options: ['Lighting', 'Seeing previous/next frames', 'Sound sync', 'Textures'], correct: 'Seeing previous/next frames' },
        { id: 'anim9', text: 'Composition refers to:', options: ['File format', 'Arrangement of visual elements', 'CPU bloat', 'Export fps'], correct: 'Arrangement of visual elements' },
        { id: 'anim10', text: 'Motion graphics is:', options: ['Still art', 'Animated design elements for communication', 'Only 3D gaming', 'Coding'], correct: 'Animated design elements for communication' }
    ]
};
