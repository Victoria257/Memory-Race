import { GoogleGenAI, Modality } from "@google/genai";
import { useStore } from "../store";

// Ініціалізація Gemini у фронтенді
const getAI = () => {
  try {
    const apiKey = (process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    console.log('[Gemini] API Key found:', !!apiKey);
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('[Gemini] Error initializing AI:', e);
    return null;
  }
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

  const isMuted = useStore.getState().isMuted;
  if (isMuted) return;

  try {
    const ai = getAI();
    if (ai) {
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
    }
  } catch (err) {
    console.warn('Frontend TTS failed, falling back to browser TTS:', err);
  }
  
  fallbackToBrowserTTS(text, langMap[language]);
};

const fallbackToBrowserTTS = (text: string, lang: string) => {
  console.log(`[TTS] Falling back to browser TTS for: "${text}" (lang: ${lang})`);
  
  if (!window.speechSynthesis) {
    console.error('[TTS] Browser does not support speechSynthesis');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onstart = () => console.log('[TTS] Browser speech started');
  utterance.onend = () => console.log('[TTS] Browser speech ended');
  utterance.onerror = (event) => console.error('[TTS] Browser speech error:', event);

  window.speechSynthesis.speak(utterance);
};
