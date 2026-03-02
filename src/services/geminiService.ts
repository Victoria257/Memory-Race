import { GoogleGenAI, Modality } from "@google/genai";

export const speakText = async (text: string, language: 'en' | 'sv' | 'uk' = 'uk') => {
  // const apiKey = process.env.GEMINI_API_KEY;
  
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

  // if (!apiKey) {
  //   console.warn("GEMINI_API_KEY is not set, falling back to browser TTS");
  //   fallbackToBrowserTTS(text, langMap[language]);
  //   return;
  // }

   try {
    const baseUrl = import.meta.env.VITE_APP_URL || '';
    const response = await fetch(`${baseUrl}/api/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });

    const data = await response.json();
    if (data.audio) {
      const audioUrl = URL.createObjectURL(new Blob([new Uint8Array(data.audio)], { type: 'audio/wav' }));
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Server TTS failed, fallback to browser TTS:', err);
  }
    // fallback
    fallbackToBrowserTTS(text, langMap[language]);
};

// export const generateGameCommentary = async (context: string, language: string) => {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) return "Good luck!";

//   const ai = new GoogleGenAI({ apiKey });
//   try {
//     const response = await ai.models.generateContent({
//       model: "gemini-3-flash-preview",
//       contents: `You are a fun, energetic game master for a kids game called "Memory Race". 
//       Provide a very short (max 10 words) commentary in ${language} language about this event: ${context}.
//       Be encouraging and fun!`,
//     });
//     return response.text?.trim() || "";
//   } catch (error) {
//     console.error("Gemini Commentary Error:", error);
//     return "";
//   }
// };

export const generateGameCommentary = async (context: string, language: string) => {
  try {
    const baseUrl = import.meta.env.VITE_APP_URL || '';
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: context, language })
    });

    const data = await response.json();
    return data.result || 'Good luck!';
  } catch (err) {
    console.error('Frontend AI fetch error:', err);
    return 'Good luck!';
  }
};




const fallbackToBrowserTTS = (text: string, lang: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
};

function createWavHeader(pcmDataLength: number, sampleRate: number) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmDataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, pcmDataLength, true);

  return buffer;
}
