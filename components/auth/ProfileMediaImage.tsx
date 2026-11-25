'use client';

import { useCallback } from 'react';
import { profileMediaUrl, type ProfileMediaKind } from '@/lib/profile-media';

export default function ProfileMediaImage({ kind, revision = 0, loaded, onLoaded, className }: {
    kind: ProfileMediaKind;
    revision?: number;
    loaded: boolean;
    onLoaded: (loaded: boolean) => void;
    className: string;
}) {
    const src = profileMediaUrl(kind);
    const sync = useCallback((image: HTMLImageElement | null) => {
        if (image?.complete) onLoaded(image.naturalWidth > 0);
    }, [onLoaded]);

    // Read the DOM node as well as its events. The image may load before hydration.
    // eslint-disable-next-line @next/next/no-img-element
    return <img key={revision} ref={sync} src={revision ? `${src}?v=${revision}` : src} alt=""
        hidden={!loaded} className={className} onLoad={event => sync(event.currentTarget)} onError={() => onLoaded(false)} />;
}
