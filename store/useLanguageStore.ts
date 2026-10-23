import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language, translations } from "@/lib/i18n";

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations.en;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: "en",
            setLanguage: (lang) => set({ language: lang, t: translations[lang] }),
            t: translations.en,
        }),
        {
            name: "language-storage",
            partialize: (state) => ({ language: state.language }),
            merge: (persisted, current) => {
                const saved = (persisted ?? {}) as { language?: unknown };
                const language: Language = saved.language === 'ru' ? 'ru' : 'en';
                return { ...current, language, t: translations[language] };
            },
        }
    )
);
