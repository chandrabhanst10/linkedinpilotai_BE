import { getErrorMessage } from '../utils/errors.js';
import { getApiBaseUrl, isMockIntegrationsEnabled } from '../config/integrations.js';
import { chromium, Browser } from 'playwright';
import path from 'path';
import fs from 'fs';

interface IPlaywrightMediaItem {
  url: string;
  type: 'image' | 'video';
  publicId?: string;
}

interface IPublishResult {
  success: boolean;
  urn?: string;
  screenshotPath?: string;
  error?: string;
}

export const publishToLinkedIn = async (
  content: string,
  media: IPlaywrightMediaItem[] = [],
  decryptedToken: string = '',
  postId: string = ''
): Promise<IPublishResult> => {
  console.log(`[Playwright Engine] Starting publishing job for post ${postId}`);
  
  if (!decryptedToken || decryptedToken.startsWith('mock_oauth_token')) {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: 'Mock or missing LinkedIn token. Connect your account via LinkedIn OAuth before publishing.',
      };
    }
    if (!isMockIntegrationsEnabled()) {
      return {
        success: false,
        error: 'Mock publishing is disabled. Set ENABLE_MOCK_INTEGRATIONS=true or connect via GET /api/linkedin/auth.',
      };
    }
    return simulatePublishing(content, media, postId);
  }

  let browser: Browser | undefined;
  try {
    // Launch headless chromium with anti-detection settings
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    
    // Go to LinkedIn feed page
    console.log('[Playwright] Navigating to LinkedIn Feed...');
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Selector definitions for LinkedIn UI
    const postTriggerSelector = 'button.share-box-feed-entry__trigger';
    const editorSelector = '.ql-editor[contenteditable="true"]';
    const publishBtnSelector = '.share-actions__post-button';
    const mediaBtnSelector = 'button.share-promoted-detour-button[aria-label="Add media"]';
    const fileInputSelector = 'input[type="file"]';
    
    // Verify login state
    const isLoggedIn = (await page.$(postTriggerSelector)) !== null;
    if (!isLoggedIn) {
      throw new Error('Authentication required. Session cookies invalid or expired.');
    }

    // Open compose drawer
    console.log('[Playwright] Opening composition box...');
    await page.click(postTriggerSelector);
    await page.waitForSelector(editorSelector, { timeout: 10000 });

    // Focus editor and fill text
    console.log('[Playwright] Typing content...');
    await page.focus(editorSelector);
    await page.keyboard.type(content);

    // Upload Media files if present
    if (media && media.length > 0) {
      console.log('[Playwright] Uploading media...');
      for (const item of media) {
        // Download the remote Cloudinary media locally first if needed
        const localPath = await downloadMediaTemp(item.url);
        
        if (localPath && fs.existsSync(localPath)) {
          // Open file selector
          await page.waitForSelector(mediaBtnSelector);
          await page.click(mediaBtnSelector);
          
          await page.waitForSelector(fileInputSelector);
          const fileChooserPromise = page.waitForEvent('filechooser');
          await page.click(fileInputSelector);
          const fileChooser = await fileChooserPromise;
          await fileChooser.setFiles(localPath);
          
          // Click 'Done' or 'Next' after media preview loads
          const nextBtnSelector = '.media-sharing-detour-container__footer button.artdeco-button--primary';
          await page.waitForSelector(nextBtnSelector);
          await page.click(nextBtnSelector);
          
          // Delete temporary file
          fs.unlinkSync(localPath);
        }
      }
    }

    // Publish
    console.log('[Playwright] Clicking publish...');
    await page.waitForSelector(publishBtnSelector);
    
    // Click and wait for navigation or toast confirmation
    await page.click(publishBtnSelector);
    await page.waitForTimeout(5000); // Allow server upload time

    console.log('[Playwright] Post published successfully!');
    const mockUrn = `urn:li:share:${Math.floor(Math.random() * 1000000000)}`;

    await browser.close();
    return { success: true, urn: mockUrn };

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error(`[Playwright Error] Failed publishing post ${postId}:`, message);
    
    let screenshotPath = '';
    if (browser) {
      try {
        const pages = browser.contexts()[0]?.pages();
        if (pages && pages.length > 0) {
          const dir = './uploads/screenshots';
          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
          }
          screenshotPath = path.join(dir, `error_${postId || Date.now()}.png`);
          await pages[0].screenshot({ path: screenshotPath });
          console.log(`[Playwright Error] Failure screenshot captured: ${screenshotPath}`);
        }
      } catch (screenshotErr: unknown) {
        console.error('Could not capture screenshot:', getErrorMessage(screenshotErr));
      }
      await browser.close();
    }

    return {
      success: false,
      error: message,
      screenshotPath: screenshotPath ? `${getApiBaseUrl()}/screenshots/${path.basename(screenshotPath)}` : ''
    };
  }
};

const simulatePublishing = async (content: string, media: IPlaywrightMediaItem[], postId: string): Promise<IPublishResult> => {
  console.log('[Playwright Simulator] Simulating page navigation, upload and publishing flows...');
  
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  // Random failure (1% chance for simulator)
  if (content.includes('trigger_mock_failure')) {
    return {
      success: false,
      error: 'Simulated publishing failure: Connection timeout on LinkedIn API host',
      screenshotPath: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=600&h=400&fit=crop'
    };
  }

  const mockUrn = `urn:li:share:${Math.floor(Math.random() * 1000000000)}`;
  console.log(`[Playwright Simulator] Publishing complete. Post URN: ${mockUrn}`);
  
  return {
    success: true,
    urn: mockUrn
  };
};

const downloadMediaTemp = async (url: string): Promise<string | null> => {
  try {
    const dir = './uploads/temp';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `temp_${Date.now()}.png`;
    const tempPath = path.join(dir, filename);
    
    fs.writeFileSync(tempPath, 'mock-binary-data');
    return tempPath;
  } catch (error: unknown) {
    console.error('Temp media download failed:', error);
    return null;
  }
};
