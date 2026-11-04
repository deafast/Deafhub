import LocalizedText from '@/components/shared/LocalizedText';

export default function Loading() {
    return <div role="status" className="route-loading">
        <span className="route-loading-track" aria-hidden="true" />
        <LocalizedText ru="Загрузка раздела…" en="Loading section…" />
    </div>;
}
