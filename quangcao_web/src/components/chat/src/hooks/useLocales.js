import { useState, useEffect } from 'react';
import useSettings from './useSettings';
// config
import { allLangs, defaultLang } from '../config';

export default function useLocales() {
  const { onChangeDirectionByLang } = useSettings();

  const [currentLang, setCurrentLang] = useState(defaultLang);

  const onChangeLang = (newlang) => {
    const lang = allLangs.find((_lang) => _lang.value === newlang) || defaultLang;
    setCurrentLang(lang);
    onChangeDirectionByLang(lang.value);
  };

  // Hàm dịch đơn giản, trả về nguyên bản
  const translate = (text, options) => text;

  useEffect(() => {
    onChangeDirectionByLang(currentLang.value);
  }, [currentLang, onChangeDirectionByLang]);

  return {
    onChangeLang,
    translate,
    currentLang,
    allLangs,
  };
}
