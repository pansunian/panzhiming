import React from 'react';
import { Github } from 'lucide-react';

export function describeLink(href: string, text?: string) {
    const label = text?.trim();
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return { label: label || href, host: '', brand: '' };
    }
    const host = url.hostname.replace(/^www\./, '');
    const isNotionCertificate = host === 'verify.skilljar.com' && url.pathname.replace(/\/$/, '') === '/c/4vjmy5f7qphb';
    const brand = /(^|\.)github\.com$/.test(host) ? 'GitHub'
        : isNotionCertificate || /(^|\.)notion\.(so|com|site)$/.test(host) ? 'Notion'
        : host === 'apps.apple.com' ? 'App Store' : '';
    const segments = url.pathname.split('/').filter(Boolean);
    const shortLabel = brand === 'GitHub' ? segments.slice(0, 2).join('/') : '';
    const rawAddress = label === href || label === '@' + href;
    return { label: label && !rawAddress ? text : shortLabel || brand || (rawAddress ? label : host) || href, host, brand };
}

export function LinkBrand({ brand }: { brand: string }) {
    if (brand === 'GitHub') return <Github aria-hidden="true" size="0.9em" />;
    if (brand === 'App Store') return <span aria-hidden="true" className="apple-link-icon" />;
    if (brand === 'Notion') return <span aria-hidden="true" className="notion-link-initial">N</span>;
    return null;
}

export function ArticleLink({ href, text, className }: { href: string; text: string; className: string }) {
    const link = describeLink(href, text);
    return (
        <a href={href} target={/^https?:/i.test(href) ? '_blank' : undefined} rel="noopener noreferrer"
           className={`article-link content-link ${className}`} title={link.brand || undefined}>
            {link.brand && <span aria-hidden="true" className={link.brand === 'App Store' ? 'article-link-mark apple-link-mark' : 'article-link-mark'}><LinkBrand brand={link.brand} /></span>}
            {link.label}
        </a>
    );
}
