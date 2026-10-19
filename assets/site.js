/* Assistant de vol SMUH — scripts communs :
   menu mobile, actualités, sommaire, apparitions au scroll, cartes 3D, halo du curseur,
   compteurs, fond animé des pages intérieures, progression de lecture. */
(function(){
  var root=document.documentElement; root.classList.add('js');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(pointer: fine)').matches;
  var isHome=document.body.classList.contains('home');

  // ---------- Menu mobile ----------
  var b=document.querySelector('.burger'),n=document.querySelector('.nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);});}

  // ---------- En-tête qui se solidifie au scroll ----------
  var head=document.querySelector('.site-head');
  function onScroll(){ if(head) head.classList.toggle('scrolled',scrollY>40); }
  onScroll(); addEventListener('scroll',onScroll,{passive:true});

  // ---------- Fond 3D des pages intérieures ----------
  if(!isHome && document.querySelector('.page-head')){
    var g=document.createElement('div'); g.className='bg-grid'; g.setAttribute('aria-hidden','true');
    g.innerHTML='<div class="orb"></div><div class="floor"></div>';
    document.body.insertBefore(g,document.body.firstChild);
  }

  // ---------- Apparitions au scroll ----------
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{rootMargin:'0px 0px -8% 0px',threshold:.08}):null;
  function reveal(scope){
    var auto=(scope||document).querySelectorAll('.page-head > *, .sh, .card, .fiche, .stat, .keybox, .news-item, .prose > section, .bigstat, .names > div, .filters');
    auto.forEach(function(el){ if(!el.hasAttribute('data-reveal') && !el.closest('.hero3d') && !el.closest('.frise-track')) el.setAttribute('data-reveal',''); });
    var els=(scope||document).querySelectorAll('[data-reveal]:not(.in)');
    var groups=new Map();
    els.forEach(function(el){
      var p=el.parentElement, i=groups.get(p)||0; groups.set(p,i+1);
      if(!el.style.getPropertyValue('--d')) el.style.setProperty('--d',Math.min(i*0.08,.5)+'s');
      if(io&&!reduce) io.observe(el); else el.classList.add('in');
    });
  }
  window.smuhReveal=reveal;
  // Filet de sécurité : après un saut de scroll (ancre, retour), révèle ce qui est déjà à l'écran
  var rq=0;
  function sweep(){ rq=0; document.querySelectorAll('[data-reveal]:not(.in)').forEach(function(el){
    var r=el.getBoundingClientRect(); if(r.top<innerHeight*.95 && r.bottom>0){ el.classList.add('in'); if(io) io.unobserve(el); } }); }
  addEventListener('scroll',function(){ if(!rq) rq=setTimeout(sweep,140); },{passive:true});
  addEventListener('load',sweep);

  // ---------- Cartes en 3D (tilt + projecteur) ----------
  function tilt(scope){
    if(!fine||reduce) return;
    (scope||document).querySelectorAll('.card, .step, .bigstats, .siege-photo').forEach(function(el){
      if(el.dataset.tilt) return; el.dataset.tilt='1'; el.classList.add('tilt');
      var max=el.classList.contains('bigstats')?3:8;
      el.addEventListener('pointermove',function(e){
        var r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
        el.style.setProperty('--mx',x*100+'%'); el.style.setProperty('--my',y*100+'%');
        el.style.transform='perspective(900px) rotateX('+((.5-y)*max)+'deg) rotateY('+((x-.5)*max)+'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave',function(){ el.style.transform=''; });
    });
  }
  window.smuhTilt=tilt;

  // ---------- Boutons magnétiques ----------
  if(fine&&!reduce){
    document.querySelectorAll('.btn').forEach(function(bt){
      bt.addEventListener('pointermove',function(e){ var r=bt.getBoundingClientRect();
        bt.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.28)+'px)'; });
      bt.addEventListener('pointerleave',function(){ bt.style.transform=''; });
    });
  }

  // ---------- Halo du curseur ----------
  if(fine&&!reduce){
    var cg=document.createElement('div'); cg.className='cursor-glow'; cg.setAttribute('aria-hidden','true'); document.body.appendChild(cg);
    var cx=innerWidth/2, cy=innerHeight/2, tx=cx, ty=cy;
    addEventListener('pointermove',function(e){ tx=e.clientX; ty=e.clientY; cg.classList.add('on'); },{passive:true});
    document.addEventListener('pointerleave',function(){ cg.classList.remove('on'); });
    (function f(){ cx+=(tx-cx)*.12; cy+=(ty-cy)*.12; cg.style.transform='translate('+cx+'px,'+cy+'px)'; requestAnimationFrame(f); })();
  }

  // ---------- Compteurs ----------
  var cio=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){ if(!e.isIntersecting) return; cio.unobserve(e.target);
      var el=e.target, to=+el.getAttribute('data-count'), from=+(el.getAttribute('data-from')||0), d=1600, t0=performance.now();
      if(reduce){ el.textContent=to; return; }
      (function step(now){ var k=Math.min(1,(now-t0)/d), v=from+(to-from)*(1-Math.pow(1-k,4));
        el.textContent=Math.round(v); if(k<1) requestAnimationFrame(step); })(t0);
    });
  },{threshold:.5}):null;
  document.querySelectorAll('[data-count]').forEach(function(el){ if(cio) cio.observe(el); else el.textContent=el.getAttribute('data-count'); });

  // ---------- Progression de lecture ----------
  var prose=document.querySelector('article.prose');
  if(prose){
    var bar=document.createElement('div'); bar.className='read-progress'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
    var upd=function(){ var r=prose.getBoundingClientRect(), tot=r.height-innerHeight*.6;
      bar.style.setProperty('--p',Math.max(0,Math.min(1,(-r.top+innerHeight*.2)/tot))); };
    upd(); addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd);
  }

  // ---------- Année ----------
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});

  // ---------- Actualités ----------
  var COL={"Bases":"var(--green)","Hélistations":"var(--cyan)","Réglementation":"var(--amber)","Réforme des secours":"var(--pink)","Convention collective":"var(--violet)","Sécurité des vols":"var(--amber)","Exploitants":"var(--cyan)","Matériel":"var(--green)","Métier":"var(--violet)"};
  var MOIS=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fmtLong(d){var p=d.split('-');return (+p[2])+' '+MOIS[+p[1]-1]+' '+p[0];}
  function item(it){
    var p=it.date.split('-'),c=COL[it.category]||'var(--violet)';
    return '<article class="news-item" style="--c:'+c+'">'+
      '<div class="news-date"><b>'+(+p[2])+' '+MOIS[+p[1]-1]+'</b>'+p[0]+'</div>'+
      '<div class="news-body">'+
        '<div class="news-meta"><span class="tag" style="--tc:'+c+'">'+esc(it.category)+'</span><span>'+esc(it.source)+'</span></div>'+
        '<h3><a href="'+esc(it.url)+'" target="_blank" rel="noopener">'+esc(it.title)+' ↗</a></h3>'+
        '<p>'+esc(it.summary)+'</p>'+
      '</div></article>';
  }
  var box=document.querySelector('[data-news]');
  if(box){
    var limit=+box.getAttribute('data-limit')||0, src=box.getAttribute('data-src');
    fetch(src,{cache:'no-cache'}).then(function(r){return r.json();}).then(function(data){
      var items=(data.items||[]).slice().sort(function(a,b){return a.date<b.date?1:-1;});
      var up=document.querySelector('[data-news-updated]');
      if(up&&data.updated)up.textContent='Mis à jour le '+fmtLong(data.updated);
      var f=document.querySelector('[data-news-filters]');
      function render(cat){
        var list=items.filter(function(i){return !cat||i.category===cat;});
        if(limit)list=list.slice(0,limit);
        box.innerHTML=list.length?list.map(item).join(''):'<p class="muted">Aucune actualité dans cette catégorie pour le moment.</p>';
        reveal(box);
      }
      if(f){
        var cats=[];items.forEach(function(i){if(cats.indexOf(i.category)<0)cats.push(i.category);});
        f.innerHTML='<button type="button" aria-pressed="true" data-cat="">Tout</button>'+cats.map(function(c){return '<button type="button" aria-pressed="false" data-cat="'+esc(c)+'">'+esc(c)+'</button>';}).join('');
        f.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;
          f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===t);});render(t.getAttribute('data-cat'));});
      }
      render('');
    }).catch(function(){box.innerHTML='<p class="muted">Impossible de charger les actualités pour le moment.</p>';});
  }

  // ---------- Sommaire actif ----------
  var toc=document.querySelectorAll('.toc a[href^="#"]');
  if(toc.length&&'IntersectionObserver' in window){
    var map={};toc.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
    var tio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.forEach(function(a){a.classList.remove('on');});var a=map[e.target.id];if(a)a.classList.add('on');}});},{rootMargin:'-20% 0px -70% 0px'});
    Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el)tio.observe(el);});
  }

  // ---------- Fiche ciblée par l'ancre ----------
  if(location.hash){var d=document.querySelector(location.hash);if(d&&d.tagName==='DETAILS')d.open=true;}

  reveal(); tilt();
})();
