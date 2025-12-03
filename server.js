import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// Enable CORS to allow the React app (usually on port 5173) to talk to this server
app.use(cors());
app.use(express.json());

// Initialize Gemini
// NOTE: Make sure you have a .env file with API_KEY=your_key_here
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Weather Tool Logic (Moved from Frontend) ---

const weatherTool = {
  name: 'get_weather',
  description: 'Get the forecast for a specific location using latitude and longitude. NOTE: This API only supports locations within the United States.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      latitude: {
        type: Type.NUMBER,
        description: 'The latitude of the location.',
      },
      longitude: {
        type: Type.NUMBER,
        description: 'The longitude of the location.',
      },
    },
    required: ['latitude', 'longitude'],
  },
};

const fetchNWSForecast = async (lat, lon) => {
  try {
    const headers = { 'Accept': 'application/geo+json' }; // No User-Agent to avoid blocking

    // 1. Get Grid Point
    const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers });
    
    if (pointsResponse.status === 404) {
      return { error: "Location not found. The NWS API only supports locations within the US." };
    }
    
    if (!pointsResponse.ok) {
      throw new Error(`NWS Points API Error: ${pointsResponse.status}`);
    }

    const pointsData = await pointsResponse.json();
    const forecastUrl = pointsData.properties?.forecast;

    if (!forecastUrl) throw new Error("No forecast URL found.");

    // 2. Get Forecast
    const forecastResponse = await fetch(forecastUrl, { headers });
    if (!forecastResponse.ok) throw new Error(`NWS Forecast API Error: ${forecastResponse.statusText}`);

    const forecastData = await forecastResponse.json();
    return forecastData.properties.periods.slice(0, 3);
  } catch (error) {
    console.error("Server Weather Error:", error);
    return { error: error.message };
  }
};

// --- API Route ---

app.post('/api/chat', async (req, res) => {
  try {
    const { history, message } = req.body;

    // 1. Convert Client History (ChatMessage[]) to Gemini History (Content[])
    // We assume the client sends the full conversation so far
    const geminiHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const currentMessagePart = { role: 'user', parts: [{ text: message }] };
    
    // 2. Initial Call to Gemini
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...geminiHistory, currentMessagePart],
      config: {
        tools: [{ functionDeclarations: [weatherTool] }],
      },
    });

    const call = result.functionCalls?.[0];

    // 3. Check for Function Call
    if (call) {
      console.log(`Executing tool: ${call.name}`);
      const { latitude, longitude } = call.args;
      
      // Execute Logic on Server
      const weatherData = await fetchNWSForecast(latitude, longitude);

      // 4. Send Result back to Gemini (Server-side Loop)
      const result2 = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...geminiHistory,
          currentMessagePart,
          { role: 'model', parts: [{ functionCall: call }] },
          { 
            role: 'function', 
            parts: [{ 
              functionResponse: { 
                name: 'get_weather', 
                response: { content: weatherData } 
              } 
            }] 
          }
        ],
      });

      // Send Final Text to Client
      res.json({ 
        text: result2.text || "Processed weather data but got no summary.",
        toolUsed: true 
      });

    } else {
      // Standard Text Response
      res.json({ 
        text: result.text || "No response.",
        toolUsed: false
      });
    }

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});