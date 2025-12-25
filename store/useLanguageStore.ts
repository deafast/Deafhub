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
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.t = translations[state.language || 'en'];
                }
            }
        }
    )
);
