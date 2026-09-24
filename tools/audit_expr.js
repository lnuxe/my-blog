
(() => {
  const px = v => parseFloat(v) || 0;
  function parseColor(c){
    if(!c) return null; c = c.trim();
    let m = c.match(/^rgba?\(([^)]+)\)$/);
    if(m){ const p = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return [p[0],p[1],p[2], p.length>3?p[3]:1]; }
    m = c.match(/^#([0-9a-f]{3,8})$/i);
    if(m){ let h=m[1]; if(h.length===3) h=h.split('').map(x=>x+x).join('');
      return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16), h.length===8?parseInt(h.slice(6,8),16)/255:1]; }
    return null;
  }
  function blend(fg,bg){ const a=fg[3]; return [fg[0]*a+bg[0]*(1-a), fg[1]*a+bg[1]*(1-a), fg[2]*a+bg[2]*(1-a), 1]; }
  function effBg(el){
    let n = el;
    while(n && n !== document.documentElement){
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if(c && c[3] > 0.98) return c;
      if(c && c[3] > 0.6) return blend(c, effBg(n.parentElement||document.body));
      n = n.parentElement;
    }
    const b = parseColor(getComputedStyle(document.body).backgroundColor);
    return b && b[3]>0 ? b : [255,255,255,1];
  }
  function lum(c){ const f=v=>{v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4);}; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); }
  function ratio(a,b){ const l1=lum(a),l2=lum(b); const hi=Math.max(l1,l2),lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); }

  const out = { url: location.pathname, theme: document.documentElement.dataset.theme || 'unknown', lang: document.documentElement.lang };
  const S = (el) => {
    if(!el) return null;
    const cs = getComputedStyle(el), fg = parseColor(cs.color), bg = effBg(el);
    const fs = px(cs.fontSize), lh = cs.lineHeight === 'normal' ? fs*1.2 : px(cs.lineHeight);
    const r = el.getBoundingClientRect();
    return { fontSize:fs, lineHeight:+lh.toFixed(2), lhRatio:+(lh/fs).toFixed(3), contrast:+ratio(fg,bg).toFixed(2),
             width:Math.round(r.width), cjkPerLine: fs? Math.floor(r.width/fs):null, color: cs.color,
             rect: {h: Math.round(r.height), w: Math.round(r.width)} };
  };
  const pick = (sel) => { for(const s of sel.split(',')){ const e=document.querySelector(s.trim()); if(e) return e; } return null; };
  out.samples = {
    h1: S(pick('h1')),
    body_p: S(pick('.prose > p, article.prose > p, .lede, article p')),
    li: S(pick('.prose li, article li')),
    h2: S(pick('.prose h2, article h2')),
    nav_a: S(pick('nav a')),
    card_title: S(pick('.post-card-title, .post h3 a, .post-title, .project-card h3, .project-card-title')),
    meta: S(pick('.post-meta, .meta')),
    muted: S(pick('.tag-count, .widget-note, footer p, .site-footer p')),
    pre: S(pick('.prose pre, article pre')),
    quote: S(pick('.prose blockquote, article blockquote'))
  };
  const art = pick('.prose, article');
  out.articleWidth = art ? Math.round(art.getBoundingClientRect().width) : null;
  const acs = art ? getComputedStyle(art) : getComputedStyle(document.body);
  out.cjk = { lineBreak: acs.lineBreak, wordBreak: acs.wordBreak, overflowWrap: acs.overflowWrap,
              textAlign: acs.textAlign, textSpacingTrim: acs.textSpacingTrim || '(unsupported)',
              textWrap: acs.textWrap || acs.textWrapStyle || '(unsupported)', bodyFontSize: px(getComputedStyle(document.body).fontSize) };
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h=>+h.tagName[1]);
  out.headings = { count: hs.length, h1Count: hs.filter(x=>x===1).length,
                   skips: hs.filter((v,i)=> i>0 && v-hs[i-1] > 1).length };
  const targets = [];
  for(const el of document.querySelectorAll('a[href], button, input, [role=button]')){
    const r = el.getBoundingClientRect();
    if(r.width===0 || r.height===0) continue;
    if(r.height < 24 || r.width < 24){
      const inSentence = !!el.closest('p, li > span, blockquote');
      targets.push({ tag: el.tagName, text:(el.textContent||'').trim().slice(0,26), w:Math.round(r.width), h:Math.round(r.height), inSentence });
    }
  }
  out.smallTargets = targets;
  out.smallTargetsNotInline = targets.filter(t=>!t.inSentence).length;
  out.imgNoAlt = [...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length;
  out.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const probe = pick('nav a, a[href]');
  if(probe){ probe.focus(); const f=getComputedStyle(probe);
    out.focus = { outlineStyle:f.outlineStyle, outlineWidth:f.outlineWidth, outlineColor:f.outlineColor }; }
  const sizes = new Set(), spaces = new Set();
  for(const el of document.querySelectorAll('*')){
    const s = getComputedStyle(el);
    sizes.add(+(parseFloat(s.fontSize)).toFixed(2));
    for(const k of ['marginTop','marginBottom','paddingTop','paddingBottom','rowGap','gap']){
      const v = s[k]; if(v && v.endsWith('px')){ const n=parseFloat(v); if(n>0) spaces.add(+n.toFixed(2)); }
    }
  }
  out.fontSizes = [...sizes].sort((a,b)=>a-b);
  out.spacing = [...spaces].sort((a,b)=>a-b);
  out.offGrid = out.spacing.filter(v => Math.abs(v/4 - Math.round(v/4)) > 0.01);
  return JSON.stringify(out);
})()