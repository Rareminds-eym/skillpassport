/**
 * Empty State Quotes Utility
 * 
 * Provides page-specific motivational quotes for empty states across the recruiter platform.
 * Implements session-based rotation to show different quotes on each page load.
 */

export type PageIdentifier =
  | 'overview'
  | 'requisitions'
  | 'talent-pool'
  | 'applicants'
  | 'pipelines'
  | 'project-hiring'
  | 'shortlists'
  | 'interviews'
  | 'offers-decisions'
  | 'verified-work'
  | 'messages';

interface PageQuotes {
  [key: string]: string[];
}

const PAGE_QUOTES: PageQuotes = {
  overview: [
    'Your hiring journey starts here.',
    'Build your team with confidence.',
    'Everything you need to hire better.',
    'Your complete hiring workspace.',
    'Bring your hiring strategy together.',
    'Find talent. Build teams. Create impact.',
    'A smarter way to manage hiring.',
    'Your talent journey, all in one place.',
    'Move from hiring needs to great teams.',
    'Keep every hiring opportunity moving.',
    'Your team-building journey starts here.',
    'Stay connected to every hiring opportunity.',
    'Manage talent. Build possibilities.',
    'Make every hiring opportunity count.',
    'Bring the right talent into focus.',
    'Your hiring process, simplified.',
    'Turn hiring plans into action.',
    'Connect every step of your hiring journey.',
    'Build stronger teams, one hire at a time.',
    'Where your hiring journey comes together.',
    'Keep your hiring moving forward.',
    'Discover, connect, and hire great talent.',
    'Your workspace for smarter hiring.',
    'From opportunity to team, all in one place.',
    'Start building your next great team.',
  ],
  requisitions: [
    'Define the role. Discover the right talent.',
    'Great hires start with clear requirements.',
    'Create the opportunity your team needs.',
    'Turn hiring needs into opportunities.',
    'Define what you need. Find who fits.',
    'Every great hire begins with a clear role.',
    'Create roles that attract the right talent.',
    'Shape your next opportunity with clarity.',
    'Start with the role. Build the right team.',
    'Bring your hiring requirements to life.',
    'Create opportunities with purpose.',
    'The right role starts the right conversation.',
    'Build a clear path to your next hire.',
    'Make every hiring requirement count.',
    'Turn workforce needs into meaningful roles.',
    'Create the role. Find the potential.',
    'A better hire starts with a better requirement.',
    'Define roles that make an impact.',
    'Start your search with the right requirement.',
    'Give great talent the right opportunity.',
    'Create roles built for the future.',
    'Turn your talent needs into action.',
    'Build opportunities around what matters.',
    'Set the stage for your next great hire.',
    'Smarter hiring starts with smarter requisitions.',
  ],
  'talent-pool': [
    'Discover talent with potential.',
    'Your next great hire could be here.',
    'Explore talent that fits your needs.',
    'Discover skills beyond the resume.',
    'Find the people who can move you forward.',
    'Your talent search starts here.',
    'Explore your growing pool of talent.',
    'Find potential worth discovering.',
    'Connect with talent that matches your needs.',
    'Discover people behind the profiles.',
    'Bring promising talent into focus.',
    'Find skills that fit your opportunities.',
    'Explore talent for every opportunity.',
    'Discover your next team member.',
    'Turn your talent pool into possibilities.',
    'Find the skills your team needs.',
    'Great talent is waiting to be discovered.',
    'Look beyond titles. Discover potential.',
    'Explore talent aligned with your needs.',
    'Build your network of future talent.',
    'Find talent that brings new possibilities.',
    'Discover candidates who could make an impact.',
    'Your next opportunity starts with the right talent.',
    'Explore. Connect. Discover.',
    'Where potential meets opportunity.',
  ],
  applicants: [
    'Every application brings a new possibility.',
    'Discover the people behind every application.',
    'Your next great candidate could be here.',
    'Explore applicants ready for opportunity.',
    'Bring promising candidates into focus.',
    'Find the right people for every role.',
    'Every candidate has a story to explore.',
    'Review talent. Discover potential.',
    'Turn applications into opportunities.',
    'Explore candidates who could make an impact.',
    'Find the right fit from every application.',
    'Keep every promising candidate within reach.',
    'Discover potential in every application.',
    'Meet the talent behind your applications.',
    'Your candidate journey starts here.',
    'Explore applicants with purpose.',
    'Find candidates who match your opportunities.',
    'Every application could be your next great hire.',
    'Bring the right candidates closer.',
    'Turn candidate profiles into possibilities.',
    'Review. Discover. Connect.',
    'Keep your candidate search moving forward.',
    'Find talent that fits the role and the team.',
    'Explore your latest talent opportunities.',
    'The right candidate may be one application away.',
  ],
  pipelines: [
    'Keep every candidate moving forward.',
    'Your hiring journey, organized.',
    'Move talent through every stage with clarity.',
    'Keep your hiring process on track.',
    'From application to decision, stay connected.',
    'Make every hiring stage count.',
    'Turn candidate journeys into clear next steps.',
    'Keep your best candidates moving.',
    'A clear path to better hiring decisions.',
    'Organize every opportunity from start to finish.',
    'Know where every candidate stands.',
    'Keep your recruitment process flowing.',
    'Move the right talent closer to the finish line.',
    'Bring clarity to every hiring stage.',
    'Your candidates. Your stages. Your workflow.',
    'Keep every hiring opportunity progressing.',
    'Build a smoother path from candidate to hire.',
    'Track progress. Take action. Keep moving.',
    'Make your hiring workflow work for you.',
    'Every stage brings you closer to the right hire.',
    'Keep your recruitment journey connected.',
    'From first step to final decision.',
    'Turn hiring stages into meaningful progress.',
    'Stay organized from application to offer.',
    'A clearer pipeline for a smoother hire.',
  ],
  'project-hiring': [
    'Build the right team for every project.',
    'Find talent for the work that matters.',
    'Match the right skills to every project.',
    'Build project teams with purpose.',
    'Bring the right people to the right project.',
    'Turn project needs into talent opportunities.',
    'Find skills that move projects forward.',
    'Build teams around your project goals.',
    'The right project deserves the right talent.',
    'Connect project requirements with real skills.',
    'Find the expertise your project needs.',
    'Create teams built for the task ahead.',
    'Turn project requirements into action.',
    'Bring specialized talent into your projects.',
    'Build flexible teams for changing needs.',
    'Find the right expertise, when you need it.',
    'Match talent to the work that matters.',
    'Build project-ready teams faster.',
    'From project scope to the right people.',
    'Connect skills with project opportunities.',
    'Find talent ready to make an impact.',
    'Build teams that move projects forward.',
    'Every project starts with the right people.',
    'Your project. The right skills. The right team.',
    'Turn project needs into team possibilities.',
  ],
  shortlists: [
    'Bring the right candidates closer.',
    'Your selected talent, all in one place.',
    'Keep your strongest candidates within reach.',
    'Narrow the search. Focus on potential.',
    'Your shortlist for the next great hire.',
    'Focus on candidates who stand out.',
    'Keep promising talent close.',
    'From many possibilities to the right few.',
    'Bring your top candidates into focus.',
    'Your next hiring decision starts here.',
    'Keep your best-fit candidates together.',
    'Focus on the talent that matters.',
    'Discover who deserves the next step.',
    'Your candidates, carefully selected.',
    'Turn possibilities into focused choices.',
    'Keep your hiring priorities clear.',
    'Move promising candidates closer to opportunity.',
    'Find your strongest matches.',
    'A focused view of your top talent.',
    'Bring standout candidates forward.',
    'The right candidates, ready for the next step.',
    'Keep your top talent within reach.',
    'Focus your search. Find your fit.',
    'Your selected talent, ready to move forward.',
    'From potential to priority.',
  ],
  interviews: [
    'Every conversation brings you closer to the right fit.',
    'Get to know the talent behind the profile.',
    'Make every interview meaningful.',
    'Turn conversations into opportunities.',
    'Meet the people behind the applications.',
    'The right conversation can reveal great potential.',
    'Discover more than what is on the resume.',
    'Create meaningful candidate conversations.',
    'Every interview is an opportunity to connect.',
    'Ask. Listen. Discover.',
    'Make every candidate conversation count.',
    'Get closer to the right hiring decision.',
    'Explore skills, experience, and potential.',
    'Meet talent beyond the application.',
    'Turn interviews into meaningful connections.',
    'Discover the person behind the profile.',
    'Connect with candidates who could make an impact.',
    'Every conversation reveals new possibilities.',
    'Make your next hiring conversation count.',
    'Create space for talent to shine.',
    'Meet. Understand. Discover.',
    'Take the next step toward the right fit.',
    'Find the story behind the skills.',
    'Good hiring starts with good conversations.',
    'The right fit begins with a conversation.',
  ],
  'offers-decisions': [
    'Turn the right opportunity into the right hire.',
    'Bring your hiring journey closer to completion.',
    'Make your next hiring decision with confidence.',
    'From final conversation to new beginnings.',
    'Turn potential into opportunity.',
    'Move great candidates toward their next chapter.',
    'Bring the right talent across the finish line.',
    'Make every hiring decision meaningful.',
    'Your next great hire is within reach.',
    'Turn successful conversations into opportunities.',
    'Move from selection to the next step.',
    'Create the beginning of something great.',
    'Bring great talent into your team.',
    'Make offers that open new possibilities.',
    'Take the final step toward your next hire.',
    'Turn candidate potential into team impact.',
    'Move your hiring journey forward.',
    'The next chapter starts with the right decision.',
    'Connect great talent with new opportunities.',
    'From shortlisted talent to new beginnings.',
    'Make the next step count.',
    'Turn hiring decisions into new opportunities.',
    'Welcome the right talent to your team.',
    'Bring your hiring journey to its next chapter.',
    'Great teams begin with great decisions.',
  ],
  'verified-work': [
    'See the work behind the profile.',
    'Discover skills backed by real work.',
    'Look beyond claims. Explore verified experience.',
    'See what talent can actually do.',
    'Experience speaks louder than a resume.',
    'Discover proof behind the potential.',
    'Skills become meaningful when you can see them in action.',
    'Explore real work. Discover real capability.',
    'Go beyond the profile with verified work.',
    'See skills brought to life.',
    'Discover talent through what they have created.',
    'Evidence that brings experience to life.',
    'See the work behind the skills.',
    'Find capability beyond credentials.',
    'Explore projects, skills, and real-world experience.',
    'Let the work tell the story.',
    'Discover what candidates can create.',
    'Experience you can explore. Skills you can see.',
    'Move beyond resumes to real work.',
    'See potential through proven work.',
    'Real work. Real skills. Real possibilities.',
    'Explore the evidence behind experience.',
    'Discover talent through their work.',
    'Where skills meet proof.',
    'See more than a profile. See the work.',
  ],
  messages: [
    'Keep every hiring conversation connected.',
    'Great hiring starts with a conversation.',
    'Connect with talent, one conversation at a time.',
    'Keep your candidate conversations moving.',
    'Every message can open an opportunity.',
    'Stay connected throughout the hiring journey.',
    'Make every hiring conversation count.',
    'Connect, communicate, and move forward.',
    'Keep conversations where your hiring happens.',
    'Turn conversations into connections.',
    'Stay close to every candidate conversation.',
    'Your hiring conversations, all in one place.',
    'Build connections beyond the application.',
    'Keep every opportunity within reach.',
    'Start meaningful conversations with talent.',
    'Make communication part of great hiring.',
    'Connect with candidates when it matters.',
    'Keep your hiring conversations flowing.',
    'From first message to final decision.',
    'The right conversation can start something great.',
    'Stay connected with your hiring network.',
    'Bring candidates and opportunities closer.',
    'Make every connection meaningful.',
    'Your conversations. Your candidates. Your opportunities.',
    'Where hiring conversations become connections.',
  ],
};

