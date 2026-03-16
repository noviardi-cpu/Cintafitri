
// Fix: Update model to gemini-3-flash-preview for better image analysis and compliance with latest guidelines.

import { GoogleGenAI } from "@google/genai";

export async function analyzeTongueImage(base64Image: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Extract mimeType and base64 data
  const [mimeTypePrefix, base64Data] = base64Image.split(';base64,');
  const mimeType = mimeTypePrefix ? mimeTypePrefix.split(':')[1] : "image/jpeg";

  const prompt = `
  Kamu adalah ahli diagnosis lidah TCM (Traditional Chinese Medicine) tingkat profesor.
  Analisis foto lidah ini dengan sangat detail dan akurat.
  Jawab dalam Bahasa Indonesia, format:

  1. Warna badan lidah: ...
  2. Warna lapisan/sabur: ...
  3. Kualitas sabur: ...
  4. Fitur khusus: (crack, teeth marks, red points, deviated, swollen, thin, dll)
  5. Kesimpulan pola utama: (contoh: Kidney Yin Deficiency with Empty Heat, Spleen Qi Deficiency with Dampness, Liver Fire, dll)
  6. Rekomendasi titik akupuntur tambahan (3-5 titik): ...

  Hanya jawab berdasarkan foto lidah ini, jangan tambah-tambah.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }
    });

    return response.text || "Maaf, tidak dapat menganalisis gambar ini.";
  } catch (error) {
    console.error("Tongue Analysis Error:", error);
    throw new Error("Gagal melakukan analisis lidah.");
  }
}
