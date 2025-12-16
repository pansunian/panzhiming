import React, { useState } from 'react';
import { TicketBase, DashedLine, Notch, BarcodeHorizontal } from './TicketUI';
import { Send, Check, Loader2 } from 'lucide-react';

export const ContactSection = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
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

        if (res.ok) {
            setStatus('success');
            // Reset form after delay if needed, or keep success state
        } else {
            setStatus('error');
        }
    } catch (err) {
        console.error(err);
        setStatus('error');
    }
  };

  return (
    <section id="contact" className="mb-24 scroll-mt-12">
       <div className="flex items-end gap-4 mb-10 px-2">
         <h2 className="font-serif text-2xl font-bold text-ink">留言</h2>
         <span className="font-mono text-xs text-stone-500 mb-1">/ CONTACT</span>
      </div>

      <div>
        {/* Top Edge */}
        <div className="h-3 w-full jagged-top bg-paper"></div>
        
        {/* Updated: Removed 'border-x border-stone-100' */}
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
                                    <span>投递明信片</span>
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
                     <p className="font-serif font-bold text-xl tracking-wide mb-3 leading-relaxed">
                        "Not all those who wander are lost."
                     </p>
                     <p className="font-mono text-[9px] opacity-60 uppercase tracking-widest">
                         J.R.R. Tolkien
                     </p>
                 </div>

                 <div className="mt-8 pt-4 border-t border-stone-500/10 flex justify-between items-end opacity-40">
                     <span className="font-mono text-[8px]">ADMIT ONE</span>
                     <BarcodeHorizontal className="h-5 w-24 mix-blend-multiply" />
                     <span className="font-mono text-[8px]">FINAL STUB</span>
                 </div>
            </div>

        </TicketBase>
        
        {/* Bottom Edge */}
        <div className="h-3 w-full jagged-bottom bg-[#d6d3c9]"></div>
      </div>
    </section>
  );
};