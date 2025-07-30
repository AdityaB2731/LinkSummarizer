import React, { useState } from "react";
import axios from "axios";

const Popup = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const getVideoId = (url) => {
    const regex = /(?:v=|\/)([0-9A-Za-z_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchTranscript = async (videoId) => {
    const response = await axios.get(
      `https://yt.lemnoslife.com/videos?part=player&id=${videoId}`
    );
    const transcript = response.data.items[0]?.player?.embedHtml || "Transcript not available";
    return transcript;
  };

  const handleSummarize = async () => {
    setLoading(true);
    const videoId = getVideoId(videoUrl);

    if (!videoId) {
      alert("Invalid URL");
      setLoading(false);
      return;
    }

    try {
      const transcript = await fetchTranscript(videoId);

      const response = await axios.post("http://localhost:5000/summarize", {
        transcript,
      });

      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error:", error.message);
      setSummary("Failed to fetch summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 10, width: 300 }}>
      <h3>QuickSum</h3>
      <input
        type="text"
        placeholder="Paste YouTube URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button onClick={handleSummarize} disabled={loading}>
        {loading ? "Summarizing..." : "Summarize"}
      </button>
      <p>{summary}</p>
    </div>
  );
};

export default Popup;