/* Assistant de vol SMUH — scripts communs : menu mobile, chargement des actualités, sommaire actif. */
(function(){
  // Menu mobile
  var b=document.querySelector('.burger'),n=document.querySelector('.nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);});}

  // Année du pied de page
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});

  // Couleurs par catégorie d'actu
  var COL={"Bases":"var(--green)","Hélistations":"var(--cyan)","Réglementation":"var(--amber)","Réforme des secours":"var(--pink)","Convention collective":"var(--violet)","Sécurité des vols":"var(--amber)","Exploitants":"var(--cyan)","Matériel":"var(--green)","Métier":"var(--violet)"};
  var MOIS=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fmtLong(d){var p=d.split('-');return (+p[2])+' '+MOIS[+p[1]-1]+' '+p[0];}
  function item(it){
    var p=it.date.split('-'),c=COL[it.category]||'var(--violet)';
    return '<article class="news-item">'+
      '<div class="news-date"><b>'+(+p[2])+' '+MOIS[+p[1]-1]+'</b>'+p[0]+'</div>'+
      '<div class="news-body">'+
        '<div class="news-meta"><span class="tag" style="--tc:'+c+'">'+esc(it.category)+'</span><span>'+esc(it.source)+'</span></div>'+
        '<h3><a href="'+esc(it.url)+'" target="_blank" rel="noopener">'+esc(it.title)+' ↗</a></h3>'+
        '<p>'+esc(it.summary)+'</p>'+
      '</div></article>';
  }

  var box=document.querySelector('[data-news]');
  if(box){
    var limit=+box.getAttribute('data-limit')||0;
    var src=box.getAttribute('data-src');
    fetch(src,{cache:'no-cache'}).then(function(r){return r.json();}).then(function(data){
      var items=(data.items||[]).slice().sort(function(a,b){return a.date<b.date?1:-1;});
      var up=document.querySelector('[data-news-updated]');
      if(up&&data.updated)up.textContent='Mis à jour le '+fmtLong(data.updated);
      var f=document.querySelector('[data-news-filters]');
      function render(cat){
        var list=items.filter(function(i){return !cat||i.category===cat;});
        if(limit)list=list.slice(0,limit);
        box.innerHTML=list.length?list.map(item).join(''):'<p class="muted">Aucune actualité dans cette catégorie pour le moment.</p>';
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

  // Sommaire : surligne la section visible
  var toc=document.querySelectorAll('.toc a[href^="#"]');
  if(toc.length&&'IntersectionObserver' in window){
    var map={};toc.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.forEach(function(a){a.classList.remove('on');});var a=map[e.target.id];if(a)a.classList.add('on');}});},{rootMargin:'-20% 0px -70% 0px'});
    Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el);});
  }

  // Ouvre la fiche ciblée par l'ancre
  if(location.hash){var d=document.querySelector(location.hash);if(d&&d.tagName==='DETAILS')d.open=true;}
})();
