import { createContext, useContext, useState } from "react";

const translations = {
  en: {
    settings: "Settings",
    settings_desc: "Manage how Smart Inventory looks and behaves for you.",
    appearance: "Appearance",
    appearance_desc: "Choose how the app looks on your device.",
    light: "Light",
    dark: "Dark",
    date_time: "Date & time",
    date_time_desc: "Choose your preferred formats.",
    time_format: "Time format",
    date_format: "Date format",
    language: "Language",
    language_desc: "Choose your preferred display language.",
    admin_contact: "Admin contact",
    admin_contact_desc: "Shown to users who need access on the login page.",
    admin_only: "Admin only",
    email: "Email",
    telegram: "Telegram",
    phone: "Phone",
    save: "Save changes",
    saved: "Saved",
    saving: "Saving…",
  },
  kh: {
    settings: "ការកំណត់",
    settings_desc: "គ្រប់គ្រងរូបរាង និងឥរិយាបថនៃ Smart Inventory សម្រាប់អ្នក។",
    appearance: "រូបរាង",
    appearance_desc: "ជ្រើសរើសរបៀបបង្ហាញកម្មវិធីនៅលើឧបករណ៍របស់អ្នក។",
    light: "ស្រាល",
    dark: "ងងឹត",
    date_time: "ថ្ងៃ និងម៉ោង",
    date_time_desc: "ជ្រើសរើសទម្រង់ដែលអ្នកចង់បាន។",
    time_format: "ទម្រង់ម៉ោង",
    date_format: "ទម្រង់កាលបរិច្ឆេទ",
    language: "ភាសា",
    language_desc: "ជ្រើសរើសភាសាបង្ហាញដែលអ្នកចង់បាន។",
    admin_contact: "ទំនាក់ទំនងអ្នកគ្រប់គ្រង",
    admin_contact_desc: "បង្ហាញដល់អ្នកប្រើដែលត្រូវការសិទ្ធិចូលប្រើនៅទំព័រចូល។",
    admin_only: "សម្រាប់អ្នកគ្រប់គ្រងតែប៉ុណ្ណោះ",
    email: "អ៊ីមែល",
    telegram: "តេឡេក្រាម",
    phone: "លេខទូរស័ព្ទ",
    save: "រក្សាទុកការផ្លាស់ប្តូរ",
    saved: "បានរក្សាទុក",
    saving: "កំពុងរក្សាទុក…",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
