import React from 'react';
import { Globe } from 'lucide-react';

export function describeLink(href: string, text?: string) {
    const label = text?.trim();
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return { label: label || href, host: '', brand: '', isWeb: /^(?:\/|\.\.?\/)/.test(href) };
    }
    const host = url.hostname.replace(/^www\./, '');
    const isNotionCertificate = host === 'verify.skilljar.com' && url.pathname.replace(/\/$/, '') === '/c/4vjmy5f7qphb';
    const brand = /(^|\.)github\.com$/.test(host) ? 'GitHub'
        : isNotionCertificate || /(^|\.)notion\.(so|com|site)$/.test(host) ? 'Notion'
        : host === 'apps.apple.com' ? 'App Store' : '';
    const segments = url.pathname.split('/').filter(Boolean);
    const shortLabel = brand === 'GitHub' ? segments.slice(0, 2).join('/') : '';
    const rawAddress = label === href || label === '@' + href;
    return { label: label && !rawAddress ? text : shortLabel || brand || (rawAddress ? label : host) || href, host, brand, isWeb: /^https?:$/.test(url.protocol) };
}

const brandIcons: Record<string, string> = {
    GitHub: 'github',
    Notion: 'notion',
    'App Store': 'apple',
};

export function WebLinkMark({ brand }: { brand: string }) {
    const icon = brandIcons[brand];
    return <span className="article-link-mark" aria-hidden="true">
        {icon ? <span className={`link-brand-icon link-brand-${icon}`} /> : <Globe size=".72em" strokeWidth={1.8} />}
    </span>;
}

export function ArticleLink({ href, text, className }: { href: string; text: string; className: string }) {
    const link = describeLink(href, text);
    return (
        <a href={href} target={/^https?:/i.test(href) ? '_blank' : undefined} rel="noopener noreferrer"
           className={`article-link content-link ${className}`} title={link.brand || undefined}>
            {link.isWeb && <WebLinkMark brand={link.brand} />}
            {link.label}
        </a>
    );
}
