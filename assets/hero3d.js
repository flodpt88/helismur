/* Scène 3D de l'accueil : un hélicoptère du SAMU en vol de nuit au-dessus d'un relief néon.
   Three.js + bloom. Tout est construit en code (aucun modèle à télécharger). */
import * as THREE from 'three';
import { EffectComposer } from './vendor/addons/EffectComposer.js';
import { RenderPass } from './vendor/addons/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/OutputPass.js';

const hero = document.querySelector('.hero3d');
const canvas = document.getElementById('scene3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fail(){ document.documentElement.classList.add('no-webgl'); }

function init(){
  if(!hero || !canvas) return;
  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
  }catch(e){ fail(); return; }
  if(!renderer.getContext()){ fail(); return; }

  const small = () => innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small() ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .85;

  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#2a0f4a');

  // ---------- Ciel ----------
  const sky = document.createElement('canvas'); sky.width = 4; sky.height = 512;
  const sg = sky.getContext('2d'), grd = sg.createLinearGradient(0,0,0,512);
  grd.addColorStop(0,'#05041a'); grd.addColorStop(.45,'#160b3c'); grd.addColorStop(.72,'#3d1660'); grd.addColorStop(1,'#7a2366');
  sg.fillStyle = grd; sg.fillRect(0,0,4,512);
  const skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);
  camera.position.set(0, 3.1, 11);

  // ---------- Étoiles ----------
  {
    const n = 1400, pos = new Float32Array(n*3);
    for(let i=0;i<n;i++){
      const th = Math.random()*Math.PI*2, ph = Math.random()*Math.PI*0.42, r = 160;
      pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.cos(ph)*0.55+8; pos[i*3+2] = -Math.abs(r*Math.sin(ph)*Math.sin(th))-20;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color:0xdcd6ff, size:0.55, sizeAttenuation:true, fog:false, transparent:true, opacity:.85 })));
  }

  // ---------- Soleil rayé ----------
  const sunMat = new THREE.ShaderMaterial({
    uniforms:{ uTime:{value:0} }, fog:false, transparent:true, depthWrite:false,
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec2 vUv; uniform float uTime;
      void main(){ vec2 p=vUv*2.-1.; float r=length(p);
        float glow=smoothstep(1.,.0,r);
        if(r>.62){ gl_FragColor=vec4(vec3(1.,.25,.55)*glow*glow*.55, glow*glow*.55); return; }
        float y=p.y/.62;
        vec3 c=mix(vec3(1.,.18,.5),vec3(1.,.86,.42),smoothstep(-.9,.8,y));
        if(y<.25){ float s=fract((y-uTime*.04)*7.); float w=mix(.04,.55,smoothstep(.25,-1.,y)); if(s<w){ gl_FragColor=vec4(0.); return; } }
        gl_FragColor=vec4(c*.82,1.); }`
  });
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(64,64), sunMat);
  sun.position.set(15, 9, -95); scene.add(sun);

  // ---------- Relief néon (défile à l'infini, calculé sur le GPU) ----------
  const W = 90, L = 130;
  const tGeo = new THREE.PlaneGeometry(W, L, small()?90:150, small()?130:210); tGeo.rotateX(-Math.PI/2); tGeo.translate(0,0,-L/2+22);
  const terrainMat = new THREE.ShaderMaterial({
    uniforms:{ uOff:{value:0}, uFog:{value:FOG}, uLight:{value:new THREE.Vector2(0,0)}, uLightI:{value:0}, uNear:{value:14.}, uFar:{value:88.} },
    extensions:{ derivatives:true },
    vertexShader:`
      uniform float uOff; varying vec2 vG; varying float vH; varying float vD; varying vec2 vW;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
      float height(vec2 p){
        float side=smoothstep(6.,24.,abs(p.x));
        float ridge=1.-abs(fbm(p*.055)*2.-1.);
        return ridge*ridge*12.*side + fbm(p*.3)*.9*side + fbm(p*.5)*.25;
      }
      void main(){
        vec3 p=position; vec2 g=vec2(p.x, p.z-uOff);
        p.y=height(g);
        vG=g; vH=p.y; vW=p.xz;
        vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z;
        gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`
      uniform vec3 uFog; uniform vec2 uLight; uniform float uLightI; uniform float uNear; uniform float uFar;
      varying vec2 vG; varying float vH; varying float vD; varying vec2 vW;
      void main(){
        vec2 g=vG/1.6;
        vec2 d=abs(fract(g-.5)-.5)/fwidth(g);
        float line=1.-min(min(d.x,d.y),1.);
        vec3 lo=vec3(.18,.85,1.); vec3 hi=vec3(1.,.2,.58);
        vec3 lc=mix(lo,hi,smoothstep(.3,7.,vH));
        vec3 col=mix(vec3(.025,.015,.07),vec3(.09,.02,.14),smoothstep(0.,10.,vH));
        col+=lc*line*.8;
        float ld=length(vW-uLight); col+=vec3(1.,.86,.62)*uLightI*exp(-ld*ld*.3)*.6;
        float f=smoothstep(uNear,uFar,vD); col=mix(col,uFog,f);
        gl_FragColor=vec4(col,1.); }`
  });
  const terrain = new THREE.Mesh(tGeo, terrainMat); scene.add(terrain);

  // ---------- Lumières ----------
  scene.add(new THREE.HemisphereLight(0x8f6bff, 0x12062a, 1.1));
  const key = new THREE.DirectionalLight(0xbfe9ff, 2.2); key.position.set(-5, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff5c9d, 3.2); rim.position.set(2, 4, -12); scene.add(rim);

  // ---------- L'hélicoptère ----------
  const heli = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color:0xf4f2ff, metalness:.35, roughness:.32 });
  const dark = new THREE.MeshStandardMaterial({ color:0x1b1838, metalness:.6, roughness:.4 });
  const pink = new THREE.MeshStandardMaterial({ color:0xff3d8b, emissive:0xff3d8b, emissiveIntensity:.35, metalness:.2, roughness:.4 });
  const glass = new THREE.MeshStandardMaterial({ color:0x0a1830, emissive:0x3ee3ff, emissiveIntensity:.16, metalness:.95, roughness:.06 });
  const add = (geo, mat, x=0,y=0,z=0, sx=1,sy=1,sz=1, parent=heli) => { const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); parent.add(m); return m; };

  add(new THREE.SphereGeometry(1,48,32), body, 0,0,0, 2.05,.95,.97);                 // fuselage
  add(new THREE.SphereGeometry(1,48,32), glass, 1.12,.2,0, 1.0,.7,.86);            // verrière
  add(new THREE.CapsuleGeometry(.42,1.5,8,24), body, -.25,.86,0, 1,1,1.05).rotation.z=Math.PI/2; // capot moteur
  add(new THREE.SphereGeometry(1,40,24), pink, -.1,-.42,0, 1.75,.38,1.04);           // bandeau rose bas
  add(new THREE.CylinderGeometry(.09,.12,.5,16), dark, -.1,1.3,0);                   // mât
  const boom = add(new THREE.CylinderGeometry(.13,.34,3.7,24), body, -2.95,.32,0); boom.rotation.z=Math.PI/2+.04;
  const fin = add(new THREE.BoxGeometry(.9,1.25,.09), body, -4.75,.85,0); fin.rotation.z=-.28;
  add(new THREE.BoxGeometry(.6,.06,1.3), body, -4.1,.38,0);                          // stabilisateur
  add(new THREE.BoxGeometry(.18,.08,.08), pink, -4.1,.38,.68); add(new THREE.BoxGeometry(.18,.08,.08), pink, -4.1,.38,-.68);
  const fen = add(new THREE.TorusGeometry(.34,.1,12,32), body, -4.82,.6,0);         // fenestron
  const fenBlades = new THREE.Group(); fenBlades.position.set(-4.82,.6,0); heli.add(fenBlades);
  for(let i=0;i<8;i++){ const b=add(new THREE.BoxGeometry(.04,.6,.03), dark, 0,0,0, 1,1,1, fenBlades); b.rotation.z=i*Math.PI/8; }

  // Croix sur les portes
  {
    const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    x.fillStyle='#ffffff'; x.beginPath(); x.roundRect(8,8,112,112,18); x.fill();
    x.fillStyle='#ff3d8b'; x.fillRect(48,22,32,84); x.fillRect(22,48,84,32);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.MeshStandardMaterial({ map:t, transparent:true, roughness:.4, emissive:0xff3d8b, emissiveMap:t, emissiveIntensity:.25 });
    add(new THREE.PlaneGeometry(.55,.55), m, -.35,.18,1.035);
    const back=add(new THREE.PlaneGeometry(.55,.55), m, -.35,.18,-1.035); back.rotation.y=Math.PI;
  }

  // Patins
  for(const z of [-.78,.78]){
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(1.75,-1.02,z),new THREE.Vector3(1.4,-1.18,z),new THREE.Vector3(-1.6,-1.18,z)]);
    add(new THREE.TubeGeometry(curve,24,.055,8,false), dark);
    for(const x of [.75,-.85]){ const s=add(new THREE.CylinderGeometry(.04,.04,.55,8), dark, x,-.92,z*.82); s.rotation.x = z>0 ? -.45 : .45; }
  }

  // Rotor principal + disque de flou
  const rotor = new THREE.Group(); rotor.position.set(-.1,1.56,0); heli.add(rotor);
  add(new THREE.CylinderGeometry(.22,.22,.16,20), dark, 0,0,0, 1,1,1, rotor);
  for(let i=0;i<4;i++){ const g=new THREE.BoxGeometry(2.65,.035,.2); g.translate(1.4,0,0); const b=add(g, dark, 0,0,0, 1,1,1, rotor); b.rotation.y=i*Math.PI/2; }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.7,72), new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
    uniforms:{ uTime:{value:0} },
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec2 vUv; uniform float uTime; void main(){ vec2 p=vUv*2.-1.; float r=length(p); float a=atan(p.y,p.x);
      float sweep=pow(.5+.5*cos(a*4.-uTime*38.),6.);
      float edge=smoothstep(1.,.93,r)*smoothstep(.06,.2,r);
      float ring=smoothstep(.02,0.,abs(r-.97));
      gl_FragColor=vec4(vec3(.85,.8,1.)*(edge*(.05+.12*sweep))+vec3(1.,.3,.6)*ring*.5, 1.); }`
  }));
  disc.rotation.x=-Math.PI/2; disc.position.set(-.1,1.58,0); heli.add(disc);

  // Feux de navigation et gyrophare
  const navR = add(new THREE.SphereGeometry(.07,12,12), new THREE.MeshBasicMaterial({color:0xff2a4a}), .2,-.05,-1.02);
  const navG = add(new THREE.SphereGeometry(.07,12,12), new THREE.MeshBasicMaterial({color:0x2aff9a}), .2,-.05, 1.02);
  const beaconMat = new THREE.MeshBasicMaterial({ color:0xff3d8b });
  const beacon = add(new THREE.SphereGeometry(.09,12,12), beaconMat, -.9,1.12,0);
  const strobeMat = new THREE.MeshBasicMaterial({ color:0xffffff });
  const strobe = add(new THREE.SphereGeometry(.07,12,12), strobeMat, -4.98,1.42,0);

  // Phare de recherche : faisceau en cône
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.1,8,40,1,true), new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec2 vUv; void main(){ float a=smoothstep(0.,1.,vUv.y)*.1; gl_FragColor=vec4(vec3(1.,.9,.7)*a,1.); }`
  }));
  beam.geometry.translate(0,-4,0);
  const beamPivot = new THREE.Group(); beamPivot.position.set(1.3,-.75,0); beamPivot.rotation.z=.42; beamPivot.add(beam); heli.add(beamPivot);
  add(new THREE.SphereGeometry(.12,16,16), new THREE.MeshBasicMaterial({color:0xfff1c9}), 1.3,-.78,0);

  heli.traverse(o=>{ if(o.isMesh && o.geometry.attributes.normal===undefined) o.geometry.computeVertexNormals(); });
  const rig = new THREE.Group(); rig.add(heli); scene.add(rig);

  // ---------- Post-traitement ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512,512), small()?.45:.6, .5, .7);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- Mise en page ----------
  const layout = { x:0, y:0, z:0, s:1 };
  function resize(){
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w/h; camera.updateProjectionMatrix();
    if(w < 760){ Object.assign(layout,{ x:-.9, y:5.7, z:-2.5, s:.5 }); camera.fov=60; }
    else if(w < 1100){ Object.assign(layout,{ x:2.6, y:3.6, z:0, s:.78 }); camera.fov=48; }
    else { Object.assign(layout,{ x:3.1, y:3.5, z:.2, s:.78 }); camera.fov=46; }
    camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  // ---------- Interactions ----------
  const mouse = { x:0, y:0, tx:0, ty:0 };
  addEventListener('pointermove', e=>{ mouse.tx = e.clientX/innerWidth*2-1; mouse.ty = e.clientY/innerHeight*2-1; }, { passive:true });
  let scrollP = 0;
  const onScroll = () => { scrollP = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight*.9))); };
  onScroll(); addEventListener('scroll', onScroll, { passive:true });

  // HUD
  const hud = { alt:document.getElementById('hudAlt'), hdg:document.getElementById('hudHdg'), ias:document.getElementById('hudIas') };
  let hudT = 0;

  // ---------- Boucle ----------
  const clock = new THREE.Clock();
  let running = true, looping = false, t = 0, first = true;
  const start = () => { if(looping || reduce) return; looping = true; clock.getDelta(); requestAnimationFrame(loop); };
  const io = new IntersectionObserver(es=>{ running = es[0].isIntersecting; if(running) start(); }, { threshold:0 });
  io.observe(hero);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && running) start(); });

  const tmp = new THREE.Vector3();
  function frame(dt){
    t += dt;
    mouse.x += (mouse.tx-mouse.x)*Math.min(1,dt*3); mouse.y += (mouse.ty-mouse.y)*Math.min(1,dt*3);

    terrainMat.uniforms.uOff.value += dt*7.5;
    sunMat.uniforms.uTime.value = t;
    disc.material.uniforms.uTime.value = t;
    rotor.rotation.y += dt*26; fenBlades.rotation.z += dt*40;

    // Vol : léger tangage, roulis à la souris, montée au scroll
    const bob = Math.sin(t*1.3)*.16 + Math.sin(t*.7)*.08;
    rig.position.set(layout.x + mouse.x*.6 - scrollP*1.5, layout.y + bob + scrollP*2.6, layout.z - scrollP*5);
    rig.scale.setScalar(layout.s);
    rig.rotation.y = -2.78 + mouse.x*.3 + scrollP*.9;     // nez vers le fond, trois-quarts avant
    heli.rotation.z = -.14 - mouse.y*.08 + Math.sin(t*.9)*.03; // nez légèrement bas (vol en avant)
    heli.rotation.x = -mouse.x*.22 + Math.sin(t*.6)*.04;   // inclinaison latérale

    camera.position.x += (mouse.x*.9 - camera.position.x)*Math.min(1,dt*2);
    camera.position.y += ((3.1 - mouse.y*.5 + scrollP*1.2) - camera.position.y)*Math.min(1,dt*2);
    camera.lookAt(0, 2.6 + scrollP*1.5, -2);

    // Feux
    beaconMat.color.setHex(Math.sin(t*6.5)>.55 ? 0xff3d8b : 0x330614);
    strobeMat.color.setHex((t%1.4)<.06 ? 0xffffff : 0x222233);
    navR.visible = navG.visible = true;

    // Tache de lumière au sol sous le phare
    beam.getWorldPosition(tmp); beamPivot.localToWorld(tmp.set(0,-6,0));
    terrainMat.uniforms.uLight.value.set(tmp.x, tmp.z);
    terrainMat.uniforms.uLightI.value = .55;

    composer.render(dt);

    hudT += dt;
    if(hudT > .25 && hud.alt){ hudT = 0;
      hud.alt.textContent = String(Math.round(1480 + bob*120 + scrollP*900)).padStart(4,'0');
      hud.hdg.textContent = String(Math.round(((268 + mouse.x*14) % 360 + 360) % 360)).padStart(3,'0');
      hud.ias.textContent = String(Math.round(132 + Math.sin(t*.5)*3));
    }
    if(first){ first = false; hero.classList.add('is-ready'); }
  }
  function loop(){
    if(!running || document.hidden){ looping = false; return; }
    frame(Math.min(clock.getDelta(), .05));
    requestAnimationFrame(loop);
  }
  if(reduce){ frame(.016); addEventListener('resize', ()=>frame(0)); }
  else start();
}

try{ init(); }catch(e){ console.error(e); fail(); }
