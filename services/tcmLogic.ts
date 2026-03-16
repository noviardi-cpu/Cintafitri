
import { TCM_DB } from '../constants';
import { Syndrome, RxPoint, ScoredSyndrome, HerbalRule } from '../types';

/**
 * Normalizes strings by removing punctuation and extra whitespace.
 */
export const normalize = (s: string) => 
  (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

/**
 * Enhanced Fuzzy Match using token-based overlap and internal synonym mapping.
 * Considers a match if tokens from one string appear significantly in another.
 */
const fuzzyMatch = (input: string, reference: string, threshold = 0.6): boolean => {
  const normInput = normalize(input);
  const normRef = normalize(reference);
  
  // Exact or contains match
  if (normInput.includes(normRef) || normRef.includes(normInput)) return true;

  // Simple synonym mapping for common TCM terms
  const synonyms: Record<string, string[]> = {
    "pusing": ["dizziness", "vertigo", "puyeng", "keliyengan"],
    "nyeri": ["sakit", "pain", "achiness", "ngilu"],
    "lelah": ["letih", "lesu", "lemas", "tired", "fatigue", "exhaustion", "weakness"],
    "haus": ["thirst", "dry mouth", "kering"],
    "sulit tidur": ["insomnia", "sleeplessness", "susah tidur", "tidak bisa tidur"],
    "berdebar": ["palpitations", "palpitasi", "jantung berdebar", "debar"],
    "keringat malam": ["night sweating", "night sweats", "keringat saat tidur"],
    "kembung": ["bloating", "distension", "abdominal fullness", "begah"],
    "mual": ["nausea", "enek", "mau muntah"],
    "muntah": ["vomiting", "muntah-muntah"],
    "diare": ["diarrhea", "mencret", "feses lembek", "loose stools"],
    "sembelit": ["constipation", "susah bab", "bab keras"],
    "dingin": ["cold", "kedinginan", "aversion to cold", "takut dingin"],
    "panas": ["heat", "fever", "kepanasan", "demam"],
    "marah": ["irritability", "emosi", "mudah marah", "anger"],
    "cemas": ["anxiety", "gelisah", "khawatir"],
    "depresi": ["depression", "murung", "sedih"],
    "lupa": ["poor memory", "pelupa", "mudah lupa", "amnesia"],
    "napas pendek": ["shortness of breath", "sesak", "ngos-ngosan", "asthma"],
    "batuk": ["cough", "batuk-batuk"],
    "kencing": ["urine", "urination", "buang air kecil", "bak"],
    "haid": ["menses", "menstruation", "menstruasi", "datang bulan"],
    "keputihan": ["leukorrhea", "fluor albus", "pek tay"]
  };

  for (const [key, vals] of Object.entries(synonyms)) {
    if ((normInput.includes(key) || vals.some(v => normInput.includes(v))) && 
        (normRef.includes(key) || vals.some(v => normRef.includes(v)))) {
      return true;
    }
  }

  const inputTokens = normInput.split(/\s+/).filter(t => t.length > 2);
  const refTokens = normRef.split(/\s+/).filter(t => t.length > 2);
  
  if (inputTokens.length === 0 || refTokens.length === 0) return false;

  let matches = 0;
  inputTokens.forEach(it => {
    if (refTokens.some(rt => rt.includes(it) || it.includes(rt))) matches++;
  });

  return (matches / inputTokens.length) >= threshold || (matches / refTokens.length) >= threshold;
};

const extractSymptoms = (text: string): string[] => {
    return text.split(/[\n,.]+/).map(normalize).filter(s => s.length > 2);
};

/**
 * Refined Wu Xing Relationships based on Maciocia's Clinical Principles.
 * Captures Sheng (Generating), Ke (Controlling), Cheng (Overacting), and Wu (Insulting).
 * Differentiation based on Excess (Shi) vs Deficiency (Xu).
 */
const getBaseWuxingRelationships = (element: string, patternType: string) => {
  const relationships: any[] = [];
  const el = (element || "").toLowerCase();
  const pt = (patternType || "").toLowerCase();
  const isExcess = pt.includes('excess') || pt.includes('full') || pt.includes('stagnation') || pt.includes('invasion') || pt.includes('fire');
  const isDeficiency = pt.includes('deficiency') || pt.includes('empty') || pt.includes('xu');

  // WOOD (Liver/Gallbladder)
  if (el.includes('wood')) {
    if (isExcess) {
      relationships.push({
        type: 'Overacting', targetElement: 'Earth',
        description: 'Kayu berlebih (Hati Shi) menindas Tanah (Limpa/Lambung), mengakibatkan stagnasi makanan atau diare (Hati menyerang Limpa).'
      });
      relationships.push({
        type: 'Insulting', targetElement: 'Metal',
        description: 'Api Hati menghina Logam (Paru), memicu gejala batuk atau sesak akibat Qi Paru tidak dapat turun (Kayu menghina Logam).'
      });
    } else if (isDeficiency) {
      relationships.push({
        type: 'Generating', targetElement: 'Fire',
        description: 'Ibu (Kayu) gagal menghidupi Anak (Api); Defisiensi Darah Hati memicu Defisiensi Darah Jantung (Ibu Gagal menghidupi Anak).'
      });
      relationships.push({
        type: 'Insulting', targetElement: 'Water',
        description: 'Anak (Kayu) menguras Ibu (Air); Defisiensi Hati yang kronis akhirnya melemahkan Ginjal (Anak menguras Ibu).'
      });
    }
  } 
  
  // FIRE (Heart/Small Intestine)
  else if (el.includes('fire')) {
    if (isExcess) {
      relationships.push({
        type: 'Overacting', targetElement: 'Metal',
        description: 'Api berlebih (Api Jantung) melukai Logam (Paru); Panas Jantung yang ekstrem mengeringkan cairan Paru.'
      });
      relationships.push({
        type: 'Insulting', targetElement: 'Water',
        description: 'Api menghina Air; Panas Jantung yang berkobar melawan kontrol dingin Ginjal.'
      });
    } else if (isDeficiency) {
      relationships.push({
        type: 'Generating', targetElement: 'Earth',
        description: 'Api yang padam (Yang Jantung Def) gagal menghangatkan Tanah (Limpa); menyebabkan kegagalan transportasi makanan.'
      });
    }
  }

  // EARTH (Spleen/Stomach)
  else if (el.includes('earth')) {
    if (isExcess) {
        relationships.push({
          type: 'Overacting', targetElement: 'Water',
          description: 'Tanah berlebih (Lembap Limpa) membendung Air (Ginjal); menyebabkan edema atau retensi cairan.'
        });
        relationships.push({
          type: 'Insulting', targetElement: 'Wood',
          description: 'Lembap-Panas Limpa menghina Kayu (Hati); menghambat aliran bebas Qi Hati.'
        });
    } else if (isDeficiency) {
        relationships.push({
          type: 'Generating', targetElement: 'Metal',
          description: 'Ibu (Tanah) gagal menumbuhkan Anak (Logam); Defisiensi Limpa sering memicu Defisiensi Paru (Ibu gagal menumbuhkan Anak).'
        });
    }
  }

  // METAL (Lung/Large Intestine)
  else if (el.includes('metal')) {
    if (isExcess) {
      relationships.push({
        type: 'Overacting', targetElement: 'Wood',
        description: 'Logam berlebih (Paru Shi) menyerang Kayu (Hati); menyebabkan spasme atau kekakuan otot.'
      });
    } else if (isDeficiency) {
      relationships.push({
        type: 'Generating', targetElement: 'Water',
        description: 'Logam gagal menghasilkan Air; Qi Paru tidak turun untuk membantu Ginjal menerima Qi (Ibu gagal menghidupi Anak).'
      });
    }
  }

  // WATER (Kidney/Bladder)
  else if (el.includes('water')) {
    if (isExcess) {
      relationships.push({
        type: 'Overacting', targetElement: 'Fire',
        description: 'Air berlebih (Dingin Ginjal) memadamkan Api (Jantung); mengancam vitalitas Yang Jantung.'
      });
    } else if (isDeficiency) {
      relationships.push({
        type: 'Generating', targetElement: 'Wood',
        description: 'Air (Ibu) gagal menghidupi Kayu (Anak); Defisiensi Yin Ginjal gagal menutrisi Yin Hati, memicu Yang Hati naik.'
      });
      relationships.push({
        type: 'Insulting', targetElement: 'Earth',
        description: 'Air yang lemah dihina oleh Tanah; Defisiensi Ginjal menyebabkan Tanah (Limpa) tidak terkendali.'
      });
    }
  }

  return relationships;
};

export const getHerbalRecommendation = (syndrome: Syndrome) => {
  const guidelines = TCM_DB.herbal_guidelines;
  const override = guidelines.per_syndrome_overrides_for_current_DB_snippet[syndrome.id];
  
  if (override) {
    return { 
      formula_name: override.notes, 
      chief: override.suggest_chief || [],
      assistants: override.suggest_assistants || [],
      avoid: override.contraindications || ["Hindari makanan dingin", "Monitor tekanan darah"]
    };
  }

  const patternRule = guidelines.herbal_rules_by_pattern_type[syndrome.pattern_type];
  if (patternRule) {
    return { 
      formula_name: patternRule.notes || "Protokol Standar", 
      chief: patternRule.suggest_chief || [],
      assistants: patternRule.suggest_assistants || [],
      avoid: patternRule.contraindications || ["Ikuti dosis standar"]
    };
  }
  
  return undefined;
};

/**
 * Performs clinical analysis using weighted scoring and fuzzy matching.
 * Weights: Key Symptoms (50), Manifestations (15), Tongue (20), Pulse (20).
 */
export const analyzePatient = (data: any): ScoredSyndrome[] => {
    const allSyndromes = [...TCM_DB.syndromes.FILLED_FROM_PDF];
    const symptomsList = extractSymptoms(data.symptoms || "");
    const selectedSymptoms = (data.selectedSymptoms || []).map(normalize);
    const allInputSymptoms = [...symptomsList, ...selectedSymptoms];

    const tongueInfo = normalize(data.tongue?.body_color + " " + (data.tongue?.coating_color || "") + " " + (data.tongue?.special_features?.join(" ") || ""));
    const pulseInfo = (data.pulse?.qualities || []).map(normalize);
    
    return allSyndromes.map(syn => {
        let score = 0;
        let matchedTraits: string[] = [];

        // 1. Match Key Symptoms (Highest Weight: 50)
        (syn.key_symptoms || []).forEach(ks => {
            if (allInputSymptoms.some(input => fuzzyMatch(input, ks))) {
              score += 50;
              matchedTraits.push(`Kunci: ${ks}`);
            }
        });

        // 2. Match Clinical Manifestations (Weight: 15)
        (syn.clinical_manifestations || []).forEach(cm => {
            if (allInputSymptoms.some(input => fuzzyMatch(input, cm))) {
              score += 15;
              matchedTraits.push(`Gejala: ${cm}`);
            }
        });

        // 3. Match Tongue (Weight: 20)
        (syn.tongue || []).forEach(st => {
            if (fuzzyMatch(tongueInfo, st)) {
                score += 20;
                matchedTraits.push(`Lidah: ${st}`);
            }
        });

        // 4. Match Pulse (Weight: 20)
        (syn.pulse || []).forEach(sp => {
            if (pulseInfo.some(pi => fuzzyMatch(pi, sp))) {
                score += 20;
                matchedTraits.push(`Nadi: ${sp}`);
            }
        });

        return {
            syndrome: syn,
            score: score,
            matchDetails: matchedTraits
        };
    })
    .filter(s => s.score > 15) // Ignore very low matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => ({
        ...s,
        points: Array.isArray(s.syndrome.acupuncture_points) ? s.syndrome.acupuncture_points.map((p:string) => ({code:p, role:'kausal', source:'db'})) : [],
        warnings: s.syndrome.wuxing_element === 'Wood' && s.syndrome.pattern_type.includes('excess') ? ["Waspada: Naiknya Api Hati", "Risiko Hipertensi Kronis"] : [],
        rationale: [
          `Analisis berbasis Maciocia: Menunjukkan kecocokan kuat pada ${s.matchDetails.filter(d => d.startsWith('Kunci')).length} gejala kunci.`,
          ...s.matchDetails.slice(0, 4)
        ],
        herbal_recommendation: getHerbalRecommendation(s.syndrome),
        wuxingRelationships: getBaseWuxingRelationships(s.syndrome.wuxing_element, s.syndrome.pattern_type)
    }));
};
