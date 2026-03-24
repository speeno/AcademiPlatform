function sanitizeStyleValue(styleValue: string): string {
  const lowered = styleValue.toLowerCase();
  if (
    lowered.includes('expression(') ||
    lowered.includes('javascript:') ||
    lowered.includes('behavior:')
  ) {
    return '';
  }
  return styleValue;
}

function isSafeHref(href: string): boolean {
  const value = href.trim().toLowerCase();
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('#') ||
    value.startsWith('/')
  );
}

function isSafeImageSrc(src: string): boolean {
  const value = src.trim().toLowerCase();
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image/')
  );
}

export function sanitizeCmsHtml(input: string): string {
  if (typeof window === 'undefined') {
    return input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(input || '', 'text/html');

  doc.querySelectorAll('script,iframe,object,embed,meta,link').forEach((node) => {
    node.remove();
  });

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    const el = current as HTMLElement;
    const attrs = Array.from(el.attributes);

    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const value = attr.value || '';

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }

      if (name === 'href' && !isSafeHref(value)) {
        el.removeAttribute(attr.name);
        continue;
      }

      if (name === 'src') {
        if (el.tagName.toLowerCase() === 'img') {
          if (!isSafeImageSrc(value)) el.removeAttribute(attr.name);
        } else if (!isSafeHref(value)) {
          el.removeAttribute(attr.name);
        }
        continue;
      }

      if (name === 'style') {
        const safeStyle = sanitizeStyleValue(value);
        if (!safeStyle) {
          el.removeAttribute(attr.name);
        } else {
          el.setAttribute(attr.name, safeStyle);
        }
      }
    }
    current = walker.nextNode();
  }

  return doc.body.innerHTML;
}

