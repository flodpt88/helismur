/* Accueil : frise horizontale épinglée et parallaxe de la photo (GSAP + ScrollTrigger). */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero=document.querySelector('.hero3d');
  // Si la 3D ne démarre pas (ou en mode mouvement réduit), on révèle quand même le titre
  setTimeout(function(){ if(hero && !hero.classList.contains('is-ready')) hero.classList.add('is-ready'); }, 2200);

  if(!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  var mm=gsap.matchMedia();
  mm.add('(min-width: 761px)', function(){
    var sec=document.querySelector('.frise'), track=document.querySelector('.frise-track'), line=document.querySelector('.frise-line');
    if(sec && track){
      var dist=function(){ return Math.max(0, track.scrollWidth - innerWidth); };
      var tween=gsap.to(track,{ x:function(){ return -dist(); }, ease:'none',
        scrollTrigger:{ trigger:sec, start:'top top', end:function(){ return '+='+dist(); }, pin:true, scrub:.8, invalidateOnRefresh:true,
          onUpdate:function(s){ if(line) line.style.setProperty('--p',(s.progress*100)+'%'); } } });
      gsap.utils.toArray('.step').forEach(function(st,i){
        if(i<2) return;
        gsap.from(st,{ y:70, rotate:i%2?4:-4, opacity:.15, ease:'power3.out',
          scrollTrigger:{ trigger:st, containerAnimation:tween, start:'left 98%', end:'left 70%', scrub:true } });
      });
    }
  });
  mm.add('(max-width: 760px)', function(){
    var track=document.querySelector('.frise-track'), line=document.querySelector('.frise-line');
    if(track&&line) track.addEventListener('scroll',function(){ line.style.setProperty('--p',(track.scrollLeft/(track.scrollWidth-track.clientWidth)*100)+'%'); },{passive:true});
  });

  // Parallaxe photo
  var img=document.querySelector('.siege-photo img');
  if(img) gsap.fromTo(img,{ yPercent:-8 },{ yPercent:8, ease:'none', scrollTrigger:{ trigger:'.siege-photo', start:'top bottom', end:'bottom top', scrub:true } });

})();
