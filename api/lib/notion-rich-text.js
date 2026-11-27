function parseRichText(parts = []) {
  return (parts || []).map(part => {
    const mention = part.type === 'mention' ? part.mention : null;
    const entityId = mention?.page?.id || mention?.database?.id;
    const mentionUrl = mention?.link_preview?.url || mention?.link_mention?.href ||
      (entityId && (!part.href || part.href.startsWith('/'))
        ? 'https://www.notion.so/' + entityId.replace(/-/g, '') : part.href);
    return {
      type: part.type,
      text: part.plain_text,
      annotations: part.annotations,
      href: part.href || part.text?.link?.url,
      mention: mention ? { type: mention.type, url: mentionUrl || '' } : null
    };
  });
}

module.exports = { parseRichText };