const STORAGE_KEY = 'recruiter-empty-state-quotes-used';

/**
 * Get a random quote for a specific page
 * Uses session storage to track used quotes and ensure variety within a session
 */
export function getRandomQuote(page: PageIdentifier): string {
  const quotes = PAGE_QUOTES[page];

  if (!quotes || quotes.length === 0) {
    return 'Start building your next great team.'; // Fallback
  }

  try {
    // Get previously used quotes for this page in current session
    const usedQuotesStr = sessionStorage.getItem(`${STORAGE_KEY}-${page}`);
    const usedQuotes: number[] = usedQuotesStr ? JSON.parse(usedQuotesStr) : [];

    // If all quotes have been used, reset the tracking
    let availableIndices = quotes
      .map((_, index) => index)
      .filter(index => !usedQuotes.includes(index));

    if (availableIndices.length === 0) {
      // Reset - all quotes used, start over
      availableIndices = quotes.map((_, index) => index);
      sessionStorage.setItem(`${STORAGE_KEY}-${page}`, JSON.stringify([]));
    }

    // Pick a random index from available quotes
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

    // Mark this quote as used
    usedQuotes.push(randomIndex);
    sessionStorage.setItem(`${STORAGE_KEY}-${page}`, JSON.stringify(usedQuotes));

    return quotes[randomIndex];
  } catch (error) {
    // Fallback if sessionStorage is not available
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }
}

/**
 * Clear quote tracking for a specific page (useful for testing)
 */
export function clearQuoteHistory(page?: PageIdentifier): void {
  try {
    if (page) {
      sessionStorage.removeItem(`${STORAGE_KEY}-${page}`);
    } else {
      // Clear all quote tracking
      Object.keys(PAGE_QUOTES).forEach(pageKey => {
        sessionStorage.removeItem(`${STORAGE_KEY}-${pageKey}`);
      });
    }
  } catch (error) {
    // Silently fail if sessionStorage is not available
  }
}
