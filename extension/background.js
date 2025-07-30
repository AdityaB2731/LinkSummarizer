// Background script for QuickSum extension
// Handles extension lifecycle and communication

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('QuickSum extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      summaryHistory: [],
      settings: {
        autoDetectYouTube: true,
        maxHistoryItems: 5,
        theme: 'default'
      }
    });
  } else if (details.reason === 'update') {
    console.log('QuickSum extension updated');
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically due to manifest configuration
  console.log('QuickSum icon clicked');
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs[0]);
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'extractPageContent') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'extractContent' }, (response) => {
        sendResponse(response);
      });
    });
    return true;
  }
  
  if (request.action === 'showExtractionIndicator') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'showExtractionIndicator' }, (response) => {
        sendResponse(response);
      });
    });
    return true;
  }
});

// Context menu for right-click summarization
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'summarizeSelection',
    title: 'Summarize selected text with QuickSum',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'summarizePage',
    title: 'Summarize this page with QuickSum',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'summarizeSelection') {
    // Store selected text and open popup
    chrome.storage.local.set({ 
      selectedText: info.selectionText,
      pendingAction: 'summarizeText'
    });
    
    // Open popup
    chrome.action.openPopup();
  }
  
  if (info.menuItemId === 'summarizePage') {
    // Set pending action to summarize page
    chrome.storage.local.set({ 
      pendingAction: 'summarizePage',
      targetUrl: tab.url
    });
    
    // Open popup
    chrome.action.openPopup();
  }
});

// Handle tab updates to detect YouTube videos
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a YouTube video page
    if (tab.url.includes('youtube.com/watch')) {
      // Update extension icon or badge to indicate YouTube detection
      chrome.action.setBadgeText({ 
        text: 'YT', 
        tabId: tabId 
      });
      chrome.action.setBadgeBackgroundColor({ 
        color: '#ff0000', 
        tabId: tabId 
      });
    } else {
      // Clear badge for non-YouTube pages
      chrome.action.setBadgeText({ 
        text: '', 
        tabId: tabId 
      });
    }
  }
});

// Handle tab activation to update badge
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && tab.url.includes('youtube.com/watch')) {
      chrome.action.setBadgeText({ 
        text: 'YT', 
        tabId: activeInfo.tabId 
      });
      chrome.action.setBadgeBackgroundColor({ 
        color: '#ff0000', 
        tabId: activeInfo.tabId 
      });
    } else {
      chrome.action.setBadgeText({ 
        text: '', 
        tabId: activeInfo.tabId 
      });
    }
  });
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.summaryHistory) {
    console.log('Summary history updated');
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('QuickSum background script started');
});

// Handle uninstall
chrome.runtime.setUninstallURL('https://github.com/your-repo/quicksum'); 