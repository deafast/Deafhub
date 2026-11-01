import type {MouseEvent} from 'react';
/** Open a provider viewer without replacing the current profile. */
export function openProviderWindow(event:MouseEvent<HTMLAnchorElement>){
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const width=Math.min(1040,Math.max(320,window.screen.availWidth-64));
 const height=Math.min(780,Math.max(400,window.screen.availHeight-64));
 const left=Math.max(0,Math.round(window.screenX+(window.outerWidth-width)/2));
 const top=Math.max(0,Math.round(window.screenY+(window.outerHeight-height)/2));
 const viewer=window.open('about:blank','_blank',`popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
 if(!viewer)return; // The normal target=_blank link remains available when blocked.
 viewer.opener=null;
 viewer.location.replace(event.currentTarget.href);
 event.preventDefault();
}
