"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

export default function Page() {
  const [username, setUsername] = useState("");
  const [character, setCharacter] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null); // Ref to capture the card

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username) {
      setError("Username is required");
      return;
    }

    setLoading(true);
    setError("");
    setCharacter(null);

    try {
      const response = await fetch(
        `https://anime-predictor.onrender.com/api/assign-character?username=${username}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setCharacter(data);
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareOnTwitter = async () => {
    if (cardRef.current) {
      // Capture the card as an image
      html2canvas(cardRef.current, {
        useCORS: true, // Enable CORS for external images
        scale: 2, // Higher resolution
      }).then((canvas) => {
        const image = canvas.toDataURL("image/png");

        // Create a temporary link to download the image
        const link = document.createElement("a");
        link.href = image;
        link.download = "anime-character.png"; // File name for download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Open Twitter with prefilled text
        const tweetText = `Check out my anime character: ${character.name}!\n\n#Anime #LeetCode`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          tweetText
        )}`;
        window.open(tweetUrl, "_blank");
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://i.ibb.co/yQNtRR1/anime.jpg/1920x1080')`,
      }}
    >
      <div className="bg-white/95 p-8 rounded-lg shadow-2xl w-full max-w-2xl backdrop-blur-sm relative z-10">
        <h1 className="text-4xl font-bold text-center mb-6 text-purple-800 font-anime">
          Anime Character Assigner
        </h1>
        <p className="text-center text-blue-700 mb-6 font-sans">
          Enter your LeetCode username!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your LeetCode username"
            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition duration-200 disabled:bg-purple-400"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Get Character"
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {character && (
          <div
            ref={cardRef}
            className="mt-6 space-y-4 bg-white p-6 rounded-lg shadow-md mx-auto lg:w-[600px]" // Fixed width for larger screens
          >
            <h2 className="text-3xl font-bold text-purple-800 font-anime">
              Your Anime Character:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xl font-bold text-purple-700">
                  {character.name}
                </p>
                <p className="text-gray-700">
                  <strong>Reason:</strong> {character.recommendation}
                </p>
              </div>
              {character.image_url && (
                <img
                  src={`https://res.cloudinary.com/dtoziahfz/image/fetch/${encodeURIComponent(
                    character.image_url
                  )}` || "/placeholder.svg"}
                  alt="Character"
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg"; // Fallback image
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-2 font-anime">
                    Total Solved
                  </h3>
                  <p className="text-3xl font-bold">
                    {character.leetcodeData.totalSolved}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-400 to-red-600 text-white">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-2 font-anime">
                    Hard Solved
                  </h3>
                  <p className="text-3xl font-bold">
                    {character.leetcodeData.hardSolved}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-2 font-anime">Ranking</h3>
                  <p className="text-3xl font-bold">
                    {character.leetcodeData.ranking}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Twitter Share Button */}
            <Button
              onClick={handleShareOnTwitter}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Share on Twitter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}