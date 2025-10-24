// Load secret keys from .env file
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000; // Your server will run on http://localhost:3000

// Get API keys from the secure .env file
const EXA_API_KEY = process.env.EXA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Middleware ---
// Allow requests from your frontend (index.html)
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// --- API Endpoints ---

/**
 * Endpoint to analyze the Job Description
 * Your frontend will call this instead of Google
 */
app.post('/api/analyze', async (req, res) => {
    const { jdText, systemPrompt } = req.body;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: [{ parts: [{ text: jdText }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
        }
    };

    try {
        const response = await axios.post(GEMINI_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        // Send the good response back to your index.html
        res.json(response.data);
    } catch (error) {
        console.error('Gemini API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to call Gemini API' });
    }
});


/**
 * Endpoint to search for resources
 * Your frontend will call this instead of Exa
 */
/**
 * Endpoint to search for resources
 * Your frontend will call this instead of Exa
 *
 * --- (NEW FALLBACK LOGIC ADDED) ---
 * This now tries a smart 'neural' search first. If that fails,
 * it falls back to a broad 'keyword' search to ensure results.
 */
app.post('/api/search', async (req, res) => {
    // We now expect 'skill' AND 'searchType'
    const { skill, searchType } = req.body;

    if (!EXA_API_KEY) {
        return res.status(500).json({ error: 'Exa API key is not configured.' });
    }

    const EXA_URL = 'https://api.exa.ai/search';
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
        'User-Agent': 'JD-Roadmap-Demo/1.0.0'
    };

    // 1. Define the query based on the search type
    let neuralQuery;
    let keywordQuery = skill; // Keyword query is always the skill itself

    switch (searchType) {
        case 'project':
            neuralQuery = `practical project ideas for beginners using ${skill}`;
            keywordQuery = `${skill} project ideas`;
            break;
        case 'insight':
            neuralQuery = `expert insights and analysis on ${skill}`;
            keywordQuery = `${skill} expert blog post`;
            break;
        case 'interview':
            neuralQuery = `common technical interview questions for ${skill}`;
            keywordQuery = `${skill} interview questions`;
            break;
        case 'tutorial':
        default:
            neuralQuery = `best guides and tutorials for learning ${skill}`;
            keywordQuery = `learn ${skill} tutorial`;
            break;
    }

    // --- Attempt 1: Smart, Neural Search (Primary) ---
    const neuralPayload = {
        query: neuralQuery,
        numResults: 2, // 2 results per type is good
        type: 'neural',
        useAutoprompt: true
    };

    console.log(`Exa (Neural) for "${skill}" [${searchType}]: "${neuralQuery}"`);

    try {
        let response = await axios.post(EXA_URL, neuralPayload, { headers });

        if (response.data && response.data.results && response.data.results.length > 0) {
            console.log(`Exa (Neural) for "${skill}" [${searchType}]: SUCCESS`);
            return res.json(response.data); // Success!
        }

        // --- Attempt 2: Fallback, Keyword Search ---
        console.log(`Exa (Neural) FAILED. Trying Fallback (Keyword) for "${skill}" [${searchType}]`);
        
        const keywordPayload = {
            query: keywordQuery,
            numResults: 2,
            type: 'keyword'
        };

        response = await axios.post(EXA_URL, keywordPayload, { headers });
        console.log(`Exa (Keyword) for "${skill}" [${searchType}]: Complete.`);
        return res.json(response.data);

    } catch (error) {
        console.error(`Exa API Error (in /api/search for ${searchType}):`, error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to call Exa API' });
    }
});

app.post('/api/explain', async (req, res) => {
    const { skill } = req.body;

    if (!EXA_API_KEY || !GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API keys are not configured.' });
    }

    const EXA_URL = 'https://api.exa.ai/search';
    const EXA_CONTENTS_URL = 'https://api.exa.ai/contents';
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY
    };
    
    // --- Step 1: Search for top 3 explanation articles ---
    console.log(`[Explain] Searching for: "what is ${skill} simple explanation"`);
    let searchResponse;
    try {
        const searchPayload = {
            query: `what is ${skill} simple explanation for beginners`,
            numResults: 3,
            type: 'neural'
        };
        searchResponse = await axios.post(EXA_URL, searchPayload, { headers });
        
        if (!searchResponse.data || !searchResponse.data.results || searchResponse.data.results.length === 0) {
            // Fallback to keyword search
            console.log(`[Explain] Neural failed. Trying keyword.`);
            searchPayload.type = 'keyword';
            searchResponse = await axios.post(EXA_URL, searchPayload, { headers });
            if (!searchResponse.data || !searchResponse.data.results || searchResponse.data.results.length === 0) {
                 throw new Error('No search results found.');
            }
        }
    } catch (error) {
        console.error('Exa search error:', error.message);
        return res.status(500).json({ error: 'Failed to search for explanations.' });
    }

    const searchResults = searchResponse.data.results;

    // --- Step 2: Get the contents of those articles ---
    console.log(`[Explain] Fetching contents for ${searchResults.length} articles...`);
    let combinedText = "";
    try {
        const contentsPayload = {
            ids: searchResults.map(result => result.id),
            text: {
                maxCharacters: 2000,
                includeHtmlTags: false
            }
        };
        const contentsResponse = await axios.post(EXA_CONTENTS_URL, contentsPayload, { headers });
        
        if (!contentsResponse.data || !contentsResponse.data.results) {
            throw new Error('No content returned from Exa.');
        }

        // Combine all the text into one block
        combinedText = contentsResponse.data.results
            .map(content => content.text)
            .join("\n\n---\n\n");
            
    } catch (error) {
        console.error('Exa contents error:', error.message);
        return res.status(500).json({ error: 'Failed to get content for explanations.' });
    }

    // --- Step 3: Use Gemini to synthesize an answer ---
    console.log(`[Explain] Synthesizing answer from ${combinedText.length} chars...`);
    try {
        const systemPrompt = `You are a helpful teaching assistant. Based *only* on the provided text, synthesize a single, clear, one-paragraph explanation of "what is ${skill}" suitable for a beginner. Do not use any knowledge outside of the text. Do not start with "Based on the text...". Just provide the explanation.`;
        
        const geminiPayload = {
            contents: [{ parts: [{ text: combinedText }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        const geminiResponse = await axios.post(GEMINI_URL, geminiPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const explanation = geminiResponse.data.candidates[0].content.parts[0].text;
        
        // --- Step 4: Send the final explanation back to the client ---
        res.json({ explanation: explanation });

    } catch (error) {
        console.error('Gemini synthesis error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to synthesize explanation.' });
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`✅ Proxy server running on http://localhost:${PORT}`);
    console.log('You can now open your index.html file in the browser.');
});