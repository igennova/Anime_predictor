import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// AniList API endpoint for searching characters
const ANILIST_API_URL = "https://graphql.anilist.co";

// GraphQL query to fetch anime characters
const ANILIST_QUERY = `
query ($search: String) {
    Character(search: $search) {
        name {
            full
        }
        description
        image {
            large
        }
    }
}
`;

// Fetch anime character data from AniList
async function fetchAnimeCharacter(searchTerm) {
    const variables = { search: searchTerm };
    try {
        const response = await axios.post(ANILIST_API_URL, {
            query: ANILIST_QUERY,
            variables: variables,
        });
        console.log("AniList API Response:", response.data); // Log the response
        if (response.status === 200) {
            return response.data.data.Character;
        }
    } catch (error) {
        console.error("AniList API Error:", error.response ? error.response.data : error.message);
    }
    return null;
}

// Fetch LeetCode data for the username
async function fetchLeetCodeData(username) {
    try {
        const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`);
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.error("LeetCode API Error:", error.response ? error.response.data : error.message);
    }
    return null;
}

// Recommend anime character using Gemini
async function recommendAnimeCharacter(totalSolved, hardSolved, rating) {
    const prompt = `
    Based on the following LeetCode profile:

    - Total problems solved: ${totalSolved}
    - Hard problems solved: ${hardSolved}
    - Ranking on LeetCode: ${rating}

    Recommend an anime character male or female that best represents this user. 
  
    You can be creative and use the LeetCode stats to match the character's traits or abilities.
    Roast them also in one liner and use different anime character most of the time
    Return the response in the following format:
    the description should be only 50-60 words and u can also roast them if their profile is not strong
    Character Name: <character_name>
    Description: <brief_description>
    `;

    try {
        // Generate content using Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const recommendation = response.text();
        return recommendation.trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return null;
    }
}

// Extract character name from recommendation
function extractCharacterName(recommendation) {
    const match = recommendation.match(/Character Name:\s*(.+)/);
    return match ? match[1].trim() : null;
}

// Clean the character name (remove parentheses and extra info)
function cleanCharacterName(characterName) {
    return characterName.replace(/\s*\(.*?\)\s*/, "").trim();
}

// API endpoint to assign anime character
app.get("/api/assign-character", async (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        // Fetch LeetCode data for the username
        const leetcodeData = await fetchLeetCodeData(username);
        if (!leetcodeData) {
            return res.status(404).json({ error: "LeetCode profile not found" });
        }

        const { totalSolved, hardSolved, ranking: rating } = leetcodeData;

        // Recommend anime character using Gemini
        const recommendation = await recommendAnimeCharacter(totalSolved, hardSolved, rating);
        if (!recommendation) {
            return res.status(500).json({ error: "Failed to generate recommendation" });
        }

        // Extract character name from recommendation
        const characterName = extractCharacterName(recommendation);
        if (!characterName) {
            return res.status(404).json({ error: "Failed to extract character name from recommendation" });
        }

        // Clean the character name
        let cleanedCharacterName = cleanCharacterName(characterName);

        console.log("Recommendation:", recommendation);
        console.log("Character Name:", cleanedCharacterName);
        if (cleanedCharacterName=="Levi Ackerman"){
            cleanedCharacterName="Levi"
        }
        else if (cleanedCharacterName=="Kiyotaka Ayanokoji"){
            cleanedCharacterName="Ayanokoji"
        }

        // Fetch character data from AniList
        const character = await fetchAnimeCharacter(cleanedCharacterName);

        // If character is not found, return only name and description
        if (!character) {
            return res.json({
                name: cleanedCharacterName,
                description: "No description available.",
                recommendation: recommendation,
                leetcodeData: leetcodeData,
            });
        }

        // If character image is not available, return only name and description
        if (!character.image || !character.image.large) {
            return res.json({
                name: character.name.full,
                description: character.description || "No description available.",
                recommendation: recommendation,
                leetcodeData: leetcodeData,
            });
        }

        // Return full character data
        return res.json({
            name: character.name.full,
            description: character.description || "No description available.",
            image_url: character.image.large,
            recommendation: recommendation,
            leetcodeData: leetcodeData,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});