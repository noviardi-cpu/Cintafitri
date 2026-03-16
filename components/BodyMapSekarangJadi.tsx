import React, { useMemo } from 'react';

interface Props {
  points?: any[];
}

// Simple 2D coordinates for standard TCM points (percentages on a 200x400 viewBox)
// Left side of view is "Front", Right side is "Back" or separate columns?
// Let's do a simple Front/Back silhouette side-by-side.
// ViewBox 0 0 300 400.
// Front body center x=75. Back body center x=225.

const POINT_COORDS: Record<string, { x: number, y: number, view: 'front' | 'back' }> = {
    // Head/Face
    'GV20': { x: 75, y: 15, view: 'front' }, // Also visible back
    'Yintang': { x: 75, y: 35, view: 'front' },
    'GV24': { x: 75, y: 20, view: 'front' },
    'DU24': { x: 75, y: 20, view: 'front' },
    'ST2': { x: 88, y: 45, view: 'front' }, // Below eye
    'GB20': { x: 210, y: 40, view: 'back' }, // Back of neck

    // Chest/Abdomen (Front)
    'REN17': { x: 75, y: 110, view: 'front' },
    'CV17': { x: 75, y: 110, view: 'front' },
    'REN15': { x: 75, y: 130, view: 'front' },
    'REN14': { x: 75, y: 138, view: 'front' },
    'REN12': { x: 75, y: 150, view: 'front' },
    'CV12': { x: 75, y: 150, view: 'front' },
    'REN6': { x: 75, y: 175, view: 'front' },
    'CV6': { x: 75, y: 175, view: 'front' },
    'REN4': { x: 75, y: 185, view: 'front' },
    'CV4': { x: 75, y: 185, view: 'front' },
    'REN3': { x: 75, y: 195, view: 'front' },
    'ST25': { x: 95, y: 175, view: 'front' }, 
    'ST28': { x: 90, y: 195, view: 'front' },
    'SP15': { x: 105, y: 175, view: 'front' },
    'LR13': { x: 110, y: 160, view: 'front' },
    'LR14': { x: 95, y: 140, view: 'front' },

    // Back (Back)
    'DU14': { x: 225, y: 65, view: 'back' },
    'GV14': { x: 225, y: 65, view: 'back' },
    'BL12': { x: 205, y: 75, view: 'back' },
    'BL13': { x: 205, y: 90, view: 'back' }, // Lung
    'BL15': { x: 205, y: 105, view: 'back' }, // Heart
    'BL17': { x: 205, y: 120, view: 'back' }, // Diaphragm
    'BL18': { x: 205, y: 130, view: 'back' }, // Liver
    'BL20': { x: 205, y: 150, view: 'back' }, // Spleen
    'BL21': { x: 205, y: 160, view: 'back' }, // Stomach
    'BL23': { x: 205, y: 170, view: 'back' }, // Kidney
    'BL25': { x: 205, y: 185, view: 'back' }, // LI
    'BL28': { x: 205, y: 205, view: 'back' }, // Bladder
    'DU4': { x: 225, y: 170, view: 'back' },
    'GV4': { x: 225, y: 170, view: 'back' },

    // Arms (Front)
    'LU1': { x: 45, y: 90, view: 'front' },
    'LU5': { x: 25, y: 115, view: 'front' },
    'LU7': { x: 20, y: 130, view: 'front' },
    'LU9': { x: 18, y: 140, view: 'front' },
    'PC6': { x: 25, y: 140, view: 'front' },
    'HT7': { x: 28, y: 145, view: 'front' },
    'HT9': { x: 28, y: 168, view: 'front' }, // Tip
    'LI4': { x: 15, y: 160, view: 'front' },
    'LI11': { x: 35, y: 110, view: 'front' },
    'TE5': { x: 35, y: 135, view: 'back' }, // Back of arm roughly
    
    // Legs (Front)
    'ST36': { x: 60, y: 260, view: 'front' },
    'ST37': { x: 60, y: 275, view: 'front' },
    'ST40': { x: 55, y: 290, view: 'front' },
    'ST44': { x: 60, y: 370, view: 'front' },
    'SP9': { x: 85, y: 250, view: 'front' }, 
    'SP6': { x: 85, y: 340, view: 'front' },
    'SP3': { x: 82, y: 365, view: 'front' },
    'LR2': { x: 70, y: 375, view: 'front' },
    'LR3': { x: 65, y: 375, view: 'front' },
    'KI3': { x: 90, y: 360, view: 'front' }, // Medial ankle
    'KI6': { x: 90, y: 365, view: 'front' }, 
    'KI7': { x: 90, y: 350, view: 'front' },
    'GB34': { x: 50, y: 260, view: 'front' }, 

    // Legs (Back)
    'BL40': { x: 210, y: 260, view: 'back' },
    'BL57': { x: 210, y: 310, view: 'back' },
    'BL60': { x: 240, y: 360, view: 'back' } // External ankle
};

