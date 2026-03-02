import { GoogleGenAI, Modality } from "@google/genai";

export const speakText = async (text: string, language: 'en' | 'sv' | 'uk' = 'uk') => {
  const apiKey = process.env.GEMINI_API_KEY;
  
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

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set, falling back to browser TTS");
    fallbackToBrowserTTS(text, langMap[language]);
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const ttsTimeout = new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error("Gemini TTS Timeout")), 5000)
  );

  try {
    const responsePromise = ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        systemInstruction: `You are a fun, energetic and very friendly game master for a kids game. 
        Speak the following text in ${langNameMap[language]} language. 
        Use a very expressive, happy, and child-friendly tone. 
        Do NOT use any other language like Russian.`,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const response = await Promise.race([responsePromise, ttsTimeout]) as any;
    if (!response) throw new Error("No response");

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const pcmData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const wavHeader = createWavHeader(pcmData.length, 24000);
      const wavBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(wavBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    }
  } catch (error) {
    console.error("Gemini TTS Error or Timeout:", error);
    fallbackToBrowserTTS(text, langMap[language]);
  }
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
    const response = await fetch(`${import.meta.env.VITE_APP_URL}/api/generate`, {
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
