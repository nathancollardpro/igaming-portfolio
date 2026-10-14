/* Langue du site (FR / EN), partagée par toutes les pages.
   Ordre de choix : ?lang=fr|en dans l'URL, puis le dernier choix du visiteur (localStorage kc_lang),
   puis la langue du navigateur (français → FR, sinon EN).
   Chaque page déclare ses textes avec KC.add({clé:{fr:'…',en:'…'}}) et les place avec :
     data-i18n="clé"            → texte
     data-i18n-html="clé"       → HTML
     data-i18n-attr="title:clé;aria-label:clé2"
     data-i18n-pl / data-i18n-sg → pluriel / singulier lus par live.js
   Le sélecteur à drapeaux se place dans tout élément [data-lang-switch]. */
(function(){
  var KEY='kc_lang',LANGS=['fr','en'],dict={},subs=[],lang;
  function pick(){
    try{var q=new URLSearchParams(location.search).get('lang');if(LANGS.indexOf(q)>=0){try{localStorage.setItem(KEY,q);}catch(e){}return q;}}catch(e){}
    try{var s=localStorage.getItem(KEY);if(LANGS.indexOf(s)>=0)return s;}catch(e){}
    var n=((navigator.languages&&navigator.languages[0])||navigator.language||'fr').toLowerCase();
    return n.indexOf('fr')===0?'fr':'en';
  }
  lang=pick();
  document.documentElement.lang=lang;

  function t(k,vars){
    var e=dict[k],s=e?(e[lang]!=null?e[lang]:e.fr):k;
    if(vars)s=String(s).replace(/\{(\w+)\}/g,function(m,v){return vars[v]!=null?vars[v]:m;});
    // typographie française : espace insécable avant ! ? : ;
    if(lang==='fr'&&typeof s==='string')s=s.replace(/ ([!?:;])/g,' $1');
    return s;
  }
  function apply(root){
    root=root||document;
    root.querySelectorAll('[data-i18n]').forEach(function(el){el.textContent=t(el.getAttribute('data-i18n'));});
    root.querySelectorAll('[data-i18n-html]').forEach(function(el){el.innerHTML=t(el.getAttribute('data-i18n-html'));});
    root.querySelectorAll('[data-i18n-attr]').forEach(function(el){
      el.getAttribute('data-i18n-attr').split(';').forEach(function(p){var kv=p.split(':');if(kv.length===2)el.setAttribute(kv[0].trim(),t(kv[1].trim()));});
    });
    root.querySelectorAll('[data-i18n-pl]').forEach(function(el){
      el.setAttribute('data-pl',t(el.getAttribute('data-i18n-pl')));
      el.setAttribute('data-sg',t(el.getAttribute('data-i18n-sg')||el.getAttribute('data-i18n-pl')));
      if(!el.hasAttribute('data-n'))el.textContent=el.getAttribute('data-pl');
    });
    if(root===document){
      if(dict['meta.title'])document.title=t('meta.title');
      var md=document.querySelector('meta[name="description"]');if(md&&dict['meta.desc'])md.setAttribute('content',t('meta.desc'));
      document.querySelectorAll('[data-lang-switch] button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-lang')===lang?'true':'false');});
    }
  }
  function set(l){
    if(LANGS.indexOf(l)<0||l===lang)return;
    lang=l;document.documentElement.lang=l;
    try{localStorage.setItem(KEY,l);}catch(e){}
    try{var u=new URL(location.href);if(u.searchParams.has('lang')){u.searchParams.set('lang',l);history.replaceState(history.state,'',u);}}catch(e){}
    apply(document);
    subs.forEach(function(f){try{f(l);}catch(e){console.error(e);}});
    if(window.KCLive&&KCLive.refresh)KCLive.refresh();
  }

  /* drapeaux en SVG : les émojis drapeaux ne s'affichent pas sous Windows */
  var FLAG={
    fr:'<svg viewBox="0 0 3 2" aria-hidden="true"><path fill="#002395" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#ED2939" d="M2 0h1v2H2z"/></svg>',
    en:'<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="kcUkA"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="kcUkB"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#kcUkA)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#kcUkB)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>'
  };
  var NAME={fr:'Français',en:'English'};
  var css='.kc-lang{display:inline-flex;gap:4px;padding:3px;border-radius:9px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.12);flex-shrink:0}'+
    '.kc-lang button{display:inline-flex;align-items:center;gap:6px;padding:4px 7px;border:1px solid transparent;border-radius:6px;background:none;color:inherit;font:700 12px/1 system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;opacity:.55;transition:opacity .15s,border-color .15s,background-color .15s}'+
    '.kc-lang button:hover{opacity:.9}'+
    '.kc-lang button[aria-pressed="true"]{opacity:1;border-color:var(--kc-lang-acc,#FFD600);background:rgba(255,255,255,.08)}'+
    '.kc-lang button:focus-visible{outline:2px solid var(--kc-lang-acc,#FFD600);outline-offset:2px}'+
    '.kc-lang svg{width:21px;height:14px;border-radius:2px;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.25)}'+
    '.kc-lang b{font-weight:700}'+
    '@media(max-width:600px){.kc-lang b{display:none}.kc-lang button{padding:5px 6px}}'+
    '.kc-lang.kc-lg{gap:12px;padding:0;background:none;border:0}'+
    '.kc-lang.kc-lg button{flex:1;justify-content:center;gap:14px;height:64px;padding:0 18px;border:3px solid #8a5a2b;border-radius:14px;background:#2a1608;font:900 30px/1 "Barlow Condensed",sans-serif;opacity:1}'+
    '.kc-lang.kc-lg button[aria-pressed="true"]{border-color:var(--kc-lang-acc,#f2c14e);background:#5a3418}'+
    '.kc-lang.kc-lg svg{width:48px;height:32px;border-radius:4px}'+
    '.kc-lang.kc-lg b{display:inline}';
  function mount(){
    if(!document.getElementById('kcLangCss')){var st=document.createElement('style');st.id='kcLangCss';st.textContent=css;document.head.appendChild(st);}
    document.querySelectorAll('[data-lang-switch]').forEach(function(box){
      if(box.getAttribute('data-mounted'))return;box.setAttribute('data-mounted','1');
      box.classList.add('kc-lang');box.setAttribute('role','group');box.setAttribute('aria-label','Langue / Language');
      LANGS.forEach(function(l){
        var b=document.createElement('button');b.type='button';b.setAttribute('data-lang',l);b.setAttribute('lang',l);
        b.setAttribute('aria-label',NAME[l]);b.title=NAME[l];b.setAttribute('aria-pressed',l===lang?'true':'false');
        b.innerHTML=FLAG[l]+'<b>'+l.toUpperCase()+'</b>';
        b.addEventListener('click',function(){set(l);});
        box.appendChild(b);
      });
    });
  }

  window.KC={
    get lang(){return lang;},
    t:t,
    add:function(d){for(var k in d)dict[k]=d[k];},
    apply:apply,
    set:set,
    on:function(f){subs.push(f);},
    loc:function(){return lang==='fr'?'fr-FR':'en-GB';},
    /* nombre formaté avec n décimales fixes, séparateurs de la langue */
    num:function(v,n){return Number(v).toLocaleString(lang==='fr'?'fr-FR':'en-GB',{minimumFractionDigits:n||0,maximumFractionDigits:n||0});},
    /* virgule décimale en français, point en anglais */
    dec:function(s){s=String(s);return lang==='fr'?s.replace('.',','):s;},
    mount:mount
  };
  function ready(){mount();apply(document);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
