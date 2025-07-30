// Content script for QuickSum extension
// This script runs on web pages to extract content for summarization

(function() {
  'use strict';

  // Function to extract main content from the page
  function extractPageContent() {
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ads', '.sidebar', '.navigation',
      '.menu', '.footer', '.header', '.comments', '.social-share'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Try to find the main content area
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-content',
      '.main-content'
    ];

    let mainContent = null;
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 200) {
        mainContent = element;
        break;
      }
    }

    // If no main content found, use body
    if (!mainContent) {
      mainContent = document.body;
    }

    // Extract text content
    let content = mainContent.innerText || mainContent.textContent;
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    return {
      title: document.title,
      content: content,
      url: window.location.href,
      hostname: window.location.hostname
    };
  }

  // Function to extract YouTube video information
  function extractYouTubeInfo() {
    if (!window.location.hostname.includes('youtube.com')) {
      return null;
    }

    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) {
      return null;
    }

    // Try to get video title
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') ||
                        document.querySelector('h1.title') ||
                        document.querySelector('h1');
    
    const title = titleElement ? titleElement.textContent.trim() : 'YouTube Video';

    // Try to get channel name
    const channelElement = document.querySelector('a.ytd-channel-name') ||
                          document.querySelector('.ytd-channel-name a') ||
                          document.querySelector('.channel-name');
    
    const channel = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';

    return {
      videoId: videoId,
      title: title,
      channel: channel,
      url: window.location.href
    };
  }

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
      const content = extractPageContent();
      sendResponse(content);
    } else if (request.action === 'extractYouTubeInfo') {
      const youtubeInfo = extractYouTubeInfo();
      sendResponse(youtubeInfo);
    }
  });

  // Add a visual indicator when content is being extracted
  function showExtractionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'quicksum-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
    `;
    indicator.textContent = '📝 Extracting content for QuickSum...';
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => indicator.remove(), 300);
      }
    }, 2000);
  }

  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Listen for extraction requests and show indicator
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showExtractionIndicator') {
      showExtractionIndicator();
      sendResponse({ success: true });
    }
  });

  console.log('QuickSum content script loaded');
})(); 