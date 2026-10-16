/*
 * Runs inside the browser. Converts the rendered WorkRadar page into an SVG
 * made of real rectangles, vector icons and live text, so dropping the file
 * into Figma gives editable layers (not a screenshot) that match the app
 * pixel for pixel. Layer names come from element ids, aria labels and classes.
 */
(() => {
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK']);
  const GROUP_TAGS = new Set(['SECTION', 'HEADER', 'NAV', 'ASIDE', 'MAIN', 'ARTICLE', 'BUTTON', 'FORM', 'LI', 'OL', 'UL', 'DL', 'FOOTER', 'LABEL']);

  function escapeXml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  function parseColor(c) {
    if (!c || c === 'transparent') return null;
    let m = c.match(/^rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      const a = p.length > 3 ? p[3] : 1;
      if (a === 0) return null;
      return { hex: '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''), a };
    }
    m = c.match(/^color\(srgb ([^)]+)\)/);
    if (m) {
      const [rgb, alpha] = m[1].split('/');
      const p = rgb.trim().split(/\s+/).map(Number);
      const a = alpha !== undefined ? Number(alpha) : 1;
      if (a === 0) return null;
      return { hex: '#' + p.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join(''), a };
    }
    return null;
  }

  const fillAttr = (col, op, prop = 'fill') => {
    if (!col) return `${prop}="none"`;
    const a = +(col.a * op).toFixed(3);
    return `${prop}="${col.hex}"${a < 1 ? ` ${prop}-opacity="${a}"` : ''}`;
  };

  const metricsCache = new Map();
  const ctx = document.createElement('canvas').getContext('2d');
  function fontMetrics(cs) {
    const key = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if (!metricsCache.has(key)) {
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText('Hgjpq');
      metricsCache.set(key, { asc: m.fontBoundingBoxAscent, desc: m.fontBoundingBoxDescent });
    }
    return metricsCache.get(key);
  }

  function family(cs) {
    return cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
  }

  function textAttrs(cs, op) {
    const col = parseColor(cs.color);
    const ls = cs.letterSpacing === 'normal' ? '' : ` letter-spacing="${parseFloat(cs.letterSpacing)}"`;
    const italic = cs.fontStyle === 'italic' ? ' font-style="italic"' : '';
    return `font-family="${escapeXml(family(cs))}" font-size="${parseFloat(cs.fontSize)}" font-weight="${cs.fontWeight}"${italic}${ls} ${fillAttr(col, op)}`;
  }

  /** Split a text node into visual lines using per character client rects. */
  function textLines(node, cs) {
    const text = node.textContent;
    const range = document.createRange();
    const lines = [];
    let cur = null;
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i); range.setEnd(node, i + 1);
      const rects = range.getClientRects();
      if (!rects.length) continue;
      const r = rects[0];
      if (r.width === 0 && /\s/.test(text[i])) { if (cur) cur.text += text[i]; continue; }
      if (!cur || Math.abs(r.top - cur.top) > r.height / 2) {
        cur = { text: '', left: r.left, top: r.top, height: r.height };
        lines.push(cur);
      }
      cur.text += text[i];
    }
    const upper = cs.textTransform === 'uppercase';
    return lines
      .map((l) => ({ ...l, text: (upper ? l.text.toUpperCase() : l.text).replace(/\s+$/, '').replace(/\s+/g, ' ') }))
      .filter((l) => l.text.trim());
  }

  function wrapText(text, cs, width) {
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const out = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > width && line) { out.push(line); line = word; } else line = next;
      }
      out.push(line);
    }
    return out;
  }

  function layerName(el) {
    const label = el.getAttribute('aria-label') || el.id || (typeof el.className === 'string' && el.className.split(' ')[0]) || el.tagName.toLowerCase();
    return label.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 48) || 'layer';
  }

  function parseShadows(v) {
    if (!v || v === 'none') return [];
    return v.split(/,(?![^(]*\))/).map((s) => {
      const color = s.match(/(rgba?\([^)]+\)|color\([^)]+\))/)?.[0];
      const nums = s.replace(color ?? '', '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
      return { inset: /inset/.test(s), color: parseColor(color), x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0, spread: nums[3] || 0 };
    });
  }

  function serializeSvg(svg, op) {
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const vw = vb && vb.width ? vb.width : r.width;
    const vh = vb && vb.height ? vb.height : r.height;
    const sx = r.width / vw, sy = r.height / vh;
    const parts = [];
    const shapes = svg.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse');
    shapes.forEach((s) => {
      const cs = getComputedStyle(s);
      if (cs.display === 'none') return;
      const so = op * parseFloat(cs.opacity || '1');
      const attrs = [...s.attributes]
        .filter((a) => !['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-opacity', 'stroke-opacity', 'opacity', 'class', 'style'].includes(a.name))
        .map((a) => `${a.name}="${escapeXml(a.value)}"`).join(' ');
      const stroke = parseColor(cs.stroke);
      const fill = parseColor(cs.fill);
      parts.push(`<${s.tagName.toLowerCase()} ${attrs} ${fillAttr(fill, so)} ${fillAttr(stroke, so, 'stroke')} stroke-width="${parseFloat(cs.strokeWidth) || 0}" stroke-linecap="${cs.strokeLinecap}" stroke-linejoin="${cs.strokeLinejoin}"/>`);
    });
    return `<g id="icon" transform="translate(${r.left + scrollX} ${r.top + scrollY}) scale(${+sx.toFixed(4)} ${+sy.toFixed(4)})">${parts.join('')}</g>`;
  }

  function walk(el, op, clipH) {
    if (SKIP_TAGS.has(el.tagName)) return '';
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return '';
    if (cs.clip && cs.clip.startsWith('rect(0')) return '';
    const o = op * parseFloat(cs.opacity);
    if (o <= 0.01) return '';
    const r = el.getBoundingClientRect();
    if (r.top + scrollY > clipH) return '';
    if (el.tagName.toLowerCase() === 'svg') return serializeSvg(el, o);

    const x = r.left + scrollX, y = r.top + scrollY, w = r.width, h = r.height;
    const out = [];
    const radius = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, w / 2, h / 2);
    const rx = radius ? ` rx="${+radius.toFixed(2)}"` : '';
    const shadows = parseShadows(cs.boxShadow);
    const outer = shadows.find((s) => !s.inset && s.blur > 0 && s.color);
    const bg = parseColor(cs.backgroundColor);
    if (w > 0 && h > 0 && (bg || outer)) {
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx} ${fillAttr(bg ?? { hex: '#ffffff', a: 1 }, o)}${outer ? ' filter="url(#shadow)"' : ''}/>`);
    }
    // Inset rings drawn with box-shadow (pills, chips, focus rings)
    shadows.filter((s) => s.inset && s.spread > 0 && s.color).forEach((s) => {
      const sw = s.spread;
      out.push(`<rect x="${x + sw / 2}" y="${y + sw / 2}" width="${w - sw}" height="${h - sw}"${radius ? ` rx="${Math.max(0, radius - sw / 2)}"` : ''} fill="none" ${fillAttr(s.color, o, 'stroke')} stroke-width="${sw}"/>`);
    });
    shadows.filter((s) => !s.inset && s.blur === 0 && s.spread > 0 && s.color).forEach((s) => {
      const sw = s.spread;
      out.push(`<rect x="${x - sw / 2}" y="${y - sw / 2}" width="${w + sw}" height="${h + sw}" rx="${radius + sw / 2}" fill="none" ${fillAttr(s.color, o, 'stroke')} stroke-width="${sw}"/>`);
    });
    // Borders
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => ({ s, w: parseFloat(cs[`border${s}Width`]) || 0, c: parseColor(cs[`border${s}Color`]), style: cs[`border${s}Style`] }));
    const visible = sides.filter((b) => b.w > 0 && b.c && b.style !== 'none');
    const uniform = visible.length === 4 && visible.every((b) => b.w === visible[0].w && b.c.hex === visible[0].c.hex);
    if (uniform) {
      const bw = visible[0].w;
      out.push(`<rect x="${x + bw / 2}" y="${y + bw / 2}" width="${w - bw}" height="${h - bw}"${radius ? ` rx="${Math.max(0, radius - bw / 2)}"` : ''} fill="none" ${fillAttr(visible[0].c, o, 'stroke')} stroke-width="${bw}"${visible[0].style === 'dashed' ? ' stroke-dasharray="4 3"' : ''}/>`);
    } else {
      visible.forEach((b) => {
        const box = { Top: [x, y, w, b.w], Bottom: [x, y + h - b.w, w, b.w], Left: [x, y, b.w, h], Right: [x + w - b.w, y, b.w, h] }[b.s];
        out.push(`<rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" ${fillAttr(b.c, o)}/>`);
      });
    }
    // Radio dot drawn with a gradient
    if (cs.backgroundImage.includes('radial-gradient')) {
      const col = parseColor(cs.borderTopColor);
      out.push(`<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 4}" ${fillAttr(col, o)}/>`);
    }
    // Form fields
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const value = el.value;
      const ph = !value;
      const text = value || el.placeholder || '';
      if (text) {
        const pcs = ph ? getComputedStyle(el, '::placeholder') : cs;
        const fm = fontMetrics(cs);
        const fs = parseFloat(cs.fontSize);
        const padL = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
        if (el.tagName === 'INPUT') {
          const baseline = y + h / 2 + (fm.asc - fm.desc) / 2;
          out.push(`<text x="${x + padL}" y="${baseline}" ${textAttrs(pcs, o)} xml:space="preserve">${escapeXml(text)}</text>`);
        } else {
          const lh = parseFloat(cs.lineHeight) || fs * 1.5;
          const innerW = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
          wrapText(text, cs, innerW).forEach((line, n) => {
            const top = y + parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth) + n * lh;
            out.push(`<text x="${x + padL}" y="${top + (lh - (fm.asc + fm.desc)) / 2 + fm.asc}" ${textAttrs(pcs, o)} xml:space="preserve">${escapeXml(line)}</text>`);
          });
        }
      }
    }
    // Decorative pseudo elements (timeline line and dots)
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content !== '""' || ps.position !== 'absolute') continue;
      const pw = parseFloat(ps.width), ph = parseFloat(ps.height);
      if (!pw || !ph) continue;
      const bwid = parseFloat(ps.borderTopWidth) || 0;
      const px = x + parseFloat(ps.left), py = y + parseFloat(ps.top);
      const W2 = pw + 2 * bwid, H2 = ph + 2 * bwid;
      const pr = Math.min(parseFloat(ps.borderTopLeftRadius) || 0, W2 / 2, H2 / 2);
      const pbg = parseColor(ps.backgroundColor), pbc = bwid ? parseColor(ps.borderTopColor) : null;
      out.push(`<rect x="${px + bwid / 2}" y="${py + bwid / 2}" width="${W2 - bwid}" height="${H2 - bwid}"${pr ? ` rx="${pr}"` : ''} ${fillAttr(pbg, o)}${pbc ? ` ${fillAttr(pbc, o, 'stroke')} stroke-width="${bwid}"` : ''}/>`);
    }
    // Children and text
    const closedDetails = el.tagName === 'DETAILS' && !el.open;
    for (const child of el.childNodes) {
      if (closedDetails && child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'SUMMARY') continue;
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() && el.tagName !== 'TEXTAREA') {
        const fm = fontMetrics(cs);
        for (const l of textLines(child, cs)) {
          const base = l.top + scrollY + (l.height * fm.asc) / (fm.asc + fm.desc);
          out.push(`<text x="${+(l.left + scrollX).toFixed(2)}" y="${+base.toFixed(2)}" ${textAttrs(cs, o)} xml:space="preserve">${escapeXml(l.text)}</text>`);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        out.push(walk(child, o, clipH));
      }
    }
    // Ordered list counters drawn with ::before (brief focus numbers)
    const before = getComputedStyle(el, '::before');
    if (before.content && before.content !== 'none' && before.content.startsWith('counter') && el.parentElement) {
      const n = [...el.parentElement.children].indexOf(el) + 1;
      const bw = parseFloat(before.width) || 20, bh = parseFloat(before.height) || 20;
      const by = y + (parseFloat(before.marginTop) || 0);
      out.unshift(`<g id="number"><circle cx="${x + bw / 2}" cy="${by + bh / 2}" r="${bw / 2}" ${fillAttr(parseColor(before.backgroundColor), o)}/><text x="${x + bw / 2}" y="${by + bh / 2 + 4}" text-anchor="middle" ${textAttrs(before, o)}>${n}</text></g>`);
    }
    const body = out.filter(Boolean).join('');
    if (!body) return '';
    const group = GROUP_TAGS.has(el.tagName) || (typeof el.className === 'string' && el.className.trim());
    return group ? `<g id="${escapeXml(layerName(el))}">${body}</g>` : body;
  }

  window.domToSvg = function domToSvg(opts = {}) {
    const W = Math.ceil(document.documentElement.scrollWidth);
    const H = Math.ceil(opts.height ?? document.documentElement.scrollHeight);
    const bg = parseColor(getComputedStyle(document.body).backgroundColor) ?? { hex: '#ffffff', a: 1 };
    const content = walk(document.body, 1, H);
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#14202B" flood-opacity="0.08"/></filter></defs>
<rect id="background" width="${W}" height="${H}" fill="${bg.hex}"/>
${content}
</svg>`;
  };
})();
