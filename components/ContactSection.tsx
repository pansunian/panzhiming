import React, { useEffect, useState } from 'react';
import { TicketBase, DashedLine, Notch, BarcodeHorizontal } from './TicketUI';
import { Send, Check, Loader2, AlertCircle } from 'lucide-react';

interface ContactSectionProps {
    logoUrl?: string;
}

function postmarkDate(now: Date) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return [now.getFullYear(), month, day].join('.');
}

function ContactPostmark({ delivered }: { delivered: boolean }) {
  const [date, setDate] = useState(() => postmarkDate(new Date()));

  useEffect(() => {
    let midnightTimer: number;
    function refresh() {
      window.clearTimeout(midnightTimer);
      const now = new Date();
      setDate(postmarkDate(now));
      if (delivered) return;
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      midnightTimer = window.setTimeout(refresh, midnight.getTime() - now.getTime());
    }

    refresh();
    if (delivered) return;
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [delivered]);

  return (
    <svg viewBox="0 0 162 126" role="img" aria-label={`先见志明留言邮戳，西宁东收费站，${date}`}
      className="block w-[126px] shrink-0 -rotate-3 text-[#405e6b] sm:w-[140px]">
      <defs>
        <clipPath id="contact-stamp-scenery"><circle cx="98" cy="62" r="54" /></clipPath>
        <mask id="contact-stamp-wordmark" x="47" y="55" width="102" height="29" maskUnits="userSpaceOnUse">
          <image href="/logo-xianjian-white.webp" x="47" y="55" width="102" height="29" />
        </mask>
        <path id="contact-stamp-date" d="M 48 84 Q 98 125 148 84" />
        <path id="contact-stamp-wave" d="M 2 53 C 14 53 16 45 27 45 C 32 45 35 47 39 48" />
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".76">
        <use href="#contact-stamp-wave" />
        <use href="#contact-stamp-wave" transform="translate(0 7)" />
        <use href="#contact-stamp-wave" transform="translate(0 14)" />
      </g>
      <circle cx="98" cy="62" r="58" fill="none" stroke="currentColor" strokeWidth="2.8" />
      <g clipPath="url(#contact-stamp-scenery)" fill="currentColor">
        {/* Xining East: the cable stays, low canopy and open toll lanes from the first album photo. */}
        <path d="M 110 43 L 112 20 L 113 17 L 115 20 L 117 43 Z M 61 44 L 62 33 L 63.5 33 L 65 44 Z" />
        <path d="M 113 22 L 70 43 M 113 26 L 80 43 M 113 30 L 91 43
                 M 114 22 L 151 40 M 114 26 L 142 41 M 114 30 L 133 42
                 M 63 35 L 44 44 M 63 35 L 81 43"
          fill="none" stroke="currentColor" strokeWidth="1.1" />
        <path d="M 40 44 L 155 39 L 155 44 L 40 49 Z
                 M 51 47 H 54 V 54 H 51 Z M 68 46 H 71 V 53 H 68 Z
                 M 86 45 H 89 V 52 H 86 Z M 105 44 H 108 V 51 H 105 Z
                 M 126 43 H 129 V 50 H 126 Z M 146 42 H 149 V 49 H 146 Z" />
        <path fillRule="evenodd" d="M 73 48 H 80 V 53 H 73 Z M 74 49 V 50.5 H 78.5 V 49 Z
                                   M 111 46.5 H 119 V 51 H 111 Z M 112 47.5 V 49 H 117.5 V 47.5 Z" />
        <path d="M 42 54 L 153 49" fill="none" stroke="currentColor" strokeWidth="1.1" />
      </g>
      <path d="M 58 29 A 52 52 0 0 1 137 28 M 64 103 A 52 52 0 0 0 132 102"
        fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="47" y="55" width="102" height="29" fill="currentColor" mask="url(#contact-stamp-wordmark)" />
      <text textAnchor="middle" fill="currentColor" fontFamily="ui-monospace, monospace"
        fontSize="14" fontWeight="600" letterSpacing=".55">
        <textPath href="#contact-stamp-date" startOffset="50%">{date}</textPath>
      </text>
    </svg>
  );
}

export const ContactSection: React.FC<ContactSectionProps> = ({ logoUrl }) => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    
    const formData = new FormData(e.currentTarget);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };

    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            setStatus('success');
        } else {
            console.error('Contact Form Error:', result);
            setStatus('error');
            setErrorMessage(result.details || result.error || 'Failed to send message');
        }
    } catch (err: any) {
        console.error('Network Error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Network connection failed');
    }
  };

  return (
    <section id="contact" className="page-enter-soft mb-8 w-full">
       
       <div className="flex items-end gap-4 mb-4 px-2">
         <h2 className="font-serif text-[1.35rem] font-medium leading-tight text-ink">给我留言</h2>
         <span className="font-mono text-xs text-stone-500 mb-1">/ CONTACT</span>
      </div>

      <div>
        <div className="h-3 w-full jagged-top bg-paper"></div>
        
        <TicketBase className="rounded-none bg-paper">
            {/* Form Section */}
            <div className="p-8 pb-12 relative">
                <div className="mb-4 -mt-3 -mr-3 flex items-center justify-between gap-3">
                    <p className="font-serif text-sm text-stone-500 italic" style={{ textWrap: 'balance' }}>
                        如果想联系我请留下一张便签...
                    </p>
                    <ContactPostmark delivered={status === 'success'} />
                </div>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 rounded-full bg-brand-accent text-white flex items-center justify-center">
                            <Check size={24} />
                        </div>
                        <h3 className="font-serif text-xl font-medium">投递成功</h3>
                        <p className="font-mono text-xs text-stone-400">THANK YOU FOR YOUR MESSAGE</p>
                    </div>
                ) : (
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block">Name / 姓名</label>
                            <input 
                                name="name"
                                type="text" 
                                required
                                className="w-full bg-transparent border-b border-stone-200 focus:border-ink outline-none py-1 font-serif text-lg text-ink placeholder-stone-200 transition-colors"
                                placeholder="你的名字"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block">Email / 邮箱</label>
                            <input 
                                name="email"
                                type="email" 
                                required
                                className="w-full bg-transparent border-b border-stone-200 focus:border-ink outline-none py-1 font-serif text-lg text-ink placeholder-stone-200 transition-colors"
                                placeholder="yourname@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block">Message / 留言</label>
                            <textarea 
                                name="message"
                                required
                                rows={4}
                                className="w-full bg-stone-50/50 border border-stone-200 focus:border-ink outline-none p-4 font-serif text-base text-ink placeholder-stone-300 resize-none rounded-sm transition-colors mt-2"
                                placeholder="写下你的想法..."
                            />
                        </div>

                        {status === 'error' && (
                            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-sm flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold mb-1">发送失败</p>
                                    <p className="opacity-80 font-mono whitespace-pre-wrap leading-relaxed">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full bg-ink text-paper font-mono uppercase text-xs py-4 tracking-[0.2em] hover:bg-brand-accent transition-colors flex items-center justify-center gap-2 mt-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <span>SENDING...</span>
                                    <Loader2 size={12} className="animate-spin" />
                                </>
                            ) : (
                                <>
                                    <span>发送留言</span>
                                    <Send size={12} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Slogan Stub (Bottom Section) */}
            <div className="relative bg-paper-dark p-8 text-center text-ink">
                 <Notch className="-left-4 top-0 -translate-y-1/2" />
                 <Notch className="-right-4 top-0 -translate-y-1/2" />
                 <DashedLine className="absolute top-0 left-4 right-4 border-stone-500/20" />

                 <div className="my-6">
                     {/* Updated: 字体改为 font-sans (XiXianTingMingTi), 字号改小一号 (text-lg sm:text-xl) */}
                     <p className="font-sans font-normal text-lg sm:text-xl tracking-widest mb-3 opacity-90">
                        有时痴迷科技，有时沉溺文艺。
                     </p>
                     
                     {/* Signature */}
                     <div className="mt-4 flex justify-center opacity-80">
                         {logoUrl ? (
                             <img src={logoUrl} alt="Signature" className="h-10 w-auto object-contain opacity-[0.68] brightness-75 contrast-90 mix-blend-multiply" />
                         ) : (
                             <span className="font-serif italic text-sm">先见志明</span>
                         )}
                     </div>
                 </div>

                 {/* Barcode Section */}
                            <div className="mt-8 pt-4 border-t border-stone-500/10 flex justify-between items-center opacity-40 gap-2">
                     <span className="font-mono text-[8px] text-stone-600 whitespace-nowrap"><a className="text-color" href="https://panzhiming.com">WWW.PANZHIMING.COM</a></span>
                     <div className="flex-grow flex justify-center overflow-hidden">
                        <BarcodeHorizontal className="h-6 w-auto max-w-[120px] mix-blend-multiply" />
                     </div>
                     <span className="font-mono text-[8px] text-stone-600 whitespace-nowrap"><a className="text-color" href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">陕ICP备2026004104号</a></span>
                 </div>
            </div>

        </TicketBase>
        
        {/* Bottom Edge */}
        <div className="h-3 w-full jagged-bottom bg-paper-dark"></div>
      </div>
    </section>
  );
};
