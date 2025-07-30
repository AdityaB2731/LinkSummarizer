const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { getTranscript } = require("youtube-transcript");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware for error handling
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ 
    error: "Internal server error", 
    message: err.message 
  });
};

// Helper function to extract YouTube video ID
const getVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Helper function to generate summary prompt
const generatePrompt = (content, contentType) => {
  const basePrompt = "Please provide a comprehensive summary of the following content in 5-7 bullet points, highlighting the key insights and main takeaways:";
  
  switch (contentType) {
    case 'youtube':
      return `${basePrompt}\n\nYouTube Video Transcript:\n${content}`;
    case 'webpage':
      return `${basePrompt}\n\nWeb Page Content:\n${content}`;
    case 'text':
      return `${basePrompt}\n\nText Content:\n${content}`;
    default:
      return `${basePrompt}\n\nContent:\n${content}`;
  }
};

// YouTube video summarization
app.post("/summarize-youtube", async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL is required" });
  }

  try {
    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Get transcript using youtube-transcript library
    const transcriptData = await getTranscript(videoId);
    const transcript = transcriptData.map(item => item.text).join(" ");

    if (!transcript) {
      return res.status(404).json({ error: "No transcript available for this video" });
    }

    // Generate summary using Gemini API
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          {
            parts: [
              { text: generatePrompt(transcript, 'youtube') }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        }
      }
    );

    const summary = response.data.candidates[0].content.parts[0].text;
    res.json({ 
      summary,
      videoId,
      transcriptLength: transcript.length,
      contentType: 'youtube'
    });

  } catch (error) {
    console.error("Error summarizing YouTube video:", error.message);
    if (error.response?.status === 404) {
      res.status(404).json({ error: "Video not found or transcript unavailable" });
    } else {
      res.status(500).json({ error: "Failed to summarize video" });
    }
  }
});

// Web page content summarization
app.post("/summarize-webpage", async (req, res) => {
  const { url, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    // Clean and extract main content
    const cleanContent = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Limit content length

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        contents: [
          {
            parts: [
              { text: generatePrompt(cleanContent, 'webpage') }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        }
      }
    );

    const summary = response.data.candidates[0].content.parts[0].text;
    res.json({ 
      summary,
      url,
      contentLength: cleanContent.length,
      contentType: 'webpage'
    });

  } catch (error) {
    console.error("Error summarizing webpage:", error.message);
    res.status(500).json({ error: "Failed to summarize webpage" });
  }
});

// General text summarization
app.post("/summarize-text", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text content is required" });
  }

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        contents: [
          {
            parts: [
              { text: generatePrompt(text, 'text') }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        }
      }
    );

    const summary = response.data.candidates[0].content.parts[0].text;
    res.json({ 
      summary,
      textLength: text.length,
      contentType: 'text'
    });

  } catch (error) {
    console.error("Error summarizing text:", error.message);
    res.status(500).json({ error: "Failed to summarize text" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Use error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`QuickSum backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
