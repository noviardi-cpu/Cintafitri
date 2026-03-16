
import React, { useState, useRef } from 'react';
import { TcmDiagnosisResult } from '../types';
import { db } from '../services/db';
import { 
  BrainCircuit, FileText, FileDown, ShieldCheck, MapPin, 
  Heart, Leaf, Save, Check, Loader2, Anchor, Zap, Activity, Sparkles, Scale
} from 'lucide-react';
import DoctorNoteModal from './DoctorNoteModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  diagnosis?: TcmDiagnosisResult | null;
  isPregnant: boolean;
  onShowVisualizer: (element?: string) => void;
  patientContext?: any;
}

const DiagnosisCard: React.FC<Props> = ({ diagnosis, isPregnant, onShowVisualizer, patientContext }) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!diagnosis) return null;

  const handleSave = () => {
    try {
      db.patients.add({
        id: Date.now().toString(),
        patientName: patientContext?.patientName || "Pasien Anonim",
        age: patientContext?.age || "-",
        sex: patientContext?.sex || "-",
        phone: patientContext?.phone || "",
        email: patientContext?.email || "",
        address: patientContext?.address || "",
        complaint: patientContext?.complaint || "Konsultasi Chat",
        symptoms: patientContext?.symptoms || "",
        selectedSymptoms: patientContext?.selectedSymptoms || [],
        tongue: patientContext?.tongue || { body_color: 'Normal', coating_color: 'Normal' },
        pulse: patientContext?.pulse || { qualities: [] },
        diagnosis: diagnosis,
        timestamp: Date.now(),
        medicalHistory: patientContext?.medicalHistory || "",
        biomedicalDiagnosis: patientContext?.biomedicalDiagnosis || "",
        icd10: patientContext?.icd10 || "",
        notes: patientContext?.notes || ""
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Gagal menyimpan ke arsip:", err);
      alert("Gagal menyimpan data ke database lokal.");
    }
  };

  const handleExportPDF = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#020617',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TCM_Resep_${diagnosis.patternId.replace(/\s+/g, '_')}.pdf`);
    } catch (e) { 
      alert("Ekspor Gagal. Pastikan browser mendukung Canvas."); 
    } finally { 
      setIsExporting(false); 
    }
  };

  const ScoreBadge = ({ score }: { score?: number }) => {
    if (score === undefined) return null;
    const colorClass = score >= 80 
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
      : score >= 50 
        ? 'bg-amber-100 text-amber-700 border-amber-200' 
        : 'bg-purple-100 text-purple-500 border-purple-200';
    
    return (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border whitespace-nowrap uppercase tracking-tighter ${colorClass}`}>
        {score}% Match
      </span>
    );
  };

  return (
    <div className="mt-6 space-y-4 animate-fade-in print:text-black">
      <DoctorNoteModal 
        isOpen={showNoteModal} 
        onClose={() => setShowNoteModal(false)} 
        diagnosis={diagnosis}
        initialPatientData={{ name: patientContext?.patientName, age: patientContext?.age }}
      />

      <div ref={cardRef} className="bg-white border border-purple-100 rounded-3xl p-6 shadow-2xl relative overflow-hidden print:bg-white print:border-slate-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-center shadow-inner">
                 <BrainCircuit className="text-tcm-primary w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-purple-950 uppercase tracking-tight print:text-black">{diagnosis.patternId}</h3>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Giovanni Maciocia Protocol</span>
                    <span className="w-1 h-1 rounded-full bg-purple-300"></span>
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">CDSS v3.2</span>
                 </div>
              </div>
           </div>
           <div className="flex gap-2 print:hidden">
              <button 
                onClick={handleSave} 
                title="Simpan ke Arsip Pasien"
                className={`p-3 rounded-xl border transition-all flex items-center gap-2 group ${
                  isSaved 
                  ? 'text-white border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-900/20' 
                  : 'text-purple-500 border-purple-200 hover:text-tcm-primary hover:border-tcm-primary bg-purple-50'
                }`}
              >
                {isSaved ? <><Check className="w-5 h-5" /><span className="text-[10px] font-black uppercase">Tersimpan!</span></> : <Save className="w-5 h-5 group-hover:scale-110" />}
              </button>
              <button onClick={() => setShowNoteModal(true)} className="px-5 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-fuchsia-900/20 transition-all active:scale-95">
                <FileText className="w-4 h-4" /> Rx Note
              </button>
              <button onClick={handleExportPDF} className="px-5 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-purple-200 transition-all">
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} PDF
              </button>
           </div>
        </div>

        {/* TREATMENT PRINCIPLE */}
        {(diagnosis.treatment_principle && diagnosis.treatment_principle.length > 0) && (
           <div className="mb-8 bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200 shrink-0">
                 <ShieldCheck className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Prinsip Terapi (Treatment Principle)</h4>
                 <div className="flex flex-wrap gap-2">
                    {diagnosis.treatment_principle.map((tp, idx) => (
                       <span key={idx} className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
                          {tp}
                       </span>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* TABEL BEN & BIAO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           {/* BEN (ROOT) TABLE */}
           <div className="bg-purple-50/50 rounded-2xl border border-purple-200 overflow-hidden shadow-sm">
              <div className="bg-purple-100 px-4 py-2 border-b border-purple-200 flex items-center gap-2">
                 <Anchor className="w-4 h-4 text-purple-600" />
                 <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">BEN (Root / Akar)</span>
              </div>
              <div className="p-0">
                 <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-purple-100">
                       {diagnosis.differentiation?.ben?.map((item, i) => (
                          <tr key={i} className="hover:bg-white transition-colors">
                             <td className="px-4 py-3 font-bold text-purple-500 uppercase tracking-tighter w-1/3 border-r border-purple-100 bg-purple-50/30">{item.label}</td>
                             <td className="px-4 py-3">
                                <div className="flex justify-between items-center gap-2">
                                   <span className="text-purple-900 italic">{item.value}</span>
                                   <ScoreBadge score={item.score} />
                                </div>
                             </td>
                          </tr>
                       )) || (
                         <tr><td className="px-4 py-3 text-purple-400 italic">Menganalisis akar masalah...</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* BIAO (BRANCH) TABLE */}
           <div className="bg-amber-50/50 rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
              <div className="bg-amber-100 px-4 py-2 border-b border-amber-200 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-amber-600" />
                 <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">BIAO (Branch / Cabang)</span>
              </div>
              <div className="p-0">
                 <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-amber-100">
                       {diagnosis.differentiation?.biao?.map((item, i) => (
                          <tr key={i} className="hover:bg-white transition-colors">
                             <td className="px-4 py-3 font-bold text-amber-600 uppercase tracking-tighter w-1/3 border-r border-amber-100 bg-amber-50/30">{item.label}</td>
                             <td className="px-4 py-3">
                                <div className="flex justify-between items-center gap-2">
                                   <span className="text-amber-900 italic">{item.value}</span>
                                   <ScoreBadge score={item.score} />
                                </div>
                             </td>
                          </tr>
                       )) || (
                         <tr><td className="px-4 py-3 text-amber-500 italic">Menganalisis manifestasi cabang...</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
           <div className="lg:col-span-12">
              <div className="flex items-center gap-3 mb-4">
                 <MapPin className="w-5 h-5 text-tcm-primary" />
                 <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">Resep Akupunktur ({diagnosis.recommendedPoints?.length} Titik)</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                 {diagnosis.recommendedPoints?.map((pt, i) => (
                    <div key={i} className="bg-purple-50/50 border border-purple-200 p-4 rounded-2xl hover:border-tcm-primary/40 hover:bg-white transition-all group shadow-inner">
                       <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-tcm-primary text-sm tracking-tighter group-hover:scale-110 transition-transform">{pt.code}</span>
                          <Activity className="w-3 h-3 text-purple-300" />
                       </div>
                       <p className="text-[10px] text-purple-600 leading-tight font-medium group-hover:text-purple-900 transition-colors">{pt.description}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* MASTER TUNG POINTS */}
        {diagnosis.masterTungPoints && diagnosis.masterTungPoints.length > 0 && (
           <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                 <Sparkles className="w-5 h-5 text-amber-500" />
                 <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Titik Master Tung ({diagnosis.masterTungPoints.length} Titik)</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                 {diagnosis.masterTungPoints.map((pt, i) => (
                    <div key={i} className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl hover:border-amber-400 hover:bg-white transition-all group shadow-inner">
                       <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-amber-600 text-sm tracking-tighter group-hover:scale-110 transition-transform">{pt.code}</span>
                          <Activity className="w-3 h-3 text-amber-300" />
                       </div>
                       <p className="text-[10px] text-amber-700 leading-tight font-medium group-hover:text-amber-900 transition-colors">{pt.description}</p>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* OBESITY & BEAUTY ACUPUNCTURE */}
        {(diagnosis.obesity_indication || diagnosis.beauty_acupuncture) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {diagnosis.obesity_indication && (
              <div className="bg-teal-50/50 border border-teal-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center border border-teal-200 shrink-0">
                  <Scale className="text-teal-600 w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-1">Indikasi Obesitas</span>
                  <p className="text-[11px] text-teal-900 italic leading-snug">{diagnosis.obesity_indication}</p>
                </div>
              </div>
            )}
            {diagnosis.beauty_acupuncture && (
              <div className="bg-pink-50/50 border border-pink-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center border border-pink-200 shrink-0">
                  <Sparkles className="text-pink-600 w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-pink-600 uppercase tracking-widest block mb-1">Akupuntur Kecantikan</span>
                  <p className="text-[11px] text-pink-900 italic leading-snug">{diagnosis.beauty_acupuncture}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {(diagnosis.herbal_recommendation || diagnosis.classical_prescription) && (
              <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between group shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200">
                       <Leaf className="text-emerald-600 w-6 h-6" />
                    </div>
                    <div>
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">Strategi Herbal Jun-Chen</span>
                       <p className="text-lg font-black text-emerald-900 print:text-black leading-none uppercase tracking-tighter">
                          {diagnosis.classical_prescription || diagnosis.herbal_recommendation?.formula_name || 'Individual'}
                       </p>
                    </div>
                 </div>
                 {diagnosis.herbal_recommendation?.chief && (
                    <div className="flex gap-1.5 flex-wrap justify-end max-w-[40%]">
                       {diagnosis.herbal_recommendation.chief.map(h => (
                          <span key={h} className="text-[9px] px-2 py-1 bg-white border border-emerald-200 rounded-lg text-emerald-700 font-bold uppercase shadow-sm">{h}</span>
                       ))}
                    </div>
                 )}
              </div>
           )}
           <div className="bg-rose-50/50 border border-rose-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center border border-rose-200">
                 <Heart className="text-rose-600 w-6 h-6" />
              </div>
              <div>
                 <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-1">Edukasi Gaya Hidup</span>
                 <p className="text-[11px] text-rose-900 italic leading-snug">{diagnosis.lifestyleAdvice}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisCard;
