import { GoogleGenAI, Modality } from "@google/genai";

// Ініціалізація Gemini у фронтенді
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('An API Key must be set when running in a browser');
  }
  return new GoogleGenAI({ apiKey });
};

export const speakText = async (text: string, language: 'en' | 'sv' | 'uk' = 'uk') => {
  const langMap = {
    'en': 'en-US',
    'sv': 'sv-SE',
    'uk': 'uk-UA'
  };

  const langNameMap = {
    'en': 'English',
    'sv': 'Swedish',
    'uk': 'Ukrainian'
  };

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        systemInstruction: `You are a fun, energetic and very friendly game master. Speak in ${langNameMap[language]}.`,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Frontend TTS failed, fallback to browser TTS:', err);
  }
  
  // fallback
  fallbackToBrowserTTS(text, langMap[language]);
};

const fallbackToBrowserTTS = (text: string, lang: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
};
