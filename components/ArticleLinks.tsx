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
    let icon: React.ReactNode;
    switch (brand) {
        case 'GitHub': icon = <Github size=".79em" />; break;
        case 'App Store': icon = <span className="apple-link-icon" />; break;
        case 'Notion': icon = <span className="notion-link-initial">N</span>; break;
        default: return null;
    }
    return <span className="article-link-mark" aria-hidden="true">{icon}</span>;
}

export function ArticleLink({ href, text, className }: { href: string; text: string; className: string }) {
    const link = describeLink(href, text);
    return (
        <a href={href} target={/^https?:/i.test(href) ? '_blank' : undefined} rel="noopener noreferrer"
           className={`article-link content-link ${className}`} title={link.brand || undefined}>
            <LinkBrand brand={link.brand} />
            {link.label}
        </a>
    );
}
