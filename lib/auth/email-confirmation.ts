export const CONFIRMATION_COOLDOWN_MS = 60_000;
export const CONFIRMATION_COOLDOWN_KEY = 'deafhub:confirmation-cooldown:v1';
export function readConfirmationCooldown(deadline=0) {
 let stored=0;
 try { stored=Number(sessionStorage.getItem(CONFIRMATION_COOLDOWN_KEY)); } catch {}
 return Math.max(0,Number.isFinite(deadline)?deadline:0,Number.isFinite(stored)?stored:0);
}
export function startConfirmationCooldown(now=Date.now()) {
 const deadline=now+CONFIRMATION_COOLDOWN_MS;
 try { sessionStorage.setItem(CONFIRMATION_COOLDOWN_KEY,String(deadline)); } catch {}
 return deadline;
}
export function confirmationCallback(origin:string) {
 return new URL('/auth/callback',origin).toString();
}
export function remainingConfirmationSeconds(deadline:number,now:number) {
 return Number.isFinite(deadline)?Math.max(0,Math.min(60,Math.ceil((deadline-now)/1000))):0;
}
export function emailProvider(email:string):{name:string;url:string}|null {
 const domain=email.trim().toLowerCase().split('@');if(domain.length!==2)return null;
 const host=domain[1];
 if(['gmail.com','googlemail.com'].includes(host))return {name:'Gmail',url:'https://mail.google.com/'};
 if(['mail.ru','inbox.ru','list.ru','bk.ru','internet.ru'].includes(host))return {name:'Mail.ru',url:'https://e.mail.ru/'};
 if(['outlook.com','hotmail.com','live.com','msn.com','outlook.fr','outlook.de','hotmail.co.uk'].includes(host))return {name:'Outlook',url:'https://outlook.live.com/mail/'};
 if(['yandex.ru','yandex.com','ya.ru','yandex.by','yandex.kz'].includes(host))return {name:'Яндекс Почта',url:'https://mail.yandex.ru/'};
 return null;
}
export function confirmationError(code:string,ru:boolean) {
 if(['over_email_send_rate_limit','over_request_rate_limit'].includes(code))return ru?'Слишком много запросов. Подождите и повторите позже.':'Too many requests. Please wait and try again later.';
 if(['email_address_not_authorized','email_address_invalid'].includes(code))return ru?'Отправка на этот адрес пока недоступна. Проверьте адрес или попробуйте позже.':'Delivery to this address is currently unavailable. Check the address or try again later.';
 return ru?'Не удалось отправить письмо. Повторите попытку позже.':'The email could not be sent. Please try again later.';
}
