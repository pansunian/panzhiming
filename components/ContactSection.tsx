import React, { useState } from 'react';
import { TicketBase, DashedLine, Notch, BarcodeHorizontal } from './TicketUI';
import { Send, Check, Loader2, AlertCircle } from 'lucide-react';

interface ContactSectionProps {
    logoUrl?: string;
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
    <section id="contact" className="mb-8 w-full">
       
       <div className="flex items-end gap-4 mb-4 px-2">
         <h2 className="font-serif text-2xl font-bold text-ink">留言</h2>
         <span className="font-mono text-xs text-stone-500 mb-1">/ CONTACT</span>
      </div>

      <div>
        <div className="h-3 w-full jagged-top bg-paper"></div>
        
        <TicketBase className="rounded-none bg-paper">
            {/* Form Section */}
            <div className="p-8 pb-12 relative">
                {/* Decorative Stamp */}
                <div className="absolute top-6 right-6 border border-stone-200 rounded p-1 opacity-20 rotate-12 pointer-events-none">
                     <div className="w-16 h-20 border border-dashed border-stone-300 flex items-center justify-center">
                        <span className="font-mono text-[8px] uppercase text-center leading-tight">Postage<br/>Paid</span>
                     </div>
                </div>

                <p className="font-serif text-sm text-stone-500 mb-8 italic w-3/4">
                    为接下来的旅程留下一张便签...
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 rounded-full bg-brand-accent text-white flex items-center justify-center">
                            <Check size={24} />
                        </div>
                        <h3 className="font-serif text-xl font-bold">投递成功</h3>
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
            <div className="relative bg-[#d6d3c9] p-8 text-center text-ink">
                 <Notch className="-left-4 top-0 -translate-y-1/2" />
                 <Notch className="-right-4 top-0 -translate-y-1/2" />
                 <DashedLine className="absolute top-0 left-4 right-4 border-stone-500/20" />

                 <div className="my-6">
                     {/* Updated: 字体改为 font-sans (XiXianTingMingTi), 字号改小一号 (text-lg sm:text-xl) */}
                     <p className="font-sans font-normal text-lg sm:text-xl tracking-widest mb-3 opacity-90">
                        有时热衷科技 &nbsp;有时沉溺文艺
                     </p>
                     
                     {/* Signature */}
                     <div className="mt-4 flex justify-center opacity-80">
                         {logoUrl ? (
                             <img src={logoUrl} alt="Signature" className="h-10 w-auto object-contain mix-blend-multiply" />
                         ) : (
                             <span className="font-serif italic text-sm">先见志明</span>
                         )}
                     </div>
                 </div>

                 {/* Barcode Section */}
                 <div className="mt-8 pt-4 border-t border-stone-500/10 flex justify-between items-center opacity-40 gap-2">
                     <span className="font-mono text-[9px] text-stone-600 whitespace-nowrap">PANZHIMING.COM</span>
                     <div className="flex-grow flex justify-center overflow-hidden">
                        <BarcodeHorizontal className="h-6 w-auto max-w-[120px] mix-blend-multiply" />
                     </div>
                     <span className="font-mono text-[9px] text-stone-600 whitespace-nowrap">Power by Notion</span>
                 </div>
            </div>

        </TicketBase>
        
        {/* Bottom Edge */}
        <div className="h-3 w-full jagged-bottom bg-[#d6d3c9]"></div>
      </div>
    </section>
  );
};