const BodyMapSekarangJadi: React.FC<Props> = ({ points = [] }) => {
  
  // Extract point codes (remove suffixes if any)
  const activePoints = useMemo(() => {
      return points.map(p => {
          let rawCode = p.code.split(' ')[0].split('+')[0].trim(); 
          // Normalize to match keys if needed
          rawCode = rawCode.replace('HE', 'HT').replace('LIV', 'LR').replace('Ren', 'CV').replace('Du', 'GV');
          
          let mapped = POINT_COORDS[rawCode];
          
          // Try standardizing CV/REN GV/DU if not found
          if (!mapped) {
             if (rawCode.startsWith('CV')) mapped = POINT_COORDS[rawCode.replace('CV', 'REN')];
             else if (rawCode.startsWith('REN')) mapped = POINT_COORDS[rawCode.replace('REN', 'CV')];
             else if (rawCode.startsWith('GV')) mapped = POINT_COORDS[rawCode.replace('GV', 'DU')];
             else if (rawCode.startsWith('DU')) mapped = POINT_COORDS[rawCode.replace('DU', 'GV')];
          }

          if (!mapped) return null;
          return { ...mapped, code: rawCode };
      }).filter(Boolean) as { x: number, y: number, view: 'front'|'back', code: string }[];
  }, [points]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-purple-50 rounded-lg relative">
        <svg viewBox="0 0 300 400" className="w-full h-full max-h-[500px]" preserveAspectRatio="xMidYMid meet">
            {/* DEFS */}
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            {/* --- FRONT BODY --- */}
            <g transform="translate(0, 0)">
                <text x="75" y="20" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold">ANTERIOR</text>
                {/* Silhouette - Abstract */}
                <path d="M75,30 C90,30 95,45 95,55 L115,60 L125,180 L130,190 L110,380 L95,390 L85,300 L75,280 L65,300 L55,390 L40,380 L20,190 L25,180 L35,60 L55,55 C55,45 60,30 75,30 Z" 
                      fill="#f3e8ff" stroke="#d8b4fe" strokeWidth="2" />
                {/* Head */}
                <circle cx="75" cy="40" r="12" fill="#f3e8ff" stroke="#d8b4fe" strokeWidth="2" />
            </g>

            {/* --- BACK BODY --- */}
            <g transform="translate(150, 0)">
                <text x="75" y="20" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold">POSTERIOR</text>
                {/* Silhouette - Abstract */}
                <path d="M75,30 C90,30 95,45 95,55 L115,60 L125,180 L130,190 L110,380 L95,390 L85,300 L75,280 L65,300 L55,390 L40,380 L20,190 L25,180 L35,60 L55,55 C55,45 60,30 75,30 Z" 
                      fill="#f3e8ff" stroke="#d8b4fe" strokeWidth="2" />
                {/* Head */}
                <circle cx="75" cy="40" r="12" fill="#f3e8ff" stroke="#d8b4fe" strokeWidth="2" />
                {/* Spine Line */}
                <line x1="75" y1="55" x2="75" y2="200" stroke="#d8b4fe" strokeWidth="1" strokeDasharray="4 2" />
            </g>

            {/* --- POINTS RENDER --- */}
            {activePoints.map((pt, i) => {
                return (
                    <g key={i} className="cursor-pointer group">
                        <circle 
                            cx={pt.x} cy={pt.y} 
                            r="4" 
                            fill="#7e22ce" 
                            className="animate-pulse"
                            filter="url(#glow)"
                        />
                        <circle cx={pt.x} cy={pt.y} r="1.5" fill="white" />
                        
                        <text 
                            x={pt.x} y={pt.y - 8} 
                            textAnchor="middle" 
                            fill="#3b0764" 
                            fontSize="8" 
                            fontWeight="bold"
                            className="drop-shadow-sm"
                        >
                            {pt.code}
                        </text>
                    </g>
                );
            })}

            {activePoints.length === 0 && (
                 <text x="150" y="200" textAnchor="middle" fill="#d8b4fe" fontSize="12">
                     No mapped points active
                 </text>
            )}
        </svg>
    </div>
  );
};

export default BodyMapSekarangJadi;