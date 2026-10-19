'use client';

import { useLanguageStore } from '@/store/useLanguageStore';

export default function LocalizedText({ ru, en }: { ru: string; en: string }) {
    const language = useLanguageStore(state => state.language);
    return language === 'ru' ? ru : en;
}
