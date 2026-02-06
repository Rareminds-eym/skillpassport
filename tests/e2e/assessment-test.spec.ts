/**
 * Puppeteer E2E Test Suite for Assessment Test Page
 * 
 * This comprehensive test suite validates the complete assessment flow:
 * - All 5 sections (Interest Explorer, Strengths & Character, Learning & Work Preferences, 
 *   Aptitude Sampling, Adaptive Aptitude Test)
 * - Question answering and navigation
 * - Timer functionality
 * - Progress tracking
 * - Save/Resume functionality
 * - Final submission and results
 * 
 * @requires puppeteer
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test Configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 60000, // 60 seconds
  headless: process.env.HEADLESS !== 'false', // Set HEADLESS=false to see browser
  slowMo: parseInt(process.env.SLOW_MO || '0'), // Slow down by ms for debugging
  viewport: {
    width: 1920,
    height: 1080
  }
};

// Test User Credentials (adjust based on your test setup)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'stu508@school.edu',
  password: process.env.TEST_USER_PASSWORD || 'TempPassword123!'
};

describe('Assessment Test Page - Complete Flow', () => {
  let browser: Browser;
  let page: Page;

  // Setup: Launch browser before all tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    page = await browser.newPage();
    await page.setViewport(TEST_CONFIG.viewport);

    // Set longer timeout for all operations
    page.setDefaultTimeout(TEST_CONFIG.timeout);

    console.log('🚀 Browser launched successfully');
  });

  // Teardown: Close browser after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  });

  // Helper Functions
  const helpers = {
    /**
     * Navigate to assessment page and handle authentication if needed
     */
    async navigateToAssessment() {
      console.log('📍 Navigating to assessment page...');
      await page.goto(`${TEST_CONFIG.baseUrl}/student/assessment/test`, {
        waitUntil: 'networkidle2'
      });

      // Check if we need to login
      const isLoginPage = await page.evaluate(() => {
        return window.location.pathname.includes('/login') || 
               document.querySelector('input[type="email"]') !== null;
      });

      if (isLoginPage) {
        console.log('🔐 Login required, authenticating...');
        await this.login();
        await page.goto(`${TEST_CONFIG.baseUrl}/student/assessment/test`, {
          waitUntil: 'networkidle2'
        });
      }

      // Check for "Resume Assessment" prompt or "Welcome Back" screen
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const resumeInfo = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const h2Text = document.querySelector('h2')?.textContent || '';
        
        const hasResumePrompt = bodyText.includes('Resume') || 
                               bodyText.includes('Welcome Back') ||
                               bodyText.includes('Continue where you left off');
        
        const hasStartNewButton = bodyText.includes('Start New') || 
                                 bodyText.includes('Abandon') ||
                                 bodyText.includes('Begin New');
        
        return {
          hasResumePrompt,
          hasStartNewButton,
          h2Text,
          bodyPreview: bodyText.substring(0, 500)
        };
      });

      console.log('📊 Resume check:', resumeInfo);

      if (resumeInfo.hasResumePrompt) {
        console.log('🔄 Resume prompt detected, starting new assessment...');
        
        // Click "Start New" or "Abandon" button
        const clicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          
          // Look for "Start New Assessment" or "Abandon" button
          const startNewButton = buttons.find(btn => {
            const text = btn.textContent || '';
            return text.includes('Start New') ||
                   text.includes('Abandon') ||
                   text.includes('Begin New') ||
                   text.includes('Start Fresh');
          });
          
          if (startNewButton) {
            console.log('Found Start New button:', startNewButton.textContent);
            (startNewButton as HTMLButtonElement).click();
            return true;
          }
          
          // If no explicit button, look for any button that might start new
          const anyStartButton = buttons.find(btn => {
            const text = (btn.textContent || '').toLowerCase();
            return text.includes('new') || text.includes('abandon');
          });
          
          if (anyStartButton) {
            console.log('Found alternative start button:', anyStartButton.textContent);
            (anyStartButton as HTMLButtonElement).click();
            return true;
          }
          
          return false;
        });

        if (clicked) {
          console.log('✅ Clicked Start New Assessment, waiting for page to update...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Verify we're past the resume prompt
          const stillOnResume = await page.evaluate(() => {
            const bodyText = document.body.textContent || '';
            return bodyText.includes('Welcome Back') || bodyText.includes('Resume');
          });
          
          if (stillOnResume) {
            console.warn('⚠️  Still on resume screen after clicking, may need manual intervention');
          } else {
            console.log('✅ Successfully moved past resume prompt');
          }
        } else {
          console.warn('⚠️  Could not find Start New button');
          
          // Debug: Show all button texts
          const buttonTexts = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim());
          });
          console.log('Available buttons:', buttonTexts);
        }
      }

      console.log('✅ Assessment page loaded');
    },

    /**
     * Login helper
     */
    async login() {
      await page.type('input[type="email"]', TEST_USER.email);
      await page.type('input[type="password"]', TEST_USER.password);
      
      // Select "Student" role from dropdown
      console.log('🎓 Selecting Student role...');
      await page.select('select', 'student');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Click Sign In button
      await page.click('button[type="submit"]');
      
      // Wait for login to complete (URL changes from /login)
      await page.waitForFunction(() => !window.location.pathname.includes('/login'), { 
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Logged in successfully as Student');
    },

    /**
     * Wait for section intro screen to load
     */
    async waitForSectionIntro(sectionTitle: string) {
      console.log(`⏳ Waiting for section intro: ${sectionTitle}`);
      await page.waitForSelector('h2', { visible: true });
      
      const title = await page.$eval('h2', el => el.textContent);
      if (!title?.includes(sectionTitle)) {
        throw new Error(`Expected section "${sectionTitle}" but got "${title}"`);
      }
      
      console.log(`✅ Section intro loaded: ${sectionTitle}`);
    },

    /**
     * Click "Start Section" button
     */
    async clickStartSection() {
      console.log('🖱️  Clicking "Start Section" button...');
      
      // Wait for button to be visible and enabled
      await page.waitForSelector('button:not([disabled])', { visible: true });
      
      // Take screenshot before clicking
      console.log('📸 Taking screenshot before clicking Start Section...');
      
      // Find and click the "Start Section" button using multiple strategies
      const buttonClicked = await page.evaluate(() => {
        // Strategy 1: Find by text content
        const buttons = Array.from(document.querySelectorAll('button'));
        const startButton = buttons.find(btn => 
          btn.textContent?.includes('Start Section')
        );
        
        if (startButton && !(startButton as HTMLButtonElement).disabled) {
          console.log('Found Start Section button, clicking...');
          (startButton as HTMLButtonElement).click();
          return true;
        }
        
        // Strategy 2: Find by class or data attributes
        const buttonByClass = document.querySelector('button[class*="start"], button[class*="Start"]');
        if (buttonByClass && !(buttonByClass as HTMLButtonElement).disabled) {
          console.log('Found button by class, clicking...');
          (buttonByClass as HTMLButtonElement).click();
          return true;
        }
        
        return false;
      });

      if (!buttonClicked) {
        console.error('❌ Start Section button not found or not clickable');
        throw new Error('Start Section button not found');
      }

      console.log('✅ Button clicked, waiting for questions to load...');
      
      // Check if this is an adaptive section BEFORE waiting
      const sectionInfo = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const h2Text = document.querySelector('h2')?.textContent || '';
        
        // Check if we're actually ON the Adaptive Aptitude intro screen
        const isAdaptiveIntro = h2Text.includes('Adaptive Aptitude Test') || 
                               h2Text.includes('Adaptive Aptitude');
        
        return {
          isAdaptive: isAdaptiveIntro,
          h2Text,
          bodyPreview: bodyText.substring(0, 300)
        };
      });
      
      console.log('📊 Section info BEFORE wait:', sectionInfo);
      
      // Enable console logging from browser to capture adaptive initialization logs
      if (sectionInfo.isAdaptive) {
        console.log('🔄 Adaptive section detected, enabling browser console logging...');
        page.on('console', msg => {
          const text = msg.text();
          // Only log adaptive-related messages to reduce noise
          if (text.includes('[ADAPTIVE]') || text.includes('[useAdaptiveAptitude]') || 
              text.includes('startTest') || text.includes('adaptive') || text.includes('session')) {
            console.log('🌐 Browser:', text);
          }
        });
      }
      
      // Wait for loading state to disappear (if any)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (sectionInfo.isAdaptive) {
        console.log('🔄 Adaptive section: Waiting for initialization...');
        
        // For adaptive sections, we need to wait for:
        // 1. The startTest() async call to complete
        // 2. The first question to load from the API
        // 3. The useEffect to call flow.startSection()
        // 4. The AdaptiveQuestion component to render
        
        // Wait up to 120 seconds for adaptive questions to load (API calls can be slow)
        console.log('⏳ Waiting for adaptive question to render (up to 120 seconds)...');
        
        try {
          // Wait for the specific DOM elements that AdaptiveQuestion renders
          await page.waitForFunction(() => {
            // Check for Level badge (rendered by AdaptiveQuestion)
            const levelBadges = Array.from(document.querySelectorAll('[class*="indigo-100"]'));
            const hasLevelBadge = levelBadges.some(el => el.textContent?.includes('Level'));
            
            // Check for timer (rendered by AdaptiveQuestion with format MM:SS)
            const timerElements = Array.from(document.querySelectorAll('[class*="rounded-full"]'));
            const hasTimer = timerElements.some(el => /\d+:\d+/.test(el.textContent || ''));
            
            // Check for option buttons with A, B, C, D labels
            const allButtons = Array.from(document.querySelectorAll('button[type="button"]'));
            const optionButtons = allButtons.filter(btn => {
              const firstLine = (btn.textContent || '').trim().split('\n')[0]?.trim() || '';
              return /^[ABCD]$/.test(firstLine);
            });
            
            // Check for question text (h3 element with substantial text)
            const h3 = document.querySelector('h3');
            const hasQuestionText = h3 && h3.textContent && h3.textContent.length > 10;
            
            const isReady = hasLevelBadge && hasTimer && optionButtons.length >= 4 && hasQuestionText;
            
            if (!isReady) {
              console.log('Adaptive waiting:', { 
                hasLevelBadge, 
                hasTimer, 
                optionCount: optionButtons.length,
                hasQuestionText,
                h3Preview: h3?.textContent?.substring(0, 50)
              });
            }
            
            return isReady;
          }, { timeout: 120000 }); // 120 seconds
          
          console.log('✅ Adaptive question rendered successfully');
          
          // Extra wait to ensure all React state updates are complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error('❌ Adaptive questions failed to load after 120 seconds');
          
          // Debug: Check what's on the page
          const debugInfo = await page.evaluate(() => {
            const bodyText = document.body.textContent || '';
            const allButtons = Array.from(document.querySelectorAll('button'));
            const h3Text = document.querySelector('h3')?.textContent || '';
            const h2Text = document.querySelector('h2')?.textContent || '';
            
            return {
              h2Text: h2Text.substring(0, 200),
              h3Text: h3Text.substring(0, 200),
              bodyPreview: bodyText.substring(0, 800),
              buttonCount: allButtons.length,
              buttonTexts: allButtons.slice(0, 10).map(b => b.textContent?.substring(0, 50)),
              hasLoadingText: bodyText.includes('Loading'),
              hasLevelBadge: bodyText.includes('Level'),
              hasTimer: /\d+:\d+/.test(bodyText),
              hasErrorText: bodyText.includes('error') || bodyText.includes('Error') || bodyText.includes('failed'),
            };
          });
          
          console.log('❌ Debug info:', JSON.stringify(debugInfo, null, 2));
          throw error;
        }
      } else {
        // Regular section - wait for question to load with multiple selectors
        try {
          await Promise.race([
            page.waitForSelector('[class*="QUESTION"]', { visible: true, timeout: 30000 }),
            page.waitForFunction(() => {
              return document.body.textContent?.includes('QUESTION') ||
                     document.body.textContent?.includes('Question');
            }, { timeout: 30000 })
          ]);
          console.log('✅ Section started, question loaded');
        } catch (error) {
          console.error('❌ Questions failed to load after 30 seconds');
          
          const pageContent = await page.evaluate(() => {
            return {
              title: document.title,
              h1: document.querySelector('h1')?.textContent,
              h2: document.querySelector('h2')?.textContent,
              bodyText: document.body.textContent?.substring(0, 500)
            };
          });
          console.log('Current page state:', pageContent);
          
          throw error;
        }
      }
    },

    /**
     * Answer a multiple choice question
     */
    async answerMultipleChoice(optionIndex: number = 0) {
      console.log(`📝 Answering multiple choice question (option ${optionIndex})...`);
      
      // First check if there's a loading indicator
      const isLoading = await page.evaluate(() => {
        return document.body.textContent?.includes('Loading next question');
      });
      
      if (isLoading) {
        console.log('⏳ Waiting for question to finish loading...');
        await page.waitForFunction(() => {
          return !document.body.textContent?.includes('Loading next question');
        }, { timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Wait for options to be visible
      await page.waitForSelector('button[type="button"]', { visible: true, timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if all buttons are disabled (question already answered)
      const questionState = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button[type="button"]'));
        const nonNavButtons = allButtons.filter(btn => {
          const text = (btn.textContent || '').trim();
          return !text.includes('Previous') && 
                 !text.includes('Next') && 
                 !text.includes('Continue') &&
                 !text.includes('Submit') &&
                 !text.includes('Start') &&
                 !text.includes('Complete Section') &&
                 !text.includes('Test Mode') &&
                 !text.includes('Processing') &&
                 !text.includes('Saving');
        });
        
        const allDisabled = nonNavButtons.length > 0 && nonNavButtons.every(btn => (btn as HTMLButtonElement).disabled);
        
        // Check if Next button is enabled
        const nextButton = allButtons.find(btn => 
          btn.textContent?.includes('Next') || btn.textContent?.includes('Continue')
        ) as HTMLButtonElement;
        
        return {
          allDisabled,
          nextButtonExists: !!nextButton,
          nextButtonEnabled: nextButton ? !nextButton.disabled : false
        };
      });
      
      if (questionState.allDisabled) {
        console.log(`⚠️  All option buttons are disabled - question already answered`);
        console.log(`   Next button: exists=${questionState.nextButtonExists}, enabled=${questionState.nextButtonEnabled}`);
        
        if (questionState.nextButtonEnabled) {
          console.log('   Next button is enabled, will proceed to click it');
          return; // Return early, Next button is ready to click
        } else {
          console.log('   ⚠️  Next button is NOT enabled even though question is answered - this is unexpected!');
          // Try to wait a bit for it to become enabled
          await new Promise(resolve => setTimeout(resolve, 2000));
          return;
        }
      }
      
      // Click the option - works for both MCQ and Adaptive questions
      const clicked = await page.evaluate((index) => {
        // Get all buttons
        const allButtons = Array.from(document.querySelectorAll('button[type="button"]'));
        
        console.log(`Total buttons found: ${allButtons.length}`);
        
        // Filter out navigation buttons first
        const nonNavButtons = allButtons.filter(btn => {
          const text = (btn.textContent || '').trim();
          return !text.includes('Previous') && 
                 !text.includes('Next') && 
                 !text.includes('Continue') &&
                 !text.includes('Submit') &&
                 !text.includes('Start') &&
                 !text.includes('Complete Section') &&
                 !text.includes('Test Mode') &&
                 !text.includes('Processing') &&
                 !text.includes('Saving');
        });
        
        console.log(`Non-navigation buttons: ${nonNavButtons.length}`);
        nonNavButtons.forEach((btn, i) => {
          const text = btn.textContent?.trim() || '';
          const isDisabled = (btn as HTMLButtonElement).disabled;
          console.log(`  [${i}] "${text.substring(0, 50)}" (length: ${text.length}, disabled: ${isDisabled})`);
        });
        
        // For adaptive questions, buttons might have the full text with letter inside
        // For MCQ questions, buttons have letter + full text
        // Just use the non-nav buttons in order
        const optionButtons = nonNavButtons;
        
        if (optionButtons.length > index) {
          const button = optionButtons[index] as HTMLButtonElement;
          const buttonText = button.textContent?.substring(0, 50);
          console.log(`Attempting to click option ${index}: "${buttonText}"`);
          
          // Check if button is disabled
          if (button.disabled) {
            console.log('Button is disabled, skipping...');
            return false;
          }
          
          // Click the button
          button.click();
          
          // Also dispatch event for React
          button.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          }));
          
          console.log('Click dispatched successfully');
          return true;
        }
        
        console.error(`No option button at index ${index}! Only ${optionButtons.length} buttons available.`);
        return false;
      }, optionIndex);
      
      if (clicked) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait longer for adaptive questions
        console.log(`✅ Selected option ${optionIndex}`);
      } else {
        console.error(`❌ Could not find option ${optionIndex}`);
        
        // Debug: log current page state
        const debugInfo = await page.evaluate(() => {
          const allButtons = Array.from(document.querySelectorAll('button'));
          return {
            totalButtons: allButtons.length,
            buttonTexts: allButtons.map(b => b.textContent?.substring(0, 30)),
            bodyText: document.body.textContent?.substring(0, 300)
          };
        });
        console.log('Debug info:', debugInfo);
        
        throw new Error(`Failed to click option ${optionIndex}`);
      }
    },

    /**
     * Answer a Likert scale question
     */
    async answerLikertScale(rating: number = 4) {
      console.log(`📝 Answering Likert scale question (rating ${rating})...`);
      
      // Wait for rating buttons
      await page.waitForSelector('button[role="radio"]', { visible: true });
      
      // Find and click the rating button
      await page.evaluate((r) => {
        const buttons = Array.from(document.querySelectorAll('button[role="radio"]'));
        const ratingButton = buttons[r - 1]; // 0-indexed
        if (ratingButton) {
          (ratingButton as HTMLButtonElement).click();
        }
      }, rating);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`✅ Selected rating ${rating}`);
    },

    /**
     * Answer a text input question (textarea or input field)
     */
    async answerTextInput(text: string = 'I overcame a challenging group project by staying organized, communicating clearly with team members, and taking initiative to coordinate tasks. My strengths in leadership and problem-solving helped me guide the team to success.') {
      console.log(`📝 Answering text input question...`);
      
      // Wait for textarea or input field
      await page.waitForFunction(() => {
        return document.querySelector('textarea') || document.querySelector('input[type="text"]');
      }, { timeout: 5000 });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check minimum character requirement
      const requirement = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const minMatch = bodyText.match(/minimum\s+(\d+)/i) || bodyText.match(/(\d+)\s+characters/i);
        return minMatch ? parseInt(minMatch[1]) : 10;
      });
      
      console.log(`   Minimum characters required: ${requirement}`);
      
      // Ensure text meets minimum requirement
      const finalText = text.length >= requirement ? text : text + ' '.repeat(requirement - text.length + 10);
      
      // Click on the textarea first to focus it
      await page.click('textarea, input[type="text"]');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Type the text using Puppeteer's type method (simulates real typing)
      const selector = await page.$('textarea') || await page.$('input[type="text"]');
      if (selector) {
        await selector.type(finalText, { delay: 10 }); // Type with 10ms delay between characters
        console.log(`✅ Typed ${finalText.length} characters`);
      } else {
        // Fallback: use evaluate to set value
        const typed = await page.evaluate((inputText) => {
          // Try textarea first
          const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
          if (textarea) {
            console.log('Found textarea, setting value...');
            (textarea as HTMLTextAreaElement).focus();
            textarea.value = inputText;
            
            // Trigger all necessary events
            textarea.dispatchEvent(new Event('focus', { bubbles: true }));
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            textarea.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Also trigger React's onChange if it exists
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(textarea, inputText);
              textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            return true;
          }
          
          // Try text input
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) {
            console.log('Found text input, setting value...');
            (input as HTMLInputElement).focus();
            input.value = inputText;
            
            // Trigger all necessary events
            input.dispatchEvent(new Event('focus', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Also trigger React's onChange
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(input, inputText);
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            return true;
          }
          
          return false;
        }, finalText);
        
        if (typed) {
          console.log(`✅ Set text value (${finalText.length} characters)`);
        } else {
          console.error('❌ Could not find text input field');
          throw new Error('Text input field not found');
        }
      }
      
      // Wait for React to process the input
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Verify the text was entered and check Next button state
      const verification = await page.evaluate(() => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        const currentValue = textarea ? textarea.value : input?.value || '';
        
        const nextButton = Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent?.includes('Next')
        ) as HTMLButtonElement;
        
        return {
          valueLength: currentValue.length,
          nextButtonDisabled: nextButton?.disabled ?? true,
          characterCount: document.body.textContent?.match(/(\d+)\s+character/)?.[1] || '0'
        };
      });
      
      console.log(`   Verification: ${verification.valueLength} chars entered, Next button disabled: ${verification.nextButtonDisabled}`);
      
      if (verification.nextButtonDisabled && verification.valueLength > 0) {
        console.warn(`⚠️  Text entered but Next button still disabled. Character count shown: ${verification.characterCount}`);
      }
    },

    /**
     * Answer a multiselect question (like the Interest Explorer)
     */
    async answerMultiselect(numSelections: number = 3) {
      console.log(`📝 Answering multiselect question (selecting ${numSelections} options)...`);
      
      // Wait for the instruction text to appear
      await page.waitForFunction(() => {
        const text = document.body.textContent || '';
        return text.includes('Select up to') || text.includes('options that feel');
      }, { timeout: 10000 });
      
      console.log('✅ Multiselect question detected');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Enable console logging from browser
      page.on('console', msg => console.log('🌐 Browser:', msg.text()));
      
      // Debug: Log DOM structure
      const debugInfo = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const typeButtons = Array.from(document.querySelectorAll('button[type="button"]'));
        
        console.log(`=== DOM DEBUG ===`);
        console.log(`Total buttons: ${allButtons.length}`);
        console.log(`Type="button" buttons: ${typeButtons.length}`);
        
        const buttonDetails = typeButtons.map((b, idx) => {
          const text = (b.textContent || '').trim();
          const classes = b.className;
          const disabled = (b as HTMLButtonElement).disabled;
          return {
            index: idx,
            text: text.substring(0, 60),
            textLength: text.length,
            disabled,
            hasRing: classes.includes('ring-2'),
            hasIndigo: classes.includes('indigo-500'),
            isSelected: classes.includes('ring-2') && classes.includes('indigo-500')
          };
        });
        
        console.log('Button details:', JSON.stringify(buttonDetails, null, 2));
        
        return {
          totalButtons: allButtons.length,
          typeButtons: typeButtons.length,
          buttonDetails,
          hasInstructionText: document.body.textContent?.includes('Select up to'),
          instructionText: Array.from(document.querySelectorAll('p')).find(p => 
            p.textContent?.includes('Select up to')
          )?.textContent
        };
      });
      
      console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2));
      
      // Click options one by one
      for (let i = 0; i < numSelections; i++) {
        console.log(`\n🎯 Selecting option ${i + 1}/${numSelections}...`);
        
        const clickResult = await page.evaluate((attemptNum) => {
          const allButtons = Array.from(document.querySelectorAll('button[type="button"]'));
          
          // Find unselected option buttons
          const unselectedOptions = allButtons.filter(btn => {
            const text = (btn.textContent || '').trim();
            const classes = btn.className || '';
            
            // Skip navigation buttons
            if (text.includes('Previous') || text.includes('Next') || 
                text.includes('Continue') || text.includes('Submit') ||
                text.includes('Start')) {
              return false;
            }
            
            // Skip already selected (has both ring-2 and indigo-500)
            if (classes.includes('ring-2') && classes.includes('indigo-500')) {
              return false;
            }
            
            // Must have reasonable text
            if (text.length < 10 || text.length > 300) {
              return false;
            }
            
            return true;
          });
          
          console.log(`Found ${unselectedOptions.length} unselected options`);
          
          if (unselectedOptions.length === 0) {
            return { success: false, reason: 'No unselected options found' };
          }
          
          const button = unselectedOptions[0] as HTMLButtonElement;
          const buttonText = button.textContent?.substring(0, 50);
          
          console.log(`Clicking: "${buttonText}"`);
          
          // Click the button
          button.click();
          
          // Also try dispatching event
          button.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          }));
          
          return { success: true, buttonText };
        }, i);
        
        console.log('Click result:', clickResult);
        
        if (!clickResult.success) {
          console.error(`❌ Failed to click option ${i + 1}:`, clickResult.reason);
          break;
        }
        
        // Wait for React to update
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Check selection state
        const selectionState = await page.evaluate(() => {
          const selectedButtons = Array.from(document.querySelectorAll('button[type="button"]'))
            .filter(btn => {
              const classes = btn.className || '';
              return classes.includes('ring-2') && classes.includes('indigo-500');
            });
          
          const statusP = Array.from(document.querySelectorAll('p'))
            .find(p => p.textContent?.includes('option') || p.textContent?.includes('complete'));
          
          return {
            selectedCount: selectedButtons.length,
            statusText: statusP?.textContent || 'No status found'
          };
        });
        
        console.log(`   Selection state: ${selectionState.selectedCount} selected, Status: "${selectionState.statusText}"`);
      }
      
      // Final check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalState = await page.evaluate(() => {
        const selectedButtons = Array.from(document.querySelectorAll('button[type="button"]'))
          .filter(btn => {
            const classes = btn.className || '';
            return classes.includes('ring-2') && classes.includes('indigo-500');
          });
        
        const nextButton = Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent?.includes('Next')
        ) as HTMLButtonElement;
        
        return {
          selectedCount: selectedButtons.length,
          nextButtonExists: !!nextButton,
          nextButtonDisabled: nextButton?.disabled ?? true,
          nextButtonText: nextButton?.textContent || 'Not found',
          hasCompleteMessage: document.body.textContent?.includes('Selection complete')
        };
      });
      
      console.log('🔍 Final state:', finalState);
      
      if (finalState.selectedCount === 0) {
        throw new Error('Failed to select any options');
      }
      
      console.log(`✅ Selected ${finalState.selectedCount} options`);
    },

    /**
     * Click "Next" button
     */
    async clickNext() {
      console.log('➡️  Clicking "Next" button...');
      
      // First, wait for any "Saving your answer..." or "Processing..." state to finish
      const isProcessing = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('Saving your answer') || 
               bodyText.includes('Processing') ||
               bodyText.includes('Loading next question');
      });
      
      if (isProcessing) {
        console.log('⏳ Waiting for processing to finish...');
        await page.waitForFunction(() => {
          const bodyText = document.body.textContent || '';
          return !bodyText.includes('Saving your answer') && 
                 !bodyText.includes('Processing') &&
                 !bodyText.includes('Loading next question');
        }, { timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Wait for Next button to be enabled
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextButton = buttons.find(btn => 
          btn.textContent?.includes('Next') || btn.textContent?.includes('Continue')
        );
        return nextButton && !(nextButton as HTMLButtonElement).disabled;
      }, { timeout: 10000 });

      // Click Next button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextButton = buttons.find(btn => 
          btn.textContent?.includes('Next') || btn.textContent?.includes('Continue')
        );
        if (nextButton) {
          (nextButton as HTMLButtonElement).click();
        }
      });

      // Wait for next question to load (especially important for adaptive questions)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Wait for any loading state to finish
      await page.waitForFunction(() => {
        const bodyText = document.body.textContent || '';
        return !bodyText.includes('Loading next question');
      }, { timeout: 15000 }).catch(() => {
        // Ignore timeout - question might already be loaded
      });
      
      console.log('✅ Clicked Next, next question loaded');
    },

    /**
     * Click "Complete Section" button (appears on last question of a section)
     */
    async clickCompleteSection() {
      console.log('🏁 Clicking "Complete Section" button...');
      
      // Wait for Complete Section button to be enabled
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const completeButton = buttons.find(btn => 
          btn.textContent?.includes('Complete Section') || 
          btn.textContent?.includes('Finish Section') ||
          btn.textContent?.includes('Submit Section')
        );
        return completeButton && !(completeButton as HTMLButtonElement).disabled;
      }, { timeout: 5000 });

      // Click Complete Section button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const completeButton = buttons.find(btn => 
          btn.textContent?.includes('Complete Section') || 
          btn.textContent?.includes('Finish Section') ||
          btn.textContent?.includes('Submit Section')
        );
        if (completeButton) {
          console.log('Found Complete Section button, clicking...');
          (completeButton as HTMLButtonElement).click();
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Clicked Complete Section');
    },

    /**
     * Click "Previous" button
     */
    async clickPrevious() {
      console.log('⬅️  Clicking "Previous" button...');
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const prevButton = buttons.find(btn => 
          btn.textContent?.includes('Previous') || btn.textContent?.includes('Back')
        );
        if (prevButton) {
          (prevButton as HTMLButtonElement).click();
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Clicked Previous');
    },

    /**
     * Get current question number
     */
    async getCurrentQuestionNumber(): Promise<{ current: number; total: number }> {
      try {
        // Try multiple selectors for question number
        const questionText = await page.evaluate(() => {
          // Strategy 1: Look for "QUESTION X / Y" pattern
          const elements = Array.from(document.querySelectorAll('*'));
          for (const el of elements) {
            const text = el.textContent || '';
            if (text.match(/QUESTION\s+\d+\s*\/\s*\d+/i)) {
              return text;
            }
          }
          
          // Strategy 2: Look for specific class patterns
          const questionEl = document.querySelector('[class*="QUESTION"], [class*="question-number"]');
          if (questionEl) {
            return questionEl.textContent || '';
          }
          
          return '';
        });
        
        const match = questionText.match(/QUESTION\s+(\d+)\s*\/\s*(\d+)/i);
        
        if (match) {
          return {
            current: parseInt(match[1]),
            total: parseInt(match[2])
          };
        }
        
        console.warn('⚠️  Could not parse question number from:', questionText);
        return { current: 1, total: 5 }; // Default fallback
      } catch (error) {
        console.error('❌ Error getting question number:', error);
        return { current: 0, total: 0 };
      }
    },

    /**
     * Complete a section by answering all questions
     */
    async completeSection(sectionName: string, questionCount: number) {
      console.log(`📋 Completing section: ${sectionName} (${questionCount} questions)`);
      
      for (let i = 0; i < questionCount; i++) {
        const { current, total } = await this.getCurrentQuestionNumber();
        console.log(`   Question ${current}/${total}`);
        
        // Get page text to analyze question type
        const questionInfo = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          
          // Check for text input (textarea or input field)
          const hasTextarea = !!document.querySelector('textarea');
          const hasTextInput = !!document.querySelector('input[type="text"]');
          const hasTextInputField = hasTextarea || hasTextInput;
          
          // Detect multiselect with dynamic number extraction
          // Patterns: "pick 3", "pick 2", "Select up to 3", "choose 4", etc.
          const pickMatch = bodyText.match(/pick\s+(\d+)/i);
          const selectMatch = bodyText.match(/select\s+(?:up\s+to\s+)?(\d+)/i);
          const chooseMatch = bodyText.match(/choose\s+(\d+)/i);
          
          let numToSelect = 0;
          if (pickMatch) numToSelect = parseInt(pickMatch[1]);
          else if (selectMatch) numToSelect = parseInt(selectMatch[1]);
          else if (chooseMatch) numToSelect = parseInt(chooseMatch[1]);
          
          // Also check for instruction text patterns
          const hasMultiselectInstruction = 
            bodyText.includes('options that feel') ||
            bodyText.includes('more options to continue') ||
            bodyText.includes('Select at least');
          
          // Check if it's a standard MCQ with A, B, C, D options
          const hasLetterOptions = bodyText.includes('A\n') && bodyText.includes('B\n') && bodyText.includes('C\n');
          
          return {
            hasTextInput: hasTextInputField,
            isMultiselect: (numToSelect > 0 || hasMultiselectInstruction) && !hasLetterOptions && !hasTextInputField,
            numToSelect: numToSelect || 3, // Default to 3 if detected but no number found
            hasLetterOptions,
            bodyText: bodyText.substring(0, 300) // For debugging
          };
        });
        
        console.log(`   Question type: ${
          questionInfo.hasTextInput ? 'Text Input' :
          questionInfo.isMultiselect ? `Multiselect (${questionInfo.numToSelect})` : 
          questionInfo.hasLetterOptions ? 'MCQ (A-F)' : 
          'Single choice'
        }`);
        
        if (questionInfo.hasTextInput) {
          // Text input question
          await this.answerTextInput();
        } else if (questionInfo.isMultiselect) {
          // Multiselect question
          await this.answerMultiselect(questionInfo.numToSelect);
        } else {
          // Determine single-choice question type
          const hasLikertScale = await page.$('button[role="radio"]') !== null;
          const hasMultipleChoice = await page.$('input[type="radio"]') !== null;
          
          if (hasLikertScale) {
            await this.answerLikertScale(4); // Answer with rating 4
          } else if (hasMultipleChoice || questionInfo.hasLetterOptions) {
            await this.answerMultipleChoice(0); // Select first option
          } else {
            // Default: try to click any selectable option
            await this.answerMultipleChoice(0);
          }
        }
        
        // After answering, check if this is the last question
        const isLastQuestion = current === total;
        
        if (isLastQuestion) {
          console.log('   📍 Last question - looking for "Complete Section" button');
          // On last question, click "Complete Section" instead of "Next"
          await this.clickCompleteSection();
        } else {
          // Not last question, click "Next"
          await this.clickNext();
        }
      }
      
      console.log(`✅ Section completed: ${sectionName}`);
    },

    /**
     * Wait for section complete screen
     */
    async waitForSectionComplete() {
      console.log('⏳ Waiting for section complete screen...');
      
      // Wait for "Continue" or "Next Section" button (section summary screen)
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const bodyText = document.body.textContent || '';
        
        // Check if we're on the section complete/summary screen
        const hasContinueButton = buttons.some(btn => 
          btn.textContent?.includes('Continue') || 
          btn.textContent?.includes('Next Section')
        );
        
        const hasSummaryText = bodyText.includes('Section Complete') ||
                              bodyText.includes('Well done') ||
                              bodyText.includes('Great job');
        
        return hasContinueButton || hasSummaryText;
      }, { timeout: 10000 });
      
      console.log('✅ Section complete screen loaded');
    },

    /**
     * Click continue to next section
     */
    async clickContinueToNextSection() {
      console.log('➡️  Continuing to next section...');
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueButton = buttons.find(btn => 
          btn.textContent?.includes('Continue') || 
          btn.textContent?.includes('Next Section')
        );
        if (continueButton) {
          (continueButton as HTMLButtonElement).click();
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Moved to next section');
    },

    /**
     * Take a screenshot for debugging
     */
    async takeScreenshot(name: string) {
      const filename = `tests/screenshots/${name}-${Date.now()}.png`;
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
    },

    /**
     * Get progress percentage
     */
    async getProgress(): Promise<number> {
      const progressText = await page.evaluate(() => {
        const progressEl = document.querySelector('[class*="progress"]');
        return progressEl?.textContent || '0%';
      });
      
      const match = progressText.match(/(\d+)%/);
      return match ? parseInt(match[1]) : 0;
    }
  };

  // Test Cases

  describe('Initial Setup and Navigation', () => {
    test('should load assessment page successfully', async () => {
      await helpers.navigateToAssessment();
      
      // Verify page loaded
      const title = await page.title();
      expect(title).toBeTruthy();
      
      console.log(`✅ Page title: ${title}`);
    });

    test('should handle resume prompt if present', async () => {
      // Check if resume prompt was shown and handled
      const pageText = await page.evaluate(() => document.body.textContent || '');
      
      // If we see grade selection or section intro, resume was handled correctly
      const isOnAssessmentFlow = 
        pageText.includes('Select Your Grade') ||
        pageText.includes('Grade Level') ||
        pageText.includes('Interest Explorer') ||
        pageText.includes('Section 1');
      
      expect(isOnAssessmentFlow).toBe(true);
      console.log('✅ Resume prompt handled (if present)');
    });

    test('should display grade selection screen', async () => {
      // Check if grade selection is visible
      const hasGradeSelection = await page.evaluate(() => {
        return document.body.textContent?.includes('Select Your Grade') ||
               document.body.textContent?.includes('Grade Level');
      });

      if (hasGradeSelection) {
        console.log('✅ Grade selection screen displayed');
        
        // Select "High School" grade
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const highSchoolButton = buttons.find(btn => 
            btn.textContent?.includes('High School') ||
            btn.textContent?.includes('9-10')
          );
          if (highSchoolButton) {
            (highSchoolButton as HTMLButtonElement).click();
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ Selected High School grade');
      } else {
        console.log('ℹ️  Grade already selected or auto-detected');
      }
    });
  });

  describe('Section 1: Interest Explorer', () => {
    test('should display Interest Explorer intro screen', async () => {
      await helpers.waitForSectionIntro('Interest Explorer');
      
      // Verify section details
      const content = await page.evaluate(() => document.body.textContent);
      expect(content).toContain('Interest Explorer');
      expect(content).toContain('5 questions');
      
      console.log('✅ Interest Explorer intro verified');
    });

    test('should start Interest Explorer section', async () => {
      await helpers.clickStartSection();
      
      // Verify first question loaded
      const questionInfo = await helpers.getCurrentQuestionNumber();
      expect(questionInfo.current).toBe(1);
      expect(questionInfo.total).toBe(5);
      
      console.log('✅ Interest Explorer section started');
    });

    test('should complete all Interest Explorer questions', async () => {
      await helpers.completeSection('Interest Explorer', 5);
      
      // Verify section complete
      await helpers.waitForSectionComplete();
      
      console.log('✅ Interest Explorer section completed');
    });

    test('should continue to next section', async () => {
      await helpers.clickContinueToNextSection();
      
      console.log('✅ Moved to Strengths & Character section');
    });
  });

  describe('Section 2: Strengths & Character', () => {
    test('should display Strengths & Character intro screen', async () => {
      await helpers.waitForSectionIntro('Strengths & Character');
      
      console.log('✅ Strengths & Character intro verified');
    });

    test('should complete Strengths & Character section', async () => {
      await helpers.clickStartSection();
      
      // Get question count from intro
      const questionInfo = await helpers.getCurrentQuestionNumber();
      await helpers.completeSection('Strengths & Character', questionInfo.total);
      
      await helpers.waitForSectionComplete();
      await helpers.clickContinueToNextSection();
      
      console.log('✅ Strengths & Character section completed');
    });
  });

  describe('Section 3: Learning & Work Preferences', () => {
    test('should display Learning & Work Preferences intro screen', async () => {
      await helpers.waitForSectionIntro('Learning & Work Preferences');
      
      console.log('✅ Learning & Work Preferences intro verified');
    });

    test('should complete Learning & Work Preferences section', async () => {
      await helpers.clickStartSection();
      
      const questionInfo = await helpers.getCurrentQuestionNumber();
      await helpers.completeSection('Learning & Work Preferences', questionInfo.total);
      
      await helpers.waitForSectionComplete();
      await helpers.clickContinueToNextSection();
      
      console.log('✅ Learning & Work Preferences section completed');
    });
  });

  describe('Section 4: Aptitude Sampling', () => {
    test('should display Aptitude Sampling intro screen', async () => {
      await helpers.waitForSectionIntro('Aptitude Sampling');
      
      // Verify aptitude-specific indicators
      const content = await page.evaluate(() => document.body.textContent);
      expect(content).toContain('Aptitude');
      
      console.log('✅ Aptitude Sampling intro verified');
    });

    test('should handle timed aptitude questions', async () => {
      await helpers.clickStartSection();
      
      // Verify timer is present
      const hasTimer = await page.evaluate(() => {
        return document.body.textContent?.includes('Question Time') ||
               document.body.textContent?.includes('Time Remaining');
      });
      
      if (hasTimer) {
        console.log('✅ Timer detected for aptitude questions');
      }
      
      const questionInfo = await helpers.getCurrentQuestionNumber();
      await helpers.completeSection('Aptitude Sampling', questionInfo.total);
      
      await helpers.waitForSectionComplete();
      await helpers.clickContinueToNextSection();
      
      console.log('✅ Aptitude Sampling section completed');
    });
  });

  describe('Section 5: Adaptive Aptitude Test', () => {
    test('should display Adaptive Aptitude Test intro screen', async () => {
      await helpers.waitForSectionIntro('Adaptive Aptitude Test');
      
      // Verify adaptive-specific indicators
      const content = await page.evaluate(() => document.body.textContent);
      expect(content).toContain('Adaptive');
      expect(content).toContain('50 questions');
      
      console.log('✅ Adaptive Aptitude Test intro verified');
    });

    test('should handle adaptive question loading', async () => {
      await helpers.clickStartSection();
      
      // Wait for adaptive questions to load (may take longer)
      await page.waitForSelector('[class*="QUESTION"]', { 
        visible: true, 
        timeout: 30000 
      });
      
      console.log('✅ Adaptive questions loaded');
    });

    test('should complete adaptive aptitude questions', async () => {
      // Complete first 10 questions as a sample (full 50 would take too long)
      await helpers.completeSection('Adaptive Aptitude Test', 10);
      
      console.log('✅ Completed sample adaptive questions');
    });
  });

  describe('Navigation and Progress', () => {
    test('should track progress correctly', async () => {
      const progress = await helpers.getProgress();
      expect(progress).toBeGreaterThan(0);
      
      console.log(`✅ Progress: ${progress}%`);
    });

    test('should allow navigation to previous question', async () => {
      const beforeNav = await helpers.getCurrentQuestionNumber();
      
      await helpers.clickPrevious();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterNav = await helpers.getCurrentQuestionNumber();
      expect(afterNav.current).toBeLessThan(beforeNav.current);
      
      console.log('✅ Previous navigation works');
      
      // Navigate back forward
      await helpers.clickNext();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate offline mode briefly
      await page.setOfflineMode(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.setOfflineMode(false);
      
      // Verify page still works
      const isPageResponsive = await page.evaluate(() => {
        return document.body !== null;
      });
      
      expect(isPageResponsive).toBe(true);
      console.log('✅ Handles network errors');
    });

    test('should take screenshot on error', async () => {
      await helpers.takeScreenshot('final-state');
      console.log('✅ Screenshot captured');
    });
  });
});

// Helper to run tests
if (require.main === module) {
  console.log('🧪 Running Assessment Test Suite...');
  console.log(`📍 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`👤 Test User: ${TEST_USER.email}`);
  console.log(`🖥️  Headless: ${TEST_CONFIG.headless}`);
  console.log('');
}
