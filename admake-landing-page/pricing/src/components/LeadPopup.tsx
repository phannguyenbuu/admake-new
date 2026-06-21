import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileDown, X, Check, Phone, Mail, Printer, Sparkles } from 'lucide-react';
import { Language, PricingPlan, TRANSLATIONS, FEATURES } from '../types';

interface LeadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  selectedPlan: PricingPlan;
  billingCycle: '6' | '12' | 'yearly';
  customStorage: number;
  usersCount: number;
  totalPrice: number;
}

export const LeadPopup: React.FC<LeadPopupProps> = ({
  isOpen,
  onClose,
  lang,
  selectedPlan,
  billingCycle,
  customStorage,
  usersCount,
  totalPrice
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  const t = TRANSLATIONS[lang];

  const validate = () => {
    const errs: { [key: string]: boolean } = {};
    if (!fullName.trim()) errs.fullName = true;
    if (!phone.trim()) errs.phone = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      setTimeout(() => {
        // Reset or close after success
      }, 5000);
    }
  };

  // Format currency helpers
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + (lang === 'vi' ? ' đ' : ' VND');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl relative w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-stone-800"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-amber-500" />
                <h3 className="font-sans font-bold text-lg text-stone-900 uppercase tracking-tight">
                  {t.quoteDetail}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-stone-200 transition-colors text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Container / Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 print:p-0 print:overflow-visible">
              
              {/* PRINT ONLY LOGO & TITLE HEADER */}
              <div className="hidden print:flex flex-col mb-6 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-extrabold text-stone-900 font-sans">
                      {lang === 'vi' ? 'BẢN BÁO GIÁ ĐĂNG TRỰC TUYẾN' : 'DIGITAL SYSTEM QUOTATION'}
                    </h1>
                    <p className="text-xs text-stone-500 font-mono mt-1">
                      {t.generatedOn}: {new Date().toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs text-stone-500">
                    <p>https://ai.studio/build</p>
                    <p>phannguyenbuu@gmail.com</p>
                  </div>
                </div>
              </div>

              {/* SPECIFICATION CARD GRID */}
              <div className="bg-stone-50 print:bg-white rounded-xl p-5 border border-stone-100 print:border-none print:p-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-1">
                    {lang === 'vi' ? 'Thông tin cấu hình' : 'Plan Specifications'}
                  </h4>
                  <p className="font-bold text-stone-950 text-lg flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    {selectedPlan.id === 'specialized' ? t.special3DTitle : `${selectedPlan.nameVI} - ${selectedPlan.nameEN}`}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {t.billingCycle}: <span className="font-semibold text-stone-800">
                      {billingCycle === '6' ? t.duration6 : billingCycle === '12' ? t.duration12 : t.durationYear}
                    </span>
                  </p>
                  <p className="text-xs text-stone-500">
                    {lang === 'vi' ? 'Dung lượng đi kèm' : 'Included Storage'}: <span className="font-semibold text-stone-800">
                      {selectedPlan.storageGB} GB
                    </span>
                  </p>
                </div>

                <div className="md:border-l md:pl-6 border-stone-200">
                  <h4 className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-1">
                    {lang === 'vi' ? 'Tham số bổ sung' : 'Additional Parameters'}
                  </h4>
                  <p className="text-sm font-medium">
                    {lang === 'vi' ? 'Dung lượng phụ trội' : 'Extra Storage'}: <span className="font-bold text-stone-900">+{customStorage} GB</span>
                  </p>
                  <p className="text-sm font-medium">
                    {lang === 'vi' ? 'Thành viên kích hoạt' : 'Active Members'}: <span className="font-bold text-stone-900">{usersCount} Users</span>
                  </p>
                  <p className="text-sm font-medium mt-1 pr-2 border-t border-stone-200/60 pt-1 flex justify-between items-center text-stone-950">
                    <span>{t.totalPrice}:</span>
                    <span className="font-black text-amber-600 text-lg">{formatMoney(totalPrice)}</span>
                  </p>
                </div>
              </div>

              {/* LIST OF CHOSEN PLAN FEATURES */}
              <div>
                <h4 className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {t.featuresTitle} ({selectedPlan.features.length} {lang === 'vi' ? 'Tính năng' : 'Features'})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {FEATURES.map((feat) => {
                    const isIncluded = selectedPlan.features.includes(feat.id);
                    return (
                      <div
                        key={feat.id}
                        className={`flex items-start gap-2 p-1.5 rounded transition-all ${
                          isIncluded 
                            ? 'text-stone-800 font-medium' 
                            : 'text-stone-300 line-through opacity-45'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          isIncluded 
                            ? feat.isCustomOnly ? 'text-red-500' : 'text-emerald-500' 
                            : 'text-stone-300'
                        }`} />
                        <span>{lang === 'vi' ? feat.nameVI : feat.nameEN}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-400 mt-4 leading-relaxed font-mono">
                  {t.vatNote}
                </p>
              </div>

              {/* CONTACT LEADS OR SUCCESS CARD */}
              <div className="border-t border-stone-100 pt-6 print:hidden">
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h4 className="font-bold text-sm text-stone-900 font-sans uppercase">
                      {t.customerInfo}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">
                          {t.fullName} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Nguyễn Văn A"
                          className={`w-full text-sm px-3.5 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${
                            errors.fullName 
                              ? 'border-rose-400 focus:ring-rose-200' 
                              : 'border-stone-200 focus:border-cyan-500 focus:ring-cyan-100'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">
                          {t.phone} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 0901234567"
                          className={`w-full text-sm px-3.5 py-2 rounded-lg border focus:ring-2 outline-none transition-all ${
                            errors.phone 
                              ? 'border-rose-400 focus:ring-rose-200' 
                              : 'border-stone-200 focus:border-cyan-500 focus:ring-cyan-100'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        {t.companyName}
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder={lang === 'vi' ? 'Công ty TNHH Xây Dựng 3D' : '3D Design Corp'}
                        className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                      />
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-all focus:ring-4 focus:ring-cyan-100 uppercase tracking-wider"
                      >
                        {t.submitQuote}
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        {lang === 'vi' ? 'In Báo Giá' : 'Print Quote'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-2"
                  >
                    <div className="mx-auto w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <p className="text-emerald-800 font-bold text-sm">
                      {t.successMsg}
                    </p>
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={handlePrint}
                        className="text-stone-600 hover:text-stone-900 hover:underline flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        {lang === 'vi' ? 'In lại bản báo giá này để lưu trữ' : 'Print copy of this quotation'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>

            {/* Modal Footer / Action Button print-hidden */}
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex justify-end gap-3 print:hidden">
              <button
                onClick={onClose}
                className="px-4 py-2 hover:bg-stone-200 text-stone-600 text-sm font-semibold rounded-lg transition-colors"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
