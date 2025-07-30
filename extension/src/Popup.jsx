import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Popup.css";

const Popup = () => {
  const [activeTab, setActiveTab] = useState("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [history, setHistory] = useState([]);

  // Get current tab URL when component mounts
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
        // Auto-detect YouTube URLs
        if (tabs[0].url.includes("youtube.com/watch")) {
          setActiveTab("youtube");
          setVideoUrl(tabs[0].url);
        } else if (tabs[0].url.includes("youtube.com")) {
          setActiveTab("youtube");
        } else {
          setActiveTab("webpage");
        }
      }
    });

    // Load history from storage
    chrome.storage.local.get(["summaryHistory"], (result) => {
      if (result.summaryHistory) {
        setHistory(result.summaryHistory.slice(0, 5)); // Keep last 5
      }
    });
  }, []);

  const saveToHistory = (summary, type, source) => {
    const newHistory = [
      {
        id: Date.now(),
        summary,
        type,
        source,
        timestamp: new Date().toISOString(),
      },
      ...history.slice(0, 4), // Keep only 5 items
    ];
    setHistory(newHistory);
    chrome.storage.local.set({ summaryHistory: newHistory });
  };

  const handleYouTubeSummarize = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await axios.post("http://localhost:5000/summarize-youtube", {
        videoUrl: videoUrl.trim(),
      });

      setSummary(response.data.summary);
      saveToHistory(response.data.summary, "YouTube", videoUrl);
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.error || "Failed to summarize video");
    } finally {
      setLoading(false);
    }
  };

  const handleWebpageSummarize = async () => {
    if (!currentUrl) {
      setError("No webpage detected");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      // Get page content using content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Extract main content from the page
          const article = document.querySelector('article') || 
                         document.querySelector('[role="main"]') ||
                         document.querySelector('main') ||
                         document.querySelector('.content') ||
                         document.querySelector('#content') ||
                         document.body;
          
          return {
            title: document.title,
            content: article.innerText || article.textContent,
            url: window.location.href
          };
        }
      });

      const pageData = result[0].result;
      
      const response = await axios.post("http://localhost:5000/summarize-webpage", {
        url: pageData.url,
        content: pageData.content,
      });

      setSummary(response.data.summary);
      saveToHistory(response.data.summary, "Webpage", pageData.title);
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.error || "Failed to summarize webpage");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSummarize = async () => {
    if (!textContent.trim()) {
      setError("Please enter some text to summarize");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await axios.post("http://localhost:5000/summarize-text", {
        text: textContent.trim(),
      });

      setSummary(response.data.summary);
      saveToHistory(response.data.summary, "Text", "Custom text");
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.error || "Failed to summarize text");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = () => {
    switch (activeTab) {
      case "youtube":
        handleYouTubeSummarize();
        break;
      case "webpage":
        handleWebpageSummarize();
        break;
      case "text":
        handleTextSummarize();
        break;
      default:
        break;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show a brief notification
    const notification = document.createElement("div");
    notification.textContent = "Copied to clipboard!";
    notification.className = "copy-notification";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    chrome.storage.local.remove("summaryHistory");
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1>QuickSum</h1>
        <p>AI-Powered Content Summarizer</p>
      </div>

      <div className="tab-container">
        <button
          className={`tab ${activeTab === "youtube" ? "active" : ""}`}
          onClick={() => setActiveTab("youtube")}
        >
          🎥 YouTube
        </button>
        <button
          className={`tab ${activeTab === "webpage" ? "active" : ""}`}
          onClick={() => setActiveTab("webpage")}
        >
          🌐 Webpage
        </button>
        <button
          className={`tab ${activeTab === "text" ? "active" : ""}`}
          onClick={() => setActiveTab("text")}
        >
          📝 Text
        </button>
      </div>

      <div className="content-area">
        {activeTab === "youtube" && (
          <div className="input-section">
            <label>YouTube Video URL:</label>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="url-input"
            />
          </div>
        )}

        {activeTab === "webpage" && (
          <div className="input-section">
            <label>Current Webpage:</label>
            <div className="current-url">
              {currentUrl ? (
                <span>{new URL(currentUrl).hostname}</span>
              ) : (
                <span className="no-url">No webpage detected</span>
              )}
            </div>
          </div>
        )}

        {activeTab === "text" && (
          <div className="input-section">
            <label>Text to Summarize:</label>
            <textarea
              placeholder="Paste or type the text you want to summarize..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="text-input"
              rows={4}
            />
          </div>
        )}

        <button
          onClick={handleSummarize}
          disabled={loading}
          className="summarize-btn"
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Summarizing...
            </>
          ) : (
            "Summarize"
          )}
        </button>

        {error && <div className="error-message">{error}</div>}

        {summary && (
          <div className="summary-section">
            <div className="summary-header">
              <h3>Summary</h3>
              <button
                onClick={() => copyToClipboard(summary)}
                className="copy-btn"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            <div className="summary-content">{summary}</div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3>Recent Summaries</h3>
            <button onClick={clearHistory} className="clear-btn">
              Clear
            </button>
          </div>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-meta">
                  <span className="history-type">{item.type}</span>
                  <span className="history-time">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="history-summary">
                  {item.summary.substring(0, 100)}...
                </div>
                <button
                  onClick={() => copyToClipboard(item.summary)}
                  className="history-copy-btn"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;