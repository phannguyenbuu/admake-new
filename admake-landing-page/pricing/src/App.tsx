/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  Sparkles, 
  Calculator, 
  Languages, 
  FileText, 
  ArrowRight, 
  Users, 
  HardDrive, 
  BookOpen, 
  HelpCircle,
  Clock,
  PhoneCall,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { Language, PLANS, FEATURES, TRANSLATIONS, PricingPlan } from './types';
import { InteractiveSVG3DBadge } from './components/InteractiveSVG3DBadge';
import { LeadPopup } from './components/LeadPopup';

export default function App() {
  const [lang, setLang] = useState<Language>('vi');
  const [selectedPlanId, setSelectedPlanId] = useState<'basic' | 'professional' | 'specialized'>('professional');
  const [billingCycle, setBillingCycle] = useState<'6' | '12' | 'yearly'>('12');
  const [customStorage, setCustomStorage] = useState<number>(0); // Extra storage in GB
  const [usersCount, setUsersCount] = useState<number>(10); // Standard users count
  const [isLeadOpen, setIsLeadOpen] = useState<boolean>(false);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  const t = TRANSLATIONS[lang];

  // Helper translations for package cards
  const planTexts = {
    vi: {
      storage: 'Lưu trữ',
      sixMonths: '/6 tháng',
      twelveMonths: '/12 tháng',
      yearlyLabel: '/năm',
      selectPlan: 'Kích Hoạt Gói Này',
      bestValue: 'GỢI Ý TỐT NHẤT',
      specializedCaption: 'BỐC TÁCH & DIỄN HỌA 3D'
    },
    en: {
      storage: 'Storage',
      sixMonths: '/6 months',
      twelveMonths: '/12 months',
      yearlyLabel: '/year',
      selectPlan: 'Select This Plan',
      bestValue: 'BEST VALUE',
      specializedCaption: 'AUTOMATED 3D CAD TAKEOFF'
    }
  }[lang];

  // Selected pricing model
  const activePlan = useMemo(() => {
    return PLANS.find(p => p.id === selectedPlanId) || PLANS[1];
  }, [selectedPlanId]);

  // Adjust billing cycle safely when plan is changed
  const handleSelectPlan = (planId: 'basic' | 'professional' | 'specialized') => {
    setSelectedPlanId(planId);
    if (planId === 'specialized') {
      setBillingCycle('yearly');
    } else if (billingCycle === 'yearly') {
      setBillingCycle('12');
    }
  };

  // Dynamic price calculation
  const calculatedTotal = useMemo(() => {
    let base = 0;
    const durationMonths = billingCycle === '6' ? 6 : 12;

    if (activePlan.id === 'specialized') {
      base = activePlan.prices.customYearly || 2000000;
    } else {
      base = billingCycle === '6' ? activePlan.prices.monthly6 : activePlan.prices.monthly12;
    }

    // Storage: +20,000 VND / 10 GB / month
    const extraStorageChargeInChunks = Math.floor(customStorage / 10) * 20000;
    const storageCost = extraStorageChargeInChunks * durationMonths;

    // Users: First 10 integrated. Additional users cost 50,000 VND/user/month
    const extraUsers = Math.max(0, usersCount - 10);
    const usersCost = extraUsers * 50000 * durationMonths;

    return base + storageCost + usersCost;
  }, [activePlan, billingCycle, customStorage, usersCount]);

  // Saving calculations relative to buying two 6 Months cycles instead of 12 Months
  const savingsAmount = useMemo(() => {
    if (activePlan.id === 'specialized') return 500000; // Fixed comparison value or estimate
    const cost2For6 = (billingCycle === '12' ? activePlan.prices.monthly6 * 2 : activePlan.prices.monthly6);
    const activeBase = billingCycle === '12' ? activePlan.prices.monthly12 : activePlan.prices.monthly6;
    return Math.max(0, cost2For6 - activeBase);
  }, [activePlan, billingCycle]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'vi' ? 'en' : 'vi');
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' ' + t.currency;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-stone-900 font-sans selection:bg-cyan-100 selection:text-cyan-900 relative overflow-x-hidden pb-16">
      
      {/* Decorative Top Mesh Background */}
      <div className="absolute top-0 inset-x-0 h-[640px] bg-gradient-to-b from-[#e0f2fe]/55 via-[#f0f9ff]/20 to-transparent -z-20" />
      
      {/* Triangulated vector background grid simulation */}
      <div className="absolute top-0 right-0 left-0 bottom-0 pointer-events-none opacity-[0.03] -z-10 bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* STICKY TOPBAR */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-100/80 px-4 py-3 sm:py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-[#189bb4] flex items-center justify-center text-white shadow-md shadow-cyan-100">
              <span className="font-extrabold text-lg select-none font-sans tracking-tighter">3D</span>
            </div>
            <div>
              <span className="font-bold font-sans text-stone-900 tracking-tight block text-sm sm:text-base leading-tight">
                {lang === 'vi' ? 'QUẨN LÝ CÔNG TRÌNH 3D' : '3D CONTRUCTION SUITE'}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 font-mono block">
                {lang === 'vi' ? 'Hệ thống bốc tách & lập giá' : 'Estimating & takeoff engines'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Lang Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-stone-700 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-500" />
              <span>{lang === 'vi' ? 'ENGLISH' : 'TIẾNG VIỆT'}</span>
            </button>

            {/* Quick Consultation call */}
            <a 
              href="tel:0900000000"
              className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-lg bg-stone-900 text-white font-semibold text-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'vi' ? '090.XXX.XXXX' : '+84 90X XXX XXX'}</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-4 pt-10 pb-8 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-700 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3 border border-cyan-100">
            <Sparkles className="w-3 h-3 animate-spin text-cyan-600" />
            {lang === 'vi' ? 'Giải Pháp Chuẩn Digital Hóa' : 'Digital Transformation For Engineering'}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-sans text-stone-900 tracking-tight leading-none">
            {t.heroTitle}
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
            {t.heroSub}
          </p>
        </motion.div>
      </section>

      {/* CORE GRID - THREE COLUMN INTERACTION */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
        
        {/* TWO CARDS FOR CƠ BẢN & CHUYÊN NGHIỆP: COL 1-7 */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CARD 1: CƠ BẢN (BASIC) */}
          <motion.div
            whileHover={{ y: -4 }}
            className={`bg-white rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col min-h-[720px] ${
              selectedPlanId === 'basic' 
                ? 'border-cyan-500 shadow-xl ring-2 ring-cyan-100' 
                : 'border-slate-200/80 shadow-md hover:shadow-xl'
            }`}
          >
            {/* Upper Geometric pattern of Card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50/40 rounded-full blur-2xl pointer-events-none -z-10" />

            {/* Custom Ribbon styled exactly like the slant-cuts in image */}
            <div className="pt-6 px-6">
              <div 
                onClick={() => handleSelectPlan('basic')}
                className="cursor-pointer relative overflow-visible inline-block select-none"
              >
                {/* Left side cyan rectangle with slant cut */}
                <div className="bg-cyan-500 text-white font-black text-sm italic py-2 px-8 shadow-md transform skew-x-[-12deg] tracking-wider font-mono transition-transform hover:scale-105">
                  {PLANS[0].nameVI}
                </div>
                {/* Shadow/border cut element */}
                <div className="absolute -bottom-1 -left-1 w-full h-full border border-stone-800 -z-10 transform skew-x-[-12deg]" />
              </div>
            </div>

            {/* Pricing inside card */}
            <div className="p-6 pb-4 border-b border-slate-100 flex flex-col justify-start">
              <div className="space-y-2 mt-2">
                <div 
                  className={`flex items-center gap-1.5 p-1 rounded-lg cursor-pointer transition-all ${
                    billingCycle === '6' && selectedPlanId === 'basic' ? 'bg-cyan-50' : ''
                  }`}
                  onClick={() => {
                    handleSelectPlan('basic');
                    setBillingCycle('6');
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    billingCycle === '6' && selectedPlanId === 'basic' ? 'border-cyan-500 bg-cyan-500' : 'border-stone-300'
                  }`}>
                    {billingCycle === '6' && selectedPlanId === 'basic' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-xl font-black text-rose-500 tracking-tight font-sans">
                    2.000.000 <span className="text-stone-400 text-xs font-normal font-mono">{planTexts.sixMonths}</span>
                  </span>
                </div>

                <div 
                  className={`flex items-center gap-1.5 p-1 rounded-lg cursor-pointer transition-all ${
                    billingCycle === '12' && selectedPlanId === 'basic' ? 'bg-cyan-50' : ''
                  }`}
                  onClick={() => {
                    handleSelectPlan('basic');
                    setBillingCycle('12');
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    billingCycle === '12' && selectedPlanId === 'basic' ? 'border-cyan-500 bg-cyan-500' : 'border-stone-300'
                  }`}>
                    {billingCycle === '12' && selectedPlanId === 'basic' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-xl font-black text-rose-500 tracking-tight font-sans">
                    3.000.000 <span className="text-stone-400 text-xs font-normal font-mono">{planTexts.twelveMonths}</span>
                  </span>
                </div>
              </div>

              {/* Memory storage limits */}
              <div className="mt-4 bg-cyan-50/60 inline-flex self-start px-3 py-1 rounded-md text-xs font-mono font-bold text-cyan-700">
                {planTexts.storage} 10 GB
              </div>
            </div>

            {/* Checklist of features */}
            <div className="p-6 flex-1">
              <h4 className="text-xs font-bold text-stone-400 font-mono uppercase tracking-widest mb-3">
                {t.featuresTitle}
              </h4>
              <div className="space-y-2.5">
                {FEATURES.map((feat) => {
                  const isIncluded = PLANS[0].features.includes(feat.id);
                  return (
                    <div 
                      key={feat.id}
                      onMouseEnter={() => setHoveredFeatureId(feat.id)}
                      onMouseLeave={() => setHoveredFeatureId(null)}
                      className={`flex items-start gap-2.5 text-xs transition-colors rounded p-1 ${
                        isIncluded 
                          ? 'text-stone-800' 
                          : 'text-stone-300 line-through opacity-40'
                      } ${hoveredFeatureId === feat.id ? 'bg-slate-50' : ''}`}
                    >
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isIncluded ? 'text-emerald-500' : 'text-stone-300'}`} />
                      <span className="leading-tight">{lang === 'vi' ? feat.nameVI : feat.nameEN}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selection bottom buttons */}
            <div className="p-6 bg-slate-50/50 mt-auto border-t border-slate-100">
              <button
                onClick={() => handleSelectPlan('basic')}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedPlanId === 'basic'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-100'
                    : 'bg-white hover:bg-slate-100 text-stone-700 border border-slate-200'
                }`}
              >
                <span>{planTexts.selectPlan}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* CARD 2: CHUYÊN NGHIỆP (PREMIUM/PROFESSIONAL) */}
          <motion.div
            whileHover={{ y: -4 }}
            className={`bg-white rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col min-h-[720px] ${
              selectedPlanId === 'professional' 
                ? 'border-[#18bbcc] shadow-2xl ring-2 ring-emerald-50' 
                : 'border-slate-200/80 shadow-md hover:shadow-xl'
            }`}
          >
            {/* Ribbon "Best value / Gợi ý" flag sticker top right */}
            <div className="absolute top-0 right-0">
              <div className="bg-amber-500 text-stone-950 font-black text-[9px] px-4 py-1.5 rounded-bl-xl uppercase tracking-wider shadow">
                {planTexts.bestValue}
              </div>
            </div>

            {/* Upper Geometric pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#18bbcc]/10 rounded-full blur-2xl pointer-events-none -z-10" />

            {/* Custom Slant Cut Ribbon as shown in image */}
            <div className="pt-6 px-6">
              <div 
                onClick={() => handleSelectPlan('professional')}
                className="cursor-pointer relative overflow-visible inline-block select-none"
              >
                {/* Left side deep-teal ribbon */}
                <div className="bg-[#189bb4] text-white font-black text-sm italic py-2 px-8 shadow-md transform skew-x-[-12deg] tracking-wider font-mono transition-transform hover:scale-105">
                  {PLANS[1].nameVI}
                </div>
                <div className="absolute -bottom-1 -left-1 w-full h-full border border-stone-800 -z-10 transform skew-x-[-12deg]" />
              </div>
            </div>

            {/* Pricing inside card */}
            <div className="p-6 pb-4 border-b border-slate-100 flex flex-col justify-start">
              <div className="space-y-2 mt-2">
                <div 
                  className={`flex items-center gap-1.5 p-1 rounded-lg cursor-pointer transition-all ${
                    billingCycle === '6' && selectedPlanId === 'professional' ? 'bg-emerald-50' : ''
                  }`}
                  onClick={() => {
                    handleSelectPlan('professional');
                    setBillingCycle('6');
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    billingCycle === '6' && selectedPlanId === 'professional' ? 'border-[#189bb4] bg-[#189bb4]' : 'border-stone-300'
                  }`}>
                    {billingCycle === '6' && selectedPlanId === 'professional' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-xl font-black text-rose-500 tracking-tight font-sans">
                    2.500.000 <span className="text-stone-400 text-xs font-normal font-mono">{planTexts.sixMonths}</span>
                  </span>
                </div>

                <div 
                  className={`flex items-center gap-1.5 p-1 rounded-lg cursor-pointer transition-all ${
                    billingCycle === '12' && selectedPlanId === 'professional' ? 'bg-emerald-50' : ''
                  }`}
                  onClick={() => {
                    handleSelectPlan('professional');
                    setBillingCycle('12');
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    billingCycle === '12' && selectedPlanId === 'professional' ? 'border-[#189bb4] bg-[#189bb4]' : 'border-stone-300'
                  }`}>
                    {billingCycle === '12' && selectedPlanId === 'professional' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-xl font-black text-rose-500 tracking-tight font-sans">
                    4.000.000 <span className="text-stone-400 text-xs font-normal font-mono">{planTexts.twelveMonths}</span>
                  </span>
                </div>
              </div>

              {/* Memory limits */}
              <div className="mt-4 bg-[#189bb4]/10 inline-flex self-start px-3 py-1 rounded-md text-xs font-mono font-bold text-[#189bb4]">
                {planTexts.storage} 20 GB
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="p-6 flex-1">
              <h4 className="text-xs font-bold text-stone-400 font-mono uppercase tracking-widest mb-3">
                {t.featuresTitle}
              </h4>
              <div className="space-y-2.5">
                {FEATURES.map((feat) => {
                  const isIncluded = PLANS[1].features.includes(feat.id);
                  // Highlight specialized materials/quotation features in RED as requested by the user, matching the red items in the image
                  const isSpecialRed = feat.isCustomOnly;

                  return (
                    <div 
                      key={feat.id}
                      onMouseEnter={() => setHoveredFeatureId(feat.id)}
                      onMouseLeave={() => setHoveredFeatureId(null)}
                      className={`flex items-start gap-2.5 text-xs transition-colors rounded p-1 ${
                        isIncluded 
                          ? isSpecialRed ? 'text-red-600 font-extrabold' : 'text-stone-800' 
                          : 'text-stone-300 line-through opacity-40'
                      } ${hoveredFeatureId === feat.id ? 'bg-slate-50' : ''}`}
                    >
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isIncluded 
                          ? isSpecialRed ? 'text-red-500 animate-pulse' : 'text-emerald-500' 
                          : 'text-stone-300'
                      }`} />
                      <span className="leading-tight">{lang === 'vi' ? feat.nameVI : feat.nameEN}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selection bottom buttons */}
            <div className="p-6 bg-slate-50/50 mt-auto border-t border-slate-100">
              <button
                onClick={() => handleSelectPlan('professional')}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedPlanId === 'professional'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-100'
                    : 'bg-white hover:bg-slate-100 text-stone-700 border border-slate-200'
                }`}
              >
                <span>{planTexts.selectPlan}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
          
        </div>

        {/* RIGHT INTERACTIVE RETRO BADGE & VALUE ADD CALCULATOR: COL 8-12 */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* THE ORIGINAL GRAPHIC SEAL AS AN INTERACTIVE COMPONENT */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl pointer-events-none -z-10" />
            <h3 className="font-sans font-black text-center text-stone-900 border-b pb-2 mb-2 text-sm tracking-tight">
              {lang === 'vi' ? 'SƠ ĐỒ GÓI CHUYÊN BIỆT' : 'SPECIALIZED SYSTEM STICKER'}
            </h3>

            {/* Interactive SVG Render */}
            <InteractiveSVG3DBadge 
              lang={lang} 
              onActivateSpecialized={() => handleSelectPlan('specialized')}
              isActive={selectedPlanId === 'specialized'}
            />
          </div>

          {/* DYNAMIC CALCULATOR COMPONENT */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/80 relative overflow-hidden transition-all duration-300">
            {/* Abs Glow Indicator */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-100/30 rounded-full blur-2xl pointer-events-none" />

            {/* Clickable Header for collapsing */}
            <div 
              onClick={() => setIsCalculatorOpen(prev => !prev)}
              className="flex items-center justify-between cursor-pointer select-none group pb-3 border-b border-slate-100 mb-4"
              role="button"
              aria-expanded={isCalculatorOpen}
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xs sm:text-sm tracking-wider uppercase font-sans text-stone-800">
                  {t.calculator}
                </h3>
              </div>
              <div className="text-stone-400 group-hover:text-stone-700 transition-colors">
                {isCalculatorOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Collapsible content panel */}
            <motion.div
              initial={false}
              animate={{ height: isCalculatorOpen ? 'auto' : 0, opacity: isCalculatorOpen ? 1 : 0 }}
              style={{ overflow: 'hidden' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="space-y-4 pt-1">
                {/* ACTIVE VALUE METRICS DISPLAY */}
                <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">{t.selectedPackage}:</span>
                    <span className="font-extrabold uppercase font-sans text-cyan-600">
                      {activePlan.id === 'specialized' ? t.special3DTitle : activePlan.nameVI}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">{t.billingCycle}:</span>
                    <span className="font-bold text-amber-600">
                      {billingCycle === '6' ? t.duration6 : billingCycle === '12' ? t.duration12 : t.durationYear}
                    </span>
                  </div>

                  {/* SAVINGS HIGHLIGHT IF APPLICABLE */}
                  {savingsAmount > 0 && (
                    <div className="bg-amber-500/10 border border-amber-300/40 rounded-lg py-1 px-2.5 flex justify-between items-center text-[10px]">
                      <span className="text-amber-800 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {t.savings}:
                      </span>
                      <span className="font-mono text-amber-700 font-extrabold">-{formatPrice(savingsAmount)}</span>
                    </div>
                  )}
                </div>

                {/* ADJUSTABLE PARAMETERS: STORAGE METRICS SLIDER */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-stone-700 font-semibold">{t.customStorage}</span>
                      <span className="font-bold font-mono text-cyan-600 text-sm">+{customStorage} GB</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={customStorage}
                      onChange={(e) => setCustomStorage(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-stone-400 block mt-1 font-mono">
                      {t.customStorageSub}
                    </span>
                  </div>

                  {/* ADJUSTABLE PARAMETERS: ACTIVE USER COUNT LIMIT SLIDER */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-stone-700 font-semibold">{t.usersCount}</span>
                      <span className="font-bold font-mono text-cyan-600 text-sm">{usersCount} Users</span>
                    </div>
                    <input 
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={usersCount}
                      onChange={(e) => setUsersCount(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-stone-400 block mt-1 font-mono">
                      {t.usersCountSub}
                    </span>
                  </div>
                </div>

                {/* LIVE FINAL PRICE TALLY CARD */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-stone-500 font-semibold uppercase">{t.totalPrice}:</span>
                    <span className="text-2xl font-black text-amber-600 tracking-tight font-sans">
                      {formatPrice(calculatedTotal)}
                    </span>
                  </div>

                  {/* ACTIONS: FORM & PDF GENERATOR DISPATCH */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsLeadOpen(true)}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-md shadow-cyan-200/50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{t.downloadQuote}</span>
                    </button>

                    <p className="text-[9px] text-stone-400 font-mono text-center">
                      {t.vatNote}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

      </main>

      {/* DETAILED FAQ & COMPARE GUIDE IN EXPANDABLE CARDS */}
      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-10 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600">
          <div>
            <h5 className="font-bold text-stone-900 uppercase tracking-widest mb-2 flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              {lang === 'vi' ? 'Cách ước tính giá?' : 'How is pricing calculated?'}
            </h5>
            <p className="leading-relaxed">
              {lang === 'vi' 
                ? 'Hệ thống tự động sử dụng tùy chọn chu kỳ (6 tháng hoặc 12 tháng) nhân với các phần dung lượng mở rộng, đảm bảo phù hợp với thực tế lắp đặt và quy mô nhân sự của công trình.'
                : 'The system aggregates subscription terms (6 or 12 months) and factors in storage modules dynamically, adjusting perfectly to active subcontractors.'}
            </p>
          </div>

          <div>
            <h5 className="font-bold text-stone-900 uppercase tracking-widest mb-2 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-[#189bb4]" />
              {lang === 'vi' ? 'Gói chuyên dụng 3D là gì?' : 'What is the 3D specialized plan?'}
            </h5>
            <p className="leading-relaxed">
              {lang === 'vi'
                ? 'Là phiên bản nâng cấp chuyên dụng chỉ 2,000,000 VND / Năm tích hợp đầy đủ hệ thống bốc tách tiên tiến, giúp bộ phận kỹ thuật tối ưu hóa bản vẽ và thời toán hóa đơn tư tự động.'
                : 'A yearly package costing 2,000,000 VND designed specifically to streamline blueprint materials takeover and run instant client estimations.'}
            </p>
          </div>

          <div>
            <h5 className="font-bold text-stone-900 uppercase tracking-widest mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {lang === 'vi' ? 'Cam kết bảo mật dữ liệu' : 'Data Integrity & Privacy'}
            </h5>
            <p className="leading-relaxed">
              {lang === 'vi'
                ? 'Tất cả tài liệu dự án, hợp đồng, báo cáo chấm công GPS và tệp tin bản vẽ kiến trúc đều được mã hóa lưu trữ an toàn tuyệt đối trên trung tâm dữ liệu độc quyền.'
                : 'All takeoff tables, GPS payroll charts, and construction contracts are strictly isolated and encrypted utilizing standard cloud security pipelines.'}
            </p>
          </div>
        </div>

        <div className="text-center mt-12 text-[10px] text-stone-400 font-mono">
          © 2026 3D Construction Pricing Suite. {lang === 'vi' ? 'Đã đăng ký bản quyền.' : 'All rights reserved.'} phannguyenbuu@gmail.com
        </div>
      </footer>

      {/* LEAD SPECIFICATION POPUP & INVOICE PRINTER */}
      <LeadPopup 
        isOpen={isLeadOpen}
        onClose={() => setIsLeadOpen(false)}
        lang={lang}
        selectedPlan={activePlan}
        billingCycle={billingCycle}
        customStorage={customStorage}
        usersCount={usersCount}
        totalPrice={calculatedTotal}
      />
    </div>
  );
}
