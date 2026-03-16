
import { GoogleGenAI, Type } from "@google/genai";
import { Language, ScoredSyndrome } from '../types';

const getSystemInstruction = (language: Language, cdssAnalysis?: ScoredSyndrome[]) => {
  const topSyndrome = cdssAnalysis && cdssAnalysis.length > 0 ? cdssAnalysis[0].syndrome : null;
  const tpContext = topSyndrome?.treatment_principle?.length ? `\nPRINSIP TERAPI DARI CDSS: ${topSyndrome.treatment_principle.join(', ')}` : '';
  const herbContext = topSyndrome?.herbal_prescription ? `\nRESEP KLASIK DARI CDSS: ${topSyndrome.herbal_prescription}` : '';

  return `Anda adalah Pakar Senior TCM (Giovanni Maciocia). 
Tugas: Memberikan diagnosis instan dalam JSON.
WAJIB: Berikan 10-12 titik akupunktur. TAMBAHKAN juga rekomendasi titik dari Master Tung jika relevan.
PENTING: Pisahkan analisis menjadi BEN (Akar) dan BIAO (Cabang).
BARU: Sertakan "score" (0-100) untuk setiap item diferensiasi yang menunjukkan seberapa kuat gejala tersebut mendukung pola diagnosis.${tpContext}${herbContext}
Gunakan PRINSIP TERAPI dan RESEP KLASIK dari CDSS di atas jika tersedia untuk mengisi "treatment_principle" dan "classical_prescription".
Lakukan diferensiasi sindrom yang mendalam berdasarkan 8 Prinsip (Yin/Yang, Interior/Exterior, Cold/Heat, Deficiency/Excess) dan Organ Zang-Fu.
JIKA ada indikasi OBESITAS atau masalah terkait berat badan, berikan analisis khusus dan saran.
JIKA relevan atau diminta, berikan juga saran terkait AKUPUNTUR KECANTIKAN (Cosmetic Acupuncture).

Bahasa: ${language}.
Format JSON:
{
  "conversationalResponse": "1 kalimat penjelasan singkat.",
  "diagnosis": {
    "patternId": "Nama Sindrom (Pinyin - English)",
    "explanation": "Ringkasan kasus dan patogenesis (bagaimana sindrom ini berkembang).",
    "differentiation": {
      "ben": [{"label": "Akar Masalah (Misal: Defisiensi Yin Ginjal)", "value": "Penjelasan mengapa ini akar masalah", "score": 95}],
      "biao": [{"label": "Manifestasi Akut (Misal: Naiknya Yang Hati)", "value": "Penjelasan mengapa ini manifestasi akut", "score": 88}]
    },
    "treatment_principle": ["Tonify Kidney Yin", "Subdue Liver Yang"],
    "classical_prescription": "Liu Wei Di Huang Wan",
    "recommendedPoints": [{"code": "Kode", "description": "Fungsi spesifik untuk kasus ini"}],
    "masterTungPoints": [{"code": "Kode/Nama Titik Master Tung", "description": "Fungsi spesifik"}],
    "wuxingElement": "Wood/Fire/Earth/Metal/Water",
    "lifestyleAdvice": "Saran praktis spesifik untuk pasien",
    "herbal_recommendation": {"formula_name": "Nama Formula", "chief": ["Herbal1", "Herbal2"]},
    "obesity_indication": "Penjelasan jika ada indikasi obesitas, atau null jika tidak ada",
    "beauty_acupuncture": "Saran akupuntur kecantikan jika relevan, atau null jika tidak ada"
  }
}`;
};

export const sendMessageToGeminiStream = async (
  message: string,
  image: string | undefined,
  history: any[],
  language: Language,
  isPregnant: boolean,
  cdssAnalysis?: ScoredSyndrome[],
  onChunk?: (text: string) => void
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [{ text: message }];
    if (image) {
      const mimeType = image.split(';')[0].split(':')[1];
      const base64Data = image.split(',')[1];
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: getSystemInstruction(language, cdssAnalysis),
        responseMimeType: "application/json",
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const cleanText = response.text.trim();
    if (onChunk) onChunk(cleanText);
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    throw error;
  }
};
