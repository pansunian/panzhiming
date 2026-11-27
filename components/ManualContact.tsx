import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Check, Copy, Mail, MessageCircle, X } from 'lucide-react';
import './ManualContact.css';

interface ContactBlock {
    type: string;
    content?: { text: string; href?: string }[];
    children?: ContactBlock[];
}

const plainText = (block: ContactBlock) => block.content?.map(part => part.text).join('').trim() || '';

export function readManualContact(block: ContactBlock) {
    if (block.type !== 'callout') return null;
    const wechat = plainText(block).match(/^微信(?:号)?[：:]\s*([\w-]+)$/i)?.[1];
    if (!wechat) return null;
    const children = block.children || [];
    const emailBlock = children.find(child => /^邮箱[：:]/.test(plainText(child)) && child.type === 'paragraph');
    const email = emailBlock && plainText(emailBlock).replace(/^邮箱[：:]\s*/, '');
    return { wechat, email, other: children.filter(child => child !== emailBlock) };
}

function CopyContact({ value, label }: { value: string; label: string }) {
    const [result, setResult] = useState<'ready' | 'copied' | 'manual'>('ready');
    const valueRef = useRef<HTMLSpanElement>(null);
    async function copy() {
        try {
            await navigator.clipboard.writeText(value);
            setResult('copied');
        } catch {
            const selection = window.getSelection();
            if (selection && valueRef.current) {
                const range = document.createRange();
                range.selectNodeContents(valueRef.current);
                selection.removeAllRanges();
                selection.addRange(range);
                try {
                    if (document.execCommand('copy')) {
                        selection.removeAllRanges();
                        setResult('copied');
                        return;
                    }
                } catch { /* Keep the value selected for copying by hand. */ }
            }
            setResult('manual');
        }
    }
    return <div className="contact-copy">
        <span ref={valueRef} className="contact-value">{value}</span>
        <button type="button" aria-label={`复制${label}`} onClick={copy}>
            {result === 'copied' ? <Check size={15} /> : <Copy size={15} />}复制
        </button>
        <span role="status" className="contact-feedback">{result === 'copied' ? '已复制' : result === 'manual' ? '请长按或选中上方文字复制' : ''}</span>
    </div>;
}

type ContactProps = { wechat: string; email?: string; children?: React.ReactNode };

function ContactDialog({ wechat, email, children, onClose }: ContactProps & { onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [method, setMethod] = useState<'wechat' | 'email'>('wechat');
    useEffect(() => {
        const el = dialog.current!;
        const previousOverflow = document.body.style.overflow;
        el.showModal();
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
            el.close();
        };
    }, []);
    return createPortal(
        <dialog ref={dialog} aria-labelledby={titleId} className="manual-contact-dialog"
            onCancel={event => { event.preventDefault(); onClose(); }}
            onClick={event => {
                if (event.target !== event.currentTarget) return;
                const box = event.currentTarget.getBoundingClientRect();
                if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
            }}>
            <header className="contact-heading">
                <h2 id={titleId} className="font-serif font-medium">来找我聊聊</h2>
                <button type="button" onClick={onClose} aria-label="关闭联系方式" autoFocus><X size={18} /></button>
            </header>
            {email && <div className="contact-methods" role="group" aria-label="联系方式">
                <button type="button" aria-pressed={method === 'wechat'} onClick={() => setMethod('wechat')}>微信</button>
                <button type="button" aria-pressed={method === 'email'} onClick={() => setMethod('email')}>邮箱</button>
            </div>}
            <div className="contact-panel">
                {method === 'wechat' ? <>
                    {wechat === 'pansunian' && <img className="contact-qr" src="/images/personal-wechat-qr.png" width="752" height="752" alt="扫码添加潘志明的个人微信" />}
                    <CopyContact key="wechat" label="微信号" value={wechat} />
                </> : email && <>
                    <Mail size={29} strokeWidth={1.4} className="contact-envelope" />
                    <CopyContact key="email" label="邮箱" value={email} />
                    <a className="contact-mail content-link" href={`mailto:${email}`}>给我发邮件 <ArrowUpRight size={14} /></a>
                </>}
            </div>
            {children && <footer className="contact-extra">{children}</footer>}
        </dialog>, document.body
    );
}

export function ManualContact(props: ContactProps) {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const close = () => {
        setOpen(false);
        requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
    };
    return <>
        <button ref={trigger} className="manual-contact-trigger" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
            <MessageCircle size={17} aria-hidden="true" />来找我聊聊
        </button>
        {open && <ContactDialog {...props} onClose={close} />}
    </>;
}
