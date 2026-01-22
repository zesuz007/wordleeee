
import { GoogleGenAI, Type } from "@google/genai";
import { WordInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchDailyWord(): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Choose a common, unique 6-letter English word for a Wordle game. Return ONLY the word in uppercase.",
      config: {
        temperature: 0.9,
      }
    });
    const word = response.text.trim().toUpperCase();
    return word.length === 6 ? word : "GOSSIP";
  } catch (error) {
    console.error("Error fetching daily word:", error);
    return "GOSSIP";
  }
}

export async function getWordDetails(word: string): Promise<WordInfo> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide details for the word "${word}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
            example: { type: Type.STRING },
            etymology: { type: Type.STRING }
          },
          required: ["word", "definition", "example"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error getting word details:", error);
    return {
      word,
      definition: "A 6-letter word often used in puzzles.",
      example: "They shared some juicy gossip."
    };
  }
}

export async function getHint(word: string, currentGuesses: string[]): Promise<string> {
  if (word.toUpperCase() === 'GOSSIP') {
    return "Something we do; something we watch";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The target word is "${word}". The user has guessed: ${currentGuesses.join(", ")}. Provide a cryptic, one-sentence hint without revealing the word.`,
    });
    return response.text.trim();
  } catch (error) {
    return "Think of something common in social interactions.";
  }
}
