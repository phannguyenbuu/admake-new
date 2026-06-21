import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';

interface BadgeProps {
  lang: Language;
  onActivateSpecialized: () => void;
  isActive: boolean;
}

export const InteractiveSVG3DBadge: React.FC<BadgeProps> = ({
  lang,
  onActivateSpecialized,
  isActive
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Dynamic pulse background glow when active */}
      <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 -z-10 ${
        isActive ? 'bg-amber-300/30 scale-110' : 'bg-transparent scale-90'
      }`} />

      <motion.div
        className="cursor-pointer relative select-none w-full max-w-[460px] aspect-square"
        whileHover={{ scale: 1.03, rotate: 0.5 }}
        whileTap={{ scale: 0.98 }}
        onClick={onActivateSpecialized}
        title={lang === 'vi' ? 'Click để chọn gói Chuyên Dụng 3D' : 'Click to select 3D Specialized Plan'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 600"
          className="w-full h-full drop-shadow-2xl filter"
        >
          {/* DEFINITIONS FOR GRADIENTS AND FILTERS */}
          <defs>
            {/* Glossy 3D Blue Gradients */}
            <linearGradient id="blue3DFront" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#25aae1" />
              <stop offset="50%" stopColor="#0071bc" />
              <stop offset="100%" stopColor="#1a539b" />
            </linearGradient>
            <linearGradient id="blue3DShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a437b" />
              <stop offset="100%" stopColor="#042240" />
            </linearGradient>
            <linearGradient id="blue3DHighlighted" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4bc4f7" />
              <stop offset="50%" stopColor="#00adde" />
              <stop offset="100%" stopColor="#005a9e" />
            </linearGradient>

            {/* Custom Golden Ribbon Outline and Plate Goggles */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbb03b" />
              <stop offset="50%" stopColor="#ffdd6b" />
              <stop offset="100%" stopColor="#f7931e" />
            </linearGradient>

            <linearGradient id="orangeRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff5a15" />
              <stop offset="100%" stopColor="#ee2c12" />
            </linearGradient>

            <linearGradient id="yellowRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff200" />
              <stop offset="100%" stopColor="#fbb03b" />
            </linearGradient>

            {/* Premium Shadows */}
            <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Custom Sky Blue and Green Gradients for Texts */}
            <linearGradient id="skyBlueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00c0f0" />
              <stop offset="100%" stopColor="#0071bc" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#40c550" />
              <stop offset="100%" stopColor="#009245" />
            </linearGradient>
          </defs>

          {/* BACKGROUND GOLD RING (BỘ VÒNG TRÒN VÀNG) */}
          <motion.circle
            cx="300"
            cy="270"
            r="165"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="10"
            initial={{ strokeDasharray: "1050", strokeDashoffset: "1050" }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <circle
            cx="300"
            cy="270"
            r="154"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="2"
            strokeDasharray="4 8"
            opacity="0.8"
          />

          {/* STRIPES / SHADOW AT THE BOTTOM (HIỆU ỨNG SỌC CHÂN ĐẾ) */}
          <g opacity="0.85">
            <line x1="220" y1="440" x2="380" y2="440" stroke="#f7931e" strokeWidth="6" strokeLinecap="round" />
            <line x1="235" y1="455" x2="365" y2="455" stroke="#fbb03b" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="470" x2="350" y2="470" stroke="#ffdd6b" strokeWidth="5" strokeLinecap="round" />
            <line x1="270" y1="483" x2="330" y2="483" stroke="#ffd915" strokeWidth="4" strokeLinecap="round" />
            <line x1="285" y1="494" x2="315" y2="494" stroke="#ffd915" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* INNER TEXT AT THE TOP: BỐC TÁCH VẬT TƯ BÁO GIÁ TỰ ĐỘNG WITH BRIGHT VISUAL GRADIENTS */}
          <g transform="translate(0, -5)" className="font-sans font-black">
            <text
              x="300"
              y="185"
              fill="url(#skyBlueGradient)"
              fontSize="22"
              textAnchor="middle"
              letterSpacing="2"
              fontWeight="900"
            >
              {lang === 'vi' ? 'BỐC TÁCH VẬT TƯ' : 'MATERIAL TAKEOFF'}
            </text>
            <text
              x="200"
              y="215"
              fill="url(#greenGradient)"
              fontSize="19"
              textAnchor="middle"
              letterSpacing="1.5"
              fontWeight="900"
            >
              {lang === 'vi' ? 'BÁO GIÁ TỰ ĐỘNG' : 'AUTO QUOTATIONS'}
            </text>
          </g>

          {/* DIAGONAL BANNER BACKPLATE & TEXT: "DIỄN HỌA" (XÉO LÊN) */}
          <g transform="rotate(-11 250 290)">
            {/* The background dashed/styled ribbon */}
            <rect
              x="110"
              y="275"
              width="235"
              height="58"
              rx="4"
              fill="#232b38"
              filter="drop-shadow(2px 5px 6px rgba(0,0,0,0.4))"
            />
            {/* Side decorative dashes */}
            <line x1="116" y1="281" x2="116" y2="327" stroke="#fff200" strokeWidth="4" strokeDasharray="3 3"/>
            <line x1="124" y1="281" x2="124" y2="327" stroke="#fff200" strokeWidth="4" strokeDasharray="3 3"/>
            <line x1="331" y1="281" x2="331" y2="327" stroke="#fff200" strokeWidth="4" strokeDasharray="3 3"/>

            {/* TEXT: "DIỄN HỌA" */}
            <text
              x="226"
              y="314"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="34"
              fontStyle="italic"
              letterSpacing="2"
              textAnchor="middle"
            >
              {lang === 'vi' ? 'DIỄN HỌA' : '3D RENDER'}
            </text>
          </g>

          {/* 3D CUBE LOGO BLOCK IN 3D ISOMETRIC LOOK WITH ROTATING/FLOATING EFFECT */}
          <g transform="translate(470, 240)">
            <g>
              {/* BACK SHADOW */}
              <ellipse cx="5" cy="100" rx="65" ry="18" fill="rgba(0,0,0,0.3)" filter="blur(8px)" />

              {/* ISOMETRIC CUBE BOX RENDER */}
              {/* Top Face */}
              <polygon points="-75,-25 5,-70 85,-25 5,20" fill="url(#blue3DHighlighted)" stroke="#4bc4f7" strokeWidth="1" />
              {/* Left Face */}
              <polygon points="-75,-25 5,20 5,110 -75,65" fill="#1c55aa" stroke="#25aae1" strokeWidth="1" />
              {/* Right Face */}
              <polygon points="5,20 85,-25 85,65 5,110" fill="#0c3575" stroke="#1c55aa" strokeWidth="1" />

              {/* EXTRUDED "3" DIGIT OVERLAY ON LEFT FACE (3D SHAPE) - SCALED 3X & SHIFTED AS REQUESTED */}
              <g transform="translate(-95, 110) scale(2.7)" className="font-sans font-black select-none">
                {/* 3D depth of number 3 */}
                <text x="0" y="0" fill="#042240" fontSize="72" transform="skewY(29.5) scale(1, 0.866)" fontWeight="900">3</text>
                <text x="-1.5" y="-1.5" fill="#0c438c" fontSize="72" transform="skewY(29.5) scale(1, 0.866)" fontWeight="900">3</text>
                <text x="-3" y="-3" fill="url(#blue3DHighlighted)" fontSize="72" transform="skewY(29.5) scale(1, 0.866)" fontWeight="900">3</text>
              </g>

              {/* EXTRUDED "D" DIGIT OVERLAY ON RIGHT FACE (3D SHAPE) - SCALED 3X & SHIFTED AS REQUESTED */}
              <g transform="translate(-35, 176) scale(2.7)" className="font-sans font-black select-none">
                {/* 3D depth of number D */}
                <text x="0" y="0" fill="#021428" fontSize="72" transform="skewY(-29.5) scale(1, 0.866)" fontWeight="900">D</text>
                <text x="1.5" y="-1.5" fill="#0c3c78" fontSize="72" transform="skewY(-29.5) scale(1, 0.866)" fontWeight="900">D</text>
                <text x="3" y="-3" fill="#ffffff" fontSize="72" transform="skewY(-29.5) scale(1, 0.866)" fontWeight="900">D</text>
              </g>
            </g>
          </g>

          {/* LOWER ORANGE SLANTED BANNER: "GÓI CHUYÊN DỤNG" */}
          <g transform="rotate(-15 250 390)">
            <rect
              x="120"
              y="370"
              width="260"
              height="60"
              rx="30"
              fill="url(#orangeRibbon)"
              stroke="#ffffff"
              strokeWidth="4"
              filter="drop-shadow(3px 6px 8px rgba(0,0,0,0.35))"
            />
            <text
              x="250"
              y="410"
              fill="#ffffff"
              fontSize="20"
              fontWeight="bold"
              letterSpacing="1"
              textAnchor="middle"
            >
              {lang === 'vi' ? 'GÓI CHUYÊN DỤNG' : 'SPECIALIZED PLAN'}
            </text>
          </g>

          {/* LOWER YELLOW MAIN BADGE: "2.000.000/NĂM" */}
          <g transform="rotate(-11 400 450)">
            <rect
              x="260"
              y="420"
              width="265"
              height="74"
              rx="20"
              fill="url(#yellowRibbon)"
              stroke="#ffffff"
              strokeWidth="4"
              filter="drop-shadow(4px 8px 10px rgba(0,0,0,0.4))"
            />
            {/* Internal decorative line */}
            <rect
              x="267"
              y="427"
              width="251"
              height="60"
              rx="15"
              fill="none"
              stroke="#e1af26"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x="392"
              y="467"
              fill="#182c3c"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight="900"
              fontSize="26"
              textAnchor="middle"
            >
              2.000.000 <tspan fill="#344d5c" fontSize="18" fontWeight="bold">/{lang === 'vi' ? 'NĂM' : 'YEAR'}</tspan>
            </text>
          </g>
        </svg>

        {/* Hot badge hover overlay */}
        <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider animate-bounce">
          {lang === 'vi' ? 'TIẾT KIỆM' : 'PROMO'}
        </div>
      </motion.div>
    </div>
  );
};
