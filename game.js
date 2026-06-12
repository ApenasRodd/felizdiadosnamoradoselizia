/* =========================================================
   ATÉ VOCÊ — Endless Runner Romântico
   Rodrigo ❤️ Elizia · 04/04/2025
   ========================================================= */
(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 800, H = 300; // logical resolution
let scale = 1, offX = 0, offY = 0;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = window.innerWidth, ch = window.innerHeight;
  scale = Math.min(cw / W, ch / H);
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  offX = (cw - W * scale) / 2;
  offY = (ch - H * scale) / 2;
}
window.addEventListener('resize', resize);
resize();

/* ---------- SAVE ---------- */
const SAVE_KEY = 'ateVoce.save.v1';
const save = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
function persist() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
save.muted = save.muted ?? false;
save.maxPhase = save.maxPhase ?? 0;
save.albumUnlocked = save.albumUnlocked ?? false;

/* ---------- AUDIO (Web Audio API procedural) ---------- */
let audioCtx = null, masterGain = null, currentMusic = null;
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = save.muted ? 0 : 0.35;
    masterGain.connect(audioCtx.destination);
  } catch (e) {}
}
function setMuted(m) {
  save.muted = m; persist();
  if (masterGain) masterGain.gain.setTargetAtTime(m ? 0 : 0.35, audioCtx.currentTime, 0.1);
  document.getElementById('muteBtn').textContent = m ? '🔇' : '🔊';
}
document.getElementById('muteBtn').addEventListener('click', (e) => {
  e.stopPropagation(); initAudio(); setMuted(!save.muted);
});
document.getElementById('muteBtn').textContent = save.muted ? '🔇' : '🔊';

function sfx(freq, dur = 0.1, type = 'sine', vol = 0.2) {
  if (!audioCtx || save.muted) return;
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(masterGain); o.start(); o.stop(audioCtx.currentTime + dur);
}

// Music: simple looping arpeggio per phase
function stopMusic() {
  if (currentMusic) { try { currentMusic.stop(); } catch(e){} currentMusic = null; }
}
function playMusic(notes, tempo = 0.35, type = 'triangle', vol = 0.12) {
  stopMusic();
  if (!audioCtx) return;
  const startTime = audioCtx.currentTime + 0.05;
  const g = audioCtx.createGain();
  g.gain.value = vol;
  g.connect(masterGain);
  let i = 0;
  const totalLen = notes.length * tempo;
  function schedule() {
    if (!currentMusic) return;
    const t = startTime + i * tempo;
    const n = notes[i % notes.length];
    if (n > 0) {
      const o = audioCtx.createOscillator();
      o.type = type; o.frequency.value = n;
      const ng = audioCtx.createGain();
      ng.gain.setValueAtTime(0, t);
      ng.gain.linearRampToValueAtTime(1, t + 0.02);
      ng.gain.exponentialRampToValueAtTime(0.001, t + tempo * 0.9);
      o.connect(ng); ng.connect(g);
      o.start(t); o.stop(t + tempo);
    }
    i++;
    setTimeout(schedule, tempo * 1000);
  }
  currentMusic = { stop() { try { g.disconnect(); } catch(e){} } };
  schedule();
}

// Note frequencies
const N = { C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,
  C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,
  C6:1046.5, A3:220, E3:164.81, G3:196, F3:174.61, D3:146.83, Bb4:466.16, Eb4:311.13 };

const PHASE_MUSIC = [
  // 1 - O Começo (alegre, ensolarado) C major
  { notes:[N.C5,N.E5,N.G5,N.E5,N.A4,N.C5,N.E5,N.C5,N.F4,N.A4,N.C5,N.A4,N.G4,N.B4,N.D5,N.B4], tempo:0.28, type:'triangle' },
  // 2 - Namoro (mágico, noturno) A minor lush
  { notes:[N.A4,N.C5,N.E5,N.A5,N.G5,N.E5,N.C5,N.A4,N.F4,N.A4,N.C5,N.F5,N.E5,N.C5,N.A4,N.E4], tempo:0.32, type:'sine' },
  // 3 - Noivado (chuva, sacrifício) D minor
  { notes:[N.D4,N.F4,N.A4,N.D5,N.C5,N.A4,N.F4,N.D4,N.Bb4,N.D4,N.F4,N.Bb4,N.A4,N.F4,N.D4,N.A3], tempo:0.36, type:'sine' },
  // 4 - Casamento (celestial) C major hymn
  { notes:[N.G4,N.C5,N.E5,N.G5,N.E5,N.C5,N.F4,N.A4,N.C5,N.F5,N.C5,N.A4,N.E4,N.G4,N.C5,N.G4], tempo:0.4, type:'triangle' },
  // 5 - Lua de Mel (festiva) G major
  { notes:[N.G4,N.B4,N.D5,N.G5,N.D5,N.B4,N.C5,N.E5,N.G5,N.E5,N.A4,N.C5,N.E5,N.D5,N.B4,N.G4], tempo:0.26, type:'square' },
  // Epílogo (todos juntos, paz) C major peaceful
  { notes:[N.C5,N.E5,N.G5,N.C6,N.G5,N.E5,N.A4,N.C5,N.E5,N.A5,N.E5,N.C5,N.F4,N.A4,N.C5,N.F5], tempo:0.5, type:'sine' }
];

/* ---------- INPUT ---------- */
const input = { jump: false, pressed: false };
function press() {
  initAudio();
  input.pressed = true;
  scene.input?.();
}
function release() { input.pressed = false; }
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
    e.preventDefault(); press();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') release();
});
canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

/* ---------- DRAW HELPERS ---------- */
function clear(color) { ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio||1), canvas.height / (window.devicePixelRatio||1)); }
function withGameTransform(fn) {
  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(scale, scale);
  ctx.beginPath(); ctx.rect(0,0,W,H); ctx.clip();
  fn();
  ctx.restore();
}
function px(x,y,w,h,c) { ctx.fillStyle=c; ctx.fillRect(x|0,y|0,w|0,h|0); }
function text(str, x, y, size=14, color='#fff', align='left', font='Georgia, serif') {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(str, x, y);
}
function textWrap(str, x, y, maxW, size, color, align='center', lineH=null) {
  ctx.font = `${size}px Georgia, serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
  const words = str.split(' '); let line = '', yy = y;
  const lh = lineH || size * 1.35;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy); line = words[i]; yy += lh;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
  return yy + lh;
}

/* =========================================================
   SCENE MANAGER
   ========================================================= */
let scene = null;
let nextScene = null;
let fadeAlpha = 0, fadeTarget = 0, fadeDir = 0, fadeCb = null;
function setScene(s) { scene = s; scene.init?.(); }
function fadeTo(next, dur = 0.6) {
  fadeDir = 1; fadeTarget = 1;
  fadeCb = () => {
    setScene(next);
    fadeDir = -1; fadeTarget = 0;
    fadeCb = null;
  };
  fadeDuration = dur;
}
let fadeDuration = 0.6;

/* =========================================================
   ART — Pixel sprites & illustrations (procedural)
   ========================================================= */

// Rodrigo skin tone, hair etc.
const SKIN='#f1c9a5', SKIN_D='#c89576', HAIR='#3a2418', SHIRT_1='#3a6ea5', PANTS='#2b2b2b', SHOE='#1a1a1a';

function drawRodrigo(x, y, variant, t) {
  // y = ground line for feet
  const bob = Math.floor(Math.sin(t*16)*1); // running bob
  const yy = y - 36 + bob;
  ctx.save();
  if (variant === 'skate') {
    // Skateboard
    px(x-14, y-2, 28, 3, '#5a3a1f');
    px(x-12, y+1, 4, 3, '#888');
    px(x+8, y+1, 4, 3, '#888');
    // Legs slightly bent
    px(x-4, yy+18, 4, 12, PANTS);
    px(x+1, yy+18, 4, 12, PANTS);
    px(x-5, yy+30, 6, 3, SHOE);
    px(x+1, yy+30, 6, 3, SHOE);
    // Body
    px(x-6, yy+8, 12, 12, '#e8b53a');
    // Arms
    px(x-9, yy+10, 3, 9, '#e8b53a');
    px(x+7, yy+10, 3, 9, '#e8b53a');
    px(x-9, yy+18, 3, 3, SKIN);
    px(x+7, yy+18, 3, 3, SKIN);
    // Head
    px(x-4, yy, 8, 8, SKIN);
    px(x-4, yy, 8, 3, HAIR);
    px(x-2, yy+4, 1, 1, '#000');
    px(x+1, yy+4, 1, 1, '#000');
  } else if (variant === 'moto') {
    // Motorcycle body
    px(x-16, y-6, 32, 6, '#222');
    px(x-14, y-10, 8, 4, '#c0392b'); // tank
    px(x-18, y-2, 6, 6, '#111'); // wheel
    px(x+12, y-2, 6, 6, '#111');
    px(x-16, y-1, 2, 4, '#666');
    px(x+14, y-1, 2, 4, '#666');
    // Rider on moto - leaning slightly
    const ry = y - 26;
    px(x-3, ry+8, 10, 10, '#1a1a2a'); // jacket
    px(x-2, ry+18, 4, 4, PANTS);
    px(x+2, ry+18, 4, 4, PANTS);
    px(x-2, ry, 8, 8, SKIN); // head
    px(x-2, ry, 8, 4, '#000'); // helmet top
    px(x-2, ry+3, 8, 2, '#3aa0ff'); // visor
    // Headlight glow
    px(x+14, y-8, 3, 3, '#ffe88a');
  } else if (variant === 'groom') {
    px(x-4, yy+18, 4, 12, '#fff');
    px(x+1, yy+18, 4, 12, '#fff');
    px(x-5, yy+30, 6, 3, '#222');
    px(x+1, yy+30, 6, 3, '#222');
    px(x-6, yy+8, 12, 12, '#1a1a2a'); // suit
    px(x-1, yy+9, 2, 8, '#fff'); // shirt
    px(x-9, yy+10, 3, 9, '#1a1a2a');
    px(x+7, yy+10, 3, 9, '#1a1a2a');
    px(x-4, yy, 8, 8, SKIN);
    px(x-4, yy, 8, 3, HAIR);
    px(x-2, yy+4, 1, 1, '#000');
    px(x+1, yy+4, 1, 1, '#000');
  } else if (variant === 'casual') {
    px(x-4, yy+18, 4, 12, '#6b4423');
    px(x+1, yy+18, 4, 12, '#6b4423');
    px(x-5, yy+30, 6, 3, SHOE);
    px(x+1, yy+30, 6, 3, SHOE);
    px(x-6, yy+8, 12, 12, '#c0392b');
    px(x-9, yy+10, 3, 9, '#c0392b');
    px(x+7, yy+10, 3, 9, '#c0392b');
    px(x-9, yy+18, 3, 3, SKIN);
    px(x+7, yy+18, 3, 3, SKIN);
    px(x-4, yy, 8, 8, SKIN);
    px(x-4, yy, 8, 3, HAIR);
    px(x-2, yy+4, 1, 1, '#000');
    px(x+1, yy+4, 1, 1, '#000');
  } else { // default running
    const swing = Math.sin(t*16);
    const ly = swing > 0 ? 12 : 10;
    const ry2 = swing > 0 ? 10 : 12;
    px(x-4, yy+18, 4, ly, PANTS);
    px(x+1, yy+18, 4, ry2, PANTS);
    px(x-5, yy+18+ly, 6, 3, SHOE);
    px(x+1, yy+18+ry2, 6, 3, SHOE);
    px(x-6, yy+8, 12, 12, SHIRT_1);
    px(x-9, yy+10, 3, 9, SHIRT_1);
    px(x+7, yy+10, 3, 9, SHIRT_1);
    px(x-9, yy+18, 3, 3, SKIN);
    px(x+7, yy+18, 3, 3, SKIN);
    px(x-4, yy, 8, 8, SKIN);
    px(x-4, yy, 8, 3, HAIR);
    px(x-2, yy+4, 1, 1, '#000');
    px(x+1, yy+4, 1, 1, '#000');
  }
  ctx.restore();
}

function drawElizia(x, y, variant) {
  const yy = y - 36;
  if (variant === 'bride') {
    // wedding dress
    px(x-8, yy+20, 16, 14, '#fff');
    px(x-10, yy+28, 20, 6, '#fff');
    px(x-5, yy+10, 10, 12, '#fff');
    px(x-8, yy+11, 3, 8, '#fff');
    px(x+5, yy+11, 3, 8, '#fff');
    px(x-4, yy+2, 8, 8, SKIN);
    px(x-5, yy, 10, 4, '#5a3a24'); // hair / veil dark
    px(x-7, yy+3, 14, 8, 'rgba(255,255,255,0.5)'); // veil
    px(x-2, yy+5, 1, 1, '#000'); px(x+1, yy+5, 1, 1, '#000');
    px(x-1, yy+7, 2, 1, '#c44'); // smile
  } else {
    // dress (peach/rose), long hair
    const dressC = variant === 'evening' ? '#a64ca6' : (variant === 'gramado' ? '#b03030' : '#f08aaa');
    px(x-6, yy+18, 12, 16, dressC);
    px(x-8, yy+26, 16, 8, dressC);
    px(x-5, yy+10, 10, 10, dressC);
    px(x-8, yy+11, 3, 8, dressC);
    px(x+5, yy+11, 3, 8, dressC);
    px(x-8, yy+18, 3, 3, SKIN);
    px(x+5, yy+18, 3, 3, SKIN);
    px(x-4, yy+2, 8, 8, SKIN);
    px(x-5, yy, 10, 5, '#5a3a24'); // hair
    px(x-6, yy+4, 2, 8, '#5a3a24');
    px(x+4, yy+4, 2, 8, '#5a3a24');
    px(x-2, yy+5, 1, 1, '#000'); px(x+1, yy+5, 1, 1, '#000');
    px(x-1, yy+7, 2, 1, '#c44');
  }
}

function drawRico(x, y, t) { // pinscher caramelo
  const bob = Math.floor(Math.sin(t*20)*1);
  const yy = y - 10 + bob;
  px(x-7, yy, 14, 6, '#c8884a'); // body
  px(x+5, yy-3, 5, 5, '#c8884a'); // head
  px(x+8, yy-5, 2, 3, '#c8884a'); // ears
  px(x+9, yy-1, 1, 1, '#000'); // eye
  px(x-9, yy+1, 2, 4, '#c8884a'); // tail back
  // legs
  const sw = Math.sin(t*20)>0?1:0;
  px(x-5, yy+6, 2, 3+sw, '#a06a30');
  px(x+3, yy+6, 2, 3+(1-sw), '#a06a30');
}

function drawKiara(x, y, t) { // boxer branca + manchas marrons
  const bob = Math.floor(Math.sin(t*18)*1);
  const yy = y - 14 + bob;
  px(x-10, yy, 20, 9, '#fff'); // body
  px(x-2, yy+1, 6, 4, '#8b5a2b'); // mancha redonda nas costas
  px(x+8, yy-4, 7, 7, '#fff'); // head
  px(x+8, yy-2, 3, 3, '#8b5a2b'); // mancha em um olho
  px(x+12, yy-6, 2, 3, '#fff'); // orelha
  px(x+13, yy-1, 1, 1, '#000');
  // legs
  const sw = Math.sin(t*18)>0?1:0;
  px(x-7, yy+9, 2, 4+sw, '#fff');
  px(x-3, yy+9, 2, 4+(1-sw), '#fff');
  px(x+3, yy+9, 2, 4+sw, '#fff');
  px(x+7, yy+9, 2, 4+(1-sw), '#fff');
}

// Ipê tree (color = flower)
function drawIpe(x, y, color, h=70) {
  px(x-2, y-h, 4, h, '#4a2a18');
  // canopy
  ctx.fillStyle = color;
  for (let i=0;i<24;i++){
    const a = (i/24)*Math.PI*2;
    const r = 14 + (i%3)*3;
    const cx = x + Math.cos(a)*r;
    const cy = y - h + Math.sin(a)*r*0.7;
    ctx.fillRect(cx|0, cy|0, 5, 5);
  }
  ctx.fillRect(x-12, y-h-4, 24, 12);
}

function drawBalloon(x, y, color, str=20) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.arc(x-2, y-2, 2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x, y+8); ctx.lineTo(x+1, y+8+str); ctx.stroke();
}

function drawHeart(x, y, size=8, color='#e94560') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y+size*0.3);
  ctx.bezierCurveTo(x, y, x-size, y, x-size, y+size*0.3);
  ctx.bezierCurveTo(x-size, y+size*0.7, x, y+size*0.9, x, y+size*1.2);
  ctx.bezierCurveTo(x, y+size*0.9, x+size, y+size*0.7, x+size, y+size*0.3);
  ctx.bezierCurveTo(x+size, y, x, y, x, y+size*0.3);
  ctx.fill();
}

/* =========================================================
   PHASE DEFINITIONS
   ========================================================= */
const PHASES = [
  {
    id: 1, name: "O Começo", theme: "Descoberta",
    sky: ['#aee3ff', '#fff2c4'],
    ground: '#e6c460', groundDark: '#c89a30',
    phrase: "Todo mundo parecia enxergar algo entre nós. Só faltava a gente perceber.",
    playerVariant: 'skate',
    obstacles: ['ipe', 'bench', 'trash', 'sign'],
    collectible: 'leaf',
    targetDist: 1800,
    drawBg(t, off) {
      // Sky gradient
      const g = ctx.createLinearGradient(0,0,0,H-40);
      g.addColorStop(0,'#aee3ff'); g.addColorStop(1,'#fff2c4');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H-40);
      // sun
      ctx.fillStyle='#fff5b0';
      ctx.beginPath(); ctx.arc(640, 70, 28, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.arc(640, 70, 40, 0, Math.PI*2); ctx.fill();
      // distant buildings
      const off1 = (off*0.2) % 200;
      for (let i=-1;i<8;i++){
        const x = i*100 - off1;
        px(x, 180, 60, 80, '#c7a8d8');
        px(x+10, 195, 40, 65, '#b894c8');
        for(let w=0;w<3;w++)for(let h=0;h<4;h++) px(x+15+w*12, 205+h*12, 5, 5, '#fff5b0');
      }
      // Ônibus amarelo passa atrás
      const busX = ((-off*0.6) % 900);
      px(busX, 210, 80, 36, '#f5c518');
      px(busX+5, 218, 70, 20, '#7ac6ff'); // janelas
      px(busX+8, 246, 8, 8, '#222'); px(busX+62, 246, 8, 8, '#222');
      // close trees parallax
      const off2 = (off*0.9) % 250;
      for (let i=-1;i<6;i++){
        const x = i*250 - off2 + 50;
        drawIpe(x, 250, ['#ffd83a','#ffffff','#f08fbf','#9c5cc4'][i % 4], 60);
      }
      // birds
      for (let i=0;i<3;i++){
        const bx = ((i*300 - off*0.5) % (W+100)+W+100)%(W+100);
        const by = 50 + i*20 + Math.sin(t+i)*4;
        ctx.strokeStyle = '#333'; ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(bx-4,by); ctx.lineTo(bx,by-3); ctx.lineTo(bx+4,by);
        ctx.stroke();
      }
      // ground
      px(0, H-40, W, 40, '#e6c460');
      px(0, H-40, W, 4, '#c89a30');
      // sidewalk lines
      for (let i=0;i<20;i++){
        const x = (i*60 - (off%60));
        px(x, H-38, 30, 2, '#c89a30');
      }
    },
    drawObstacle(o) {
      const y = H - 40;
      if (o.kind==='ipe') drawIpe(o.x, y, o.color || '#ffd83a', 48);
      else if (o.kind==='bench') { px(o.x-12,y-10,24,3,'#5a3a18'); px(o.x-10,y-7,2,7,'#3a2010'); px(o.x+8,y-7,2,7,'#3a2010'); }
      else if (o.kind==='trash') { px(o.x-6,y-14,12,14,'#3aa050'); px(o.x-7,y-16,14,3,'#2a8040'); }
      else if (o.kind==='sign') { px(o.x-1,y-22,2,22,'#888'); px(o.x-8,y-22,16,8,'#fff'); px(o.x-7,y-20,14,2,'#3a6ea5'); px(o.x-7,y-17,10,2,'#3a6ea5'); }
    },
    drawCollectible(c) { // leaf
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.t);
      ctx.fillStyle = '#7acc4a';
      ctx.beginPath(); ctx.ellipse(0,0,6,3,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    },
    drawDecor(t, off) {
      // falling petals
      for (let i=0;i<12;i++){
        const x = ((i*73 + t*30) % (W+40)) - 20;
        const y = ((i*97 + t*60) % (H-60));
        ctx.fillStyle = ['#ffd83a','#f08fbf','#fff'][i%3];
        ctx.fillRect(x|0, y|0, 3, 3);
      }
    },
    meetX: 600, meetSetup: 'busstop'
  },
  {
    id: 2, name: "O Namoro", theme: "Encantamento",
    sky: ['#1a0a3a', '#4a1a6a'],
    ground: '#1a0a2a', groundDark: '#0a0518',
    phrase: "Vou te amar patodavida. Em cada flor que eu encontrar pelo caminho, continuarei escolhendo você.",
    playerVariant: 'run',
    obstacles: ['garden','bench2','fountain','flowerbed'],
    collectible: 'flower',
    targetDist: 1800,
    drawBg(t, off) {
      const g = ctx.createLinearGradient(0,0,0,H-40);
      g.addColorStop(0,'#1a0a3a'); g.addColorStop(0.6,'#4a1a6a'); g.addColorStop(1,'#8a2a8a');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H-40);
      // stars
      for (let i=0;i<40;i++){
        const x = (i*53)%W; const y = (i*31)%140;
        px(x,y,1+(i%2),1+(i%2),'rgba(255,255,255,'+(0.4+Math.sin(t+i)*0.3)+')');
      }
      // Cidade iluminada
      const off1 = (off*0.3)%180;
      for (let i=-1;i<8;i++){
        const x = i*180 - off1;
        const h = 60 + (i*37)%50;
        px(x, 220-h, 50, h, '#1a0a2a');
        for(let w=0;w<3;w++)for(let r=0;r<6;r++) if((w+r+i)%2) px(x+5+w*15, 225-h+r*10, 6, 5, '#ffd86a');
      }
      // Esplanada - mastros longe
      // Balões subindo (festival)
      for (let i=0;i<14;i++){
        const bx = ((i*97 - off*0.6) % (W+60)+W+60)%(W+60);
        const by = ((H-40) - ((t*30 + i*40) % 240));
        const c = ['#e94560','#ffd86a','#9c5cc4','#3aa0ff','#ff8aa0'][i%5];
        drawBalloon(bx, by, c, 14);
      }
      // fogos discretos
      if (Math.sin(t*0.7+1)>0.6) {
        const fx = 200 + Math.sin(t*0.3)*150, fy = 70;
        for (let k=0;k<10;k++){
          const a = k/10*Math.PI*2;
          px(fx+Math.cos(a)*14, fy+Math.sin(a)*14, 2,2,'#ffd86a');
        }
      }
      // ground
      px(0, H-40, W, 40, '#1a0a2a');
      px(0, H-40, W, 3, '#5a2a7a');
      for (let i=0;i<20;i++){ const x=(i*60-(off%60)); px(x, H-38, 30, 2, '#3a1a5a'); }
    },
    drawObstacle(o) {
      const y = H-40;
      if (o.kind==='garden') { px(o.x-14,y-8,28,8,'#3a2a4a'); px(o.x-12,y-10,24,3,'#7acc4a'); for(let i=0;i<5;i++) drawHeart(o.x-10+i*5, y-14, 3, '#ff8aa0'); }
      else if (o.kind==='bench2') { px(o.x-12,y-10,24,3,'#3a2a5a'); px(o.x-10,y-7,2,7,'#1a0a2a'); px(o.x+8,y-7,2,7,'#1a0a2a'); }
      else if (o.kind==='fountain') { px(o.x-14,y-6,28,6,'#3a3a5a'); px(o.x-6,y-18,12,12,'#5a5a8a'); px(o.x-3,y-22,6,4,'#7aafff'); }
      else if (o.kind==='flowerbed') { px(o.x-10,y-5,20,5,'#3a2a4a'); for(let i=0;i<4;i++){ const fx=o.x-8+i*5; px(fx,y-9,3,3,['#ff8aa0','#ffd86a','#fff','#9c5cc4'][i]); px(fx+1,y-6,1,2,'#3a8a3a'); } }
    },
    drawCollectible(c) { // flor
      ctx.save(); ctx.translate(c.x, c.y);
      const col = ['#ff8aa0','#ffd86a','#fff','#9c5cc4'][(c.i||0)%4];
      for (let i=0;i<5;i++){ const a=i/5*Math.PI*2; px(Math.cos(a)*3-1, Math.sin(a)*3-1, 3,3,col); }
      px(-1,-1,2,2,'#ffd86a');
      ctx.restore();
    },
    drawDecor(t,off) {
      // pequenos corações flutuando
      for (let i=0;i<6;i++){
        const x = ((i*131 - off*0.3) % (W+40)+W+40)%(W+40);
        const y = 100 + Math.sin(t+i)*20 + i*15;
        drawHeart(x, y, 4, 'rgba(255,138,160,0.6)');
      }
    },
    meetX: 600, meetSetup: 'festival'
  },
  {
    id: 3, name: "O Noivado", theme: "Sacrifício",
    sky: ['#050818', '#1a2540'],
    ground: '#181820', groundDark: '#000',
    phrase: "Cada noite fria longe de você era apenas mais um passo na direção do nosso sim.",
    playerVariant: 'moto',
    obstacles: ['pizza','burger','bag','car','puddle'],
    collectible: 'coin',
    targetDist: 2000,
    drawBg(t, off) {
      const g = ctx.createLinearGradient(0,0,0,H-40);
      g.addColorStop(0,'#050818'); g.addColorStop(1,'#1a2540');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H-40);
      // raios distantes
      if (Math.random()<0.005) { ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(0,0,W,H-40); }
      // skyline neon
      const off1 = (off*0.25)%240;
      for (let i=-1;i<6;i++){
        const x=i*240-off1; const h=120+(i*43)%60;
        px(x, 220-h, 80, h, '#0a0f20');
        // neon signs
        const neonC = ['#ff3aa0','#3aaaff','#ffd83a','#aaff3a'][i%4];
        px(x+10, 240-h, 20, 4, neonC);
        for(let r=0;r<6;r++) for(let w=0;w<4;w++) if((w+r+i)%3) px(x+10+w*16, 250-h+r*14, 5, 4, '#fff5a0');
      }
      // chuva
      ctx.strokeStyle='rgba(170,200,255,0.5)'; ctx.lineWidth=1;
      for(let i=0;i<80;i++){
        const x=(i*13 + (t*400))%(W+40);
        const y=((i*29 + t*600)%(H-40));
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-2,y+6); ctx.stroke();
      }
      // ground (asfalto molhado)
      px(0, H-40, W, 40, '#181820');
      px(0, H-40, W, 2, '#3a3a4a');
      // reflexos neon
      for(let i=0;i<W;i+=20){
        const a = 0.1 + Math.sin(t*4+i)*0.05;
        ctx.fillStyle='rgba(255,200,100,'+a+')'; ctx.fillRect(i, H-38, 12, 8);
      }
      // linhas pista
      for(let i=0;i<8;i++){ const x=(i*120-(off*2)%120); px(x, H-22, 40, 3, '#ffd83a'); }
    },
    drawObstacle(o) {
      const y=H-40;
      if (o.kind==='pizza') { ctx.fillStyle='#d44'; ctx.beginPath(); ctx.arc(o.x,y-4,8,0,Math.PI*2); ctx.fill(); px(o.x-6,y-10,12,3,'#a33'); }
      else if (o.kind==='burger') { px(o.x-7,y-5,14,5,'#c8884a'); px(o.x-7,y-9,14,4,'#5a8a3a'); px(o.x-7,y-13,14,4,'#c8884a'); }
      else if (o.kind==='bag') { px(o.x-9,y-16,18,16,'#c0392b'); px(o.x-3,y-20,6,4,'#222'); px(o.x-7,y-12,14,2,'#fff'); }
      else if (o.kind==='car') { px(o.x-20,y-12,40,12,'#444'); px(o.x-14,y-18,28,6,'#666'); px(o.x-16,y-2,6,4,'#111'); px(o.x+10,y-2,6,4,'#111'); px(o.x-12,y-16,8,4,'#7acfff'); px(o.x+4,y-16,8,4,'#7acfff'); }
      else if (o.kind==='puddle') { px(o.x-12,y-2,24,2,'#3a5a8a'); ctx.fillStyle='rgba(170,200,255,0.5)'; ctx.fillRect(o.x-10,y-1,20,1); }
    },
    drawCollectible(c) {
      ctx.fillStyle = '#ffd83a';
      ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff5a0'; ctx.fillRect(c.x-1, c.y-2, 2, 4);
    },
    drawDecor(t,off) {},
    meetX: 600, meetSetup: 'bridge'
  },
  {
    id: 4, name: "O Casamento", theme: "Promessa",
    sky: ['#fff5e0','#aee3ff'],
    ground: '#e8d8b8', groundDark: '#c8b888',
    phrase: '"O amor tudo sofre, tudo crê, tudo espera, tudo suporta." — 1 Coríntios 13:7',
    playerVariant: 'groom',
    obstacles: ['petals','flowervase'],
    collectible: 'ring',
    targetDist: 1500,
    drawBg(t, off) {
      const g = ctx.createLinearGradient(0,0,0,H-40);
      g.addColorStop(0,'#fff5e0'); g.addColorStop(0.5,'#ffd88a'); g.addColorStop(1,'#aee3ff');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H-40);
      // sol dourado
      ctx.fillStyle='rgba(255,230,150,0.7)';
      ctx.beginPath(); ctx.arc(400, 80, 60, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(400, 80, 30, 0, Math.PI*2); ctx.fill();
      // nuvens
      for (let i=0;i<5;i++){
        const x = ((i*220 - off*0.3) % (W+200)+W+200)%(W+200)-100;
        const y = 40 + i*15;
        ctx.fillStyle='rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(x,y,16,0,Math.PI*2); ctx.arc(x+14,y+4,18,0,Math.PI*2); ctx.arc(x+28,y,14,0,Math.PI*2); ctx.fill();
      }
      // Ponte refletindo céu
      px(0, 200, W, 6, '#d8c890');
      for(let i=0;i<W;i+=40) px(i, 206, 30, 12, 'rgba(200,180,120,0.4)');
      // Reflexo
      px(0, 218, W, 22, '#aee3ff');
      for(let i=0;i<W;i+=8){ const a=Math.sin(t*2+i*0.1)*0.3+0.3; ctx.fillStyle='rgba(255,255,255,'+a+')'; ctx.fillRect(i, 222+((i+t*40)%14|0), 4, 1); }
      // ground
      px(0, H-40, W, 40, '#e8d8b8');
      px(0, H-40, W, 3, '#c8b888');
      // pétalas no chão
      for(let i=0;i<30;i++){ const x=(i*43-(off%200))%W; px(x, H-35+((i%4)*2), 3,3, ['#fff','#ffd88a','#ffaacc'][i%3]); }
    },
    drawObstacle(o) {
      const y=H-40;
      if (o.kind==='petals') { for(let i=0;i<8;i++) px(o.x-8+i*2, y-6-((i%3)*3), 3,3, ['#fff','#ffaacc'][i%2]); }
      else if (o.kind==='flowervase') { px(o.x-5,y-14,10,14,'#fff'); px(o.x-7,y-20,14,7,'#7acc4a'); for(let i=0;i<4;i++) px(o.x-5+i*3,y-22,3,3,['#ffaacc','#fff','#ffd88a','#ffaacc'][i]); }
    },
    drawCollectible(c) { // aliança
      ctx.strokeStyle = '#ffd83a'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI*2); ctx.stroke();
      px(c.x-1, c.y-7, 2,2,'#fff');
    },
    drawDecor(t,off) {
      // pétalas voando
      for(let i=0;i<10;i++){
        const x=((i*89 + t*40)%(W+40));
        const y=(i*29 + t*30)%(H-60);
        ctx.fillStyle = ['#fff','#ffaacc','#ffd88a'][i%3];
        ctx.fillRect(x|0, y|0, 3, 3);
      }
    },
    meetX: 600, meetSetup: 'altar'
  },
  {
    id: 5, name: "Lua de Mel", theme: "Realização",
    sky: ['#3a5a3a','#fff2c4'],
    ground: '#8a5a3a', groundDark: '#5a3a20',
    phrase: "A vida foi generosa quando colocou você no meu caminho.",
    playerVariant: 'casual',
    obstacles: ['suitcase','bench3','touristsign','bike'],
    collectible: 'star',
    targetDist: 1800,
    drawBg(t, off) {
      const g = ctx.createLinearGradient(0,0,0,H-40);
      g.addColorStop(0,'#ffd88a'); g.addColorStop(0.5,'#ffaa5a'); g.addColorStop(1,'#c0623a');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H-40);
      // montanhas verdes
      ctx.fillStyle='#3a5a3a';
      ctx.beginPath(); ctx.moveTo(0,180);
      for(let i=0;i<=W;i+=40){ ctx.lineTo(i, 180 + Math.sin(i*0.02 - off*0.005)*30); }
      ctx.lineTo(W, H-40); ctx.lineTo(0, H-40); ctx.fill();
      // Casas bávaras / enxaimel
      const off1 = (off*0.7)%200;
      for(let i=-1;i<6;i++){
        const x=i*200-off1;
        // base
        px(x, 200, 80, 60, '#f0e0c0');
        // telhado triangular vermelho
        ctx.fillStyle='#a02020';
        ctx.beginPath(); ctx.moveTo(x-5,200); ctx.lineTo(x+40,170); ctx.lineTo(x+85,200); ctx.fill();
        // vigas marrons (enxaimel)
        px(x, 210, 80, 2, '#3a2010');
        px(x, 230, 80, 2, '#3a2010');
        px(x+10, 200, 2, 60, '#3a2010');
        px(x+40, 200, 2, 60, '#3a2010');
        px(x+70, 200, 2, 60, '#3a2010');
        // diagonal
        ctx.strokeStyle='#3a2010'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(x+10,230); ctx.lineTo(x+40,210); ctx.lineTo(x+70,230); ctx.stroke();
        // janelas
        px(x+15, 215, 8, 10, '#7acfff'); px(x+45, 215, 8, 10, '#7acfff');
        // luz Hard Rock vibe (4th house red sign)
        if (i===2) { px(x+20, 175, 40, 8, '#a02020'); px(x+25, 177, 30, 4, '#ffd83a'); }
      }
      // ground
      px(0, H-40, W, 40, '#8a5a3a');
      px(0, H-40, W, 3, '#5a3a20');
      // paralelepípedos
      for(let i=0;i<24;i++){ const x=((i*38-(off*1.2)%38)); px(x, H-36, 18, 4, '#6a4a30'); }
    },
    drawObstacle(o) {
      const y=H-40;
      if (o.kind==='suitcase') { px(o.x-8,y-12,16,12,'#5a3a20'); px(o.x-2,y-16,4,4,'#3a2010'); px(o.x-8,y-8,16,2,'#3a2010'); }
      else if (o.kind==='bench3') { px(o.x-12,y-10,24,3,'#5a3a20'); px(o.x-10,y-7,2,7,'#3a2010'); px(o.x+8,y-7,2,7,'#3a2010'); }
      else if (o.kind==='touristsign') { px(o.x-1,y-26,2,26,'#5a3a20'); px(o.x-10,y-26,20,10,'#3aa050'); px(o.x-8,y-24,16,2,'#fff'); px(o.x-8,y-21,12,2,'#fff'); }
      else if (o.kind==='bike') { ctx.strokeStyle='#222'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(o.x-8,y-6,6,0,Math.PI*2); ctx.arc(o.x+8,y-6,6,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(o.x-8,y-6); ctx.lineTo(o.x+2,y-14); ctx.lineTo(o.x+8,y-6); ctx.lineTo(o.x-2,y-14); ctx.lineTo(o.x-8,y-6); ctx.stroke(); }
    },
    drawCollectible(c) { // estrela
      ctx.fillStyle='#ffd83a';
      ctx.beginPath();
      for(let i=0;i<10;i++){ const a=(i*Math.PI)/5 - Math.PI/2; const r=i%2?2:5; ctx.lineTo(c.x+Math.cos(a)*r, c.y+Math.sin(a)*r); }
      ctx.closePath(); ctx.fill();
    },
    drawDecor(t,off) {},
    meetX: 600, meetSetup: 'gramado'
  }
];

/* =========================================================
   ENDLESS RUNNER ENGINE (per phase)
   ========================================================= */
function PhaseScene(phaseIdx) {
  const ph = PHASES[phaseIdx];
  const groundY = H - 40;
  const state = {
    t: 0, dist: 0, speed: 5, baseSpeed: 5,
    player: { x: 100, y: groundY, vy: 0, w: 24, h: 40, jumping: false, jumpHold: 0 },
    obstacles: [], collectibles: [], decor: [],
    spawnTimer: 60, collectTimer: 90,
    collected: 0,
    phase: 'play', // play | meet | ending
    meetTimer: 0,
    cameraOff: 0,
    showPhrase: 0,
    introTimer: 180, // intro card
  };
  return {
    init() {
      stopMusic();
      const m = PHASE_MUSIC[phaseIdx];
      playMusic(m.notes, m.tempo, m.type, 0.1);
    },
    input() {
      if (state.phase === 'play') {
        if (!state.player.jumping) {
          state.player.vy = -11;
          state.player.jumping = true;
          sfx(440 + phaseIdx*40, 0.08, 'square', 0.1);
        }
      } else if (state.phase === 'ending' && state.meetTimer > 180) {
        // advance
        state.phase = 'done';
        save.maxPhase = Math.max(save.maxPhase, phaseIdx+1);
        persist();
        if (phaseIdx === PHASES.length - 1) {
          fadeTo(EpilogueScene(), 1.2);
        } else {
          fadeTo(TransitionScene(phaseIdx, () => PhaseScene(phaseIdx+1)), 0.8);
        }
      }
    },
    update(dt) {
      state.t += dt;

      if (state.introTimer > 0) { state.introTimer -= dt*60; return; }

      if (state.phase === 'play') {
        // speed ramps
        state.speed = state.baseSpeed + Math.min(3, state.dist/2000*3);
        state.dist += state.speed;
        state.cameraOff += state.speed;

        // player physics
        const p = state.player;
        p.vy += 0.6; // gravity
        p.y += p.vy;
        if (p.y >= groundY) { p.y = groundY; p.vy = 0; p.jumping = false; }

        // spawn obstacles
        state.spawnTimer -= 1;
        if (state.spawnTimer <= 0) {
          const kind = ph.obstacles[(Math.random()*ph.obstacles.length)|0];
          let color = null;
          if (kind === 'ipe') color = ['#ffd83a','#fff','#f08fbf','#9c5cc4'][(Math.random()*4)|0];
          state.obstacles.push({ x: W + 40, kind, color, w: 24, h: 24 });
          state.spawnTimer = 60 + Math.random()*60 - Math.min(30, state.dist/200);
        }
        // spawn collectibles
        state.collectTimer -= 1;
        if (state.collectTimer <= 0) {
          state.collectibles.push({ x: W + 20, y: groundY - 40 - Math.random()*40, t: 0, i: state.collected });
          state.collectTimer = 120 + Math.random()*120;
        }

        // update obstacles
        for (const o of state.obstacles) o.x -= state.speed;
        state.obstacles = state.obstacles.filter(o => o.x > -60);

        // update collectibles
        for (const c of state.collectibles) { c.x -= state.speed; c.t += dt*4; }
        state.collectibles = state.collectibles.filter(c => c.x > -20);

        // collisions (obstacle = small forgiveness)
        for (const o of state.obstacles) {
          if (Math.abs(o.x - p.x) < 14 && p.y >= groundY - 14) {
            // bump: small bounce instead of game over to keep emotional flow
            p.vy = -8; p.jumping = true;
            o.x -= 200; // push past
            sfx(120, 0.1, 'sawtooth', 0.15);
          }
        }
        // collect
        for (const c of state.collectibles) {
          if (Math.abs(c.x - p.x) < 16 && Math.abs(c.y - (p.y-20)) < 24) {
            c.x = -100; state.collected++;
            sfx(880, 0.12, 'sine', 0.15);
            sfx(1320, 0.12, 'sine', 0.1);
          }
        }

        // reach goal
        if (state.dist > ph.targetDist) {
          state.phase = 'meet';
          state.meetTimer = 0;
        }
      } else if (state.phase === 'meet') {
        state.meetTimer += dt*60;
        // decelerate
        state.speed *= 0.96;
        state.cameraOff += state.speed;
        state.player.x = Math.min(state.player.x + 0.4, 300);
        if (state.meetTimer > 60) {
          state.phase = 'ending';
          state.meetTimer = 0;
        }
      } else if (state.phase === 'ending') {
        state.meetTimer += dt*60;
        state.showPhrase = Math.min(1, state.meetTimer/60);
      }
    },
    render() {
      const t = state.t;
      ph.drawBg(t, state.cameraOff);
      ph.drawDecor(t, state.cameraOff);

      // ground-level entities
      const drawer = () => {
        // obstacles
        for (const o of state.obstacles) ph.drawObstacle(o);
        // collectibles
        for (const c of state.collectibles) ph.drawCollectible(c);
      };
      drawer();

      // meeting scene at phase==='meet' or 'ending'
      if (state.phase !== 'play') {
        // draw Elizia waiting near right side
        const ex = 460;
        // Setup specific decor
        if (ph.meetSetup === 'busstop') {
          // parada de ônibus
          px(ex-30, groundY-50, 60, 4, '#3a3a3a');
          px(ex-32, groundY-50, 2, 50, '#3a3a3a');
          px(ex+30, groundY-50, 2, 50, '#3a3a3a');
          px(ex-28, groundY-45, 56, 3, '#f5c518');
        } else if (ph.meetSetup === 'festival') {
          // balões em cima
          for(let i=0;i<6;i++) drawBalloon(ex-20+i*8, groundY-90 + Math.sin(t+i)*4, ['#e94560','#ffd86a','#9c5cc4','#3aa0ff'][i%4]);
          // ponte e cadeado se ending
          if (state.phase === 'ending' && state.meetTimer > 120) {
            px(ex-40, groundY-10, 80, 4, '#5a3a20');
            drawHeart(ex, groundY-30, 8, '#ffd83a'); // cadeado coração estilizado
          }
        } else if (ph.meetSetup === 'bridge') {
          px(ex-40, groundY-2, 80, 4, '#3a3a4a');
          // chuva para se ending
        } else if (ph.meetSetup === 'altar') {
          // altar / arco
          px(ex-32, groundY-60, 64, 4, '#fff');
          px(ex-32, groundY-60, 4, 60, '#fff');
          px(ex+28, groundY-60, 4, 60, '#fff');
          for(let i=0;i<10;i++) px(ex-30+i*6, groundY-66, 4,4, ['#ffaacc','#fff','#ffd88a'][i%3]);
        } else if (ph.meetSetup === 'gramado') {
          // arco de flores rosas e casa colorida atrás
          px(ex-30, groundY-50, 60, 4, '#a02020');
          for(let i=0;i<8;i++) px(ex-30+i*8, groundY-56, 6,6, ['#ffaacc','#fff','#a02020','#ffd88a'][i%4]);
        }
        drawElizia(ex, groundY, ph.id===4?'bride':(ph.id===2?'evening':(ph.id===5?'gramado':'normal')));

        if (state.phase === 'ending' && state.meetTimer > 60) {
          // hearts subindo
          for (let i=0;i<3;i++){
            const hy = groundY - 30 - ((state.meetTimer + i*30) % 80);
            drawHeart((state.player.x + ex)/2 + Math.sin(state.meetTimer*0.05+i)*10, hy, 5+i, 'rgba(233,69,96,'+(1-(state.meetTimer%80)/80)+')');
          }
        }
      }

      // player
      drawRodrigo(state.player.x, state.player.y, ph.playerVariant, t);

      // HUD - phase title intro
      if (state.introTimer > 0) {
        const a = state.introTimer > 60 ? 1 : state.introTimer/60;
        ctx.fillStyle = `rgba(0,0,0,${0.5*a})`; ctx.fillRect(0,0,W,H);
        text(`Capítulo ${ph.id}`, W/2, H/2-40, 18, `rgba(255,255,255,${a})`, 'center');
        text(ph.name, W/2, H/2-12, 36, `rgba(255,255,255,${a})`, 'center');
        text(ph.theme, W/2, H/2+30, 14, `rgba(255,255,255,${0.7*a})`, 'center');
      }

      // Phrase during ending
      if (state.phase === 'ending') {
        const a = state.showPhrase;
        ctx.fillStyle = `rgba(0,0,0,${0.5*a})`; ctx.fillRect(0, H-100, W, 100);
        textWrap(`"${ph.phrase}"`, W/2, H-85, W-80, 14, `rgba(255,255,255,${a})`, 'center');
        if (state.meetTimer > 180) {
          text('Toque ou espaço para continuar →', W/2, H-22, 11, `rgba(255,255,255,${0.7+Math.sin(t*4)*0.3})`, 'center');
        }
      }

      // Counter
      text(`💗 ${state.collected}`, 16, 14, 14, 'rgba(255,255,255,0.85)');
      text(`${ph.name}`, W-16, 14, 12, 'rgba(255,255,255,0.7)', 'right');
    }
  };
}

/* =========================================================
   TRANSITION SCENES (entre fases)
   ========================================================= */
function TransitionScene(fromIdx, nextSceneFactory) {
  const t0 = performance.now();
  return {
    init() { stopMusic(); },
    input() {
      if ((performance.now() - t0) > 1500) fadeTo(nextSceneFactory(), 0.8);
    },
    update() {},
    render() {
      const t = (performance.now() - t0) / 1000;
      clear('#000');
      withGameTransform(() => {
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
        if (fromIdx === 0) {
          // Patinho + balões subindo
          const g = ctx.createLinearGradient(0,0,0,H);
          g.addColorStop(0,'#1a0a3a'); g.addColorStop(1,'#4a1a6a');
          ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
          for(let i=0;i<20;i++){
            const x=(i*47)%W;
            const y=H - ((t*60 + i*30) % (H+40));
            drawBalloon(x, y, ['#ffd86a','#e94560','#9c5cc4','#3aa0ff'][i%4]);
          }
          // patinho
          const dx=W/2, dy=H/2 + Math.sin(t*2)*6;
          ctx.fillStyle='#ffd83a';
          ctx.beginPath(); ctx.ellipse(dx, dy, 30, 22, 0, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(dx+22, dy-14, 16, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(dx+26, dy-16, 2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle='#ff8a3a'; ctx.beginPath(); ctx.moveTo(dx+36,dy-14); ctx.lineTo(dx+46,dy-10); ctx.lineTo(dx+36,dy-8); ctx.closePath(); ctx.fill();
          text('"Vou te amar patodavida"', W/2, H-50, 16, '#fff', 'center');
        } else if (fromIdx === 1) {
          // Close no cadeado
          const g = ctx.createLinearGradient(0,0,0,H);
          g.addColorStop(0,'#3a1a5a'); g.addColorStop(1,'#1a0a2a');
          ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
          // cadeado dourado grande
          const cx=W/2, cy=H/2;
          ctx.strokeStyle='#ffd83a'; ctx.lineWidth=6;
          ctx.beginPath(); ctx.arc(cx, cy-30, 24, Math.PI, 2*Math.PI); ctx.stroke();
          ctx.fillStyle='#ffd83a';
          ctx.fillRect(cx-30, cy-10, 60, 60);
          drawHeart(cx, cy+10, 14, '#e94560');
          text('R ❤️ E', cx, cy+72, 16, '#ffd83a', 'center');
        } else if (fromIdx === 2) {
          // Nascer do sol
          const g = ctx.createLinearGradient(0,0,0,H);
          const k = Math.min(1, t/3);
          g.addColorStop(0,'#0a1530'); g.addColorStop(0.5,`rgb(${(255*k)|0},${(180*k)|0},${(100*k)|0})`); g.addColorStop(1,'#ffd88a');
          ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
          ctx.fillStyle='#fff5b0';
          ctx.beginPath(); ctx.arc(W/2, H-40 - t*30, 50, 0, Math.PI*2); ctx.fill();
          text('Um novo dia começa...', W/2, 50, 16, '#fff', 'center');
        } else if (fromIdx === 3) {
          // Avião atravessa o céu
          const g = ctx.createLinearGradient(0,0,0,H);
          g.addColorStop(0,'#aee3ff'); g.addColorStop(1,'#fff5e0');
          ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
          // nuvens
          for(let i=0;i<6;i++){
            ctx.fillStyle='rgba(255,255,255,0.9)';
            ctx.beginPath(); ctx.arc(100+i*120, 100+(i%2)*30, 20, 0, Math.PI*2); ctx.fill();
          }
          const px2 = (t*200) - 100;
          // avião
          ctx.fillStyle='#fff'; ctx.fillRect(px2, H/2, 60, 10);
          ctx.fillRect(px2+20, H/2-8, 10, 26);
          ctx.fillRect(px2+50, H/2-4, 8, 4);
          ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=3;
          ctx.beginPath(); ctx.moveTo(0, H/2+5); ctx.lineTo(px2, H/2+5); ctx.stroke();
          text('Próxima parada: Gramado ✈️', W/2, H-50, 16, '#3a3a3a', 'center');
        }
        text('Toque para continuar →', W/2, H-22, 11, `rgba(255,255,255,${0.7+Math.sin(t*4)*0.3})`, 'center');
      });
    }
  };
}

/* =========================================================
   TITLE SCENE
   ========================================================= */
function TitleScene() {
  let t = 0;
  return {
    init() { stopMusic(); document.getElementById('touchHint').classList.add('show'); },
    input() {
      document.getElementById('touchHint').classList.remove('show');
      // start from saved progress or scene
      const startPhase = save.maxPhase < PHASES.length ? save.maxPhase : 0;
      fadeTo(PhaseScene(startPhase), 0.8);
    },
    update(dt) { t += dt; },
    render() {
      // dreamlike gradient
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#1a0530'); g.addColorStop(0.5,'#4a1a6a'); g.addColorStop(1,'#e94560');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // stars
      for (let i=0;i<60;i++){ const x=(i*47)%W,y=(i*29)%H; px(x,y,1,1,`rgba(255,255,255,${0.3+Math.sin(t+i)*0.3})`); }
      // floating hearts
      for(let i=0;i<8;i++){
        const x=(i*97 + Math.sin(t+i)*30)%W;
        const y=(H - ((t*20+i*40)%(H+40)));
        drawHeart(x, y, 6, 'rgba(255,180,200,0.6)');
      }
      // title
      ctx.shadowColor = '#000'; ctx.shadowBlur = 8;
      text('ATÉ VOCÊ', W/2, 70, 56, '#fff', 'center', 'Georgia, serif');
      ctx.shadowBlur = 0;
      text('uma corrida de amor', W/2, 130, 16, 'rgba(255,255,255,0.8)', 'center');
      textWrap('"Eu não estava correndo para escapar de algo.\nEu estava correndo para chegar até você."', W/2, 160, W-100, 13, 'rgba(255,255,255,0.9)', 'center');
      const a = 0.7 + Math.sin(t*3)*0.3;
      text('► Toque ou pressione ESPAÇO', W/2, H-50, 16, `rgba(255,255,255,${a})`, 'center');
      text('Rodrigo ❤️ Elizia · 04/04/2025', W/2, H-22, 11, 'rgba(255,255,255,0.6)', 'center');
      if (save.maxPhase > 0 && save.maxPhase < PHASES.length) {
        text(`(continuando do Capítulo ${save.maxPhase+1})`, W/2, H-72, 11, 'rgba(255,255,255,0.6)', 'center');
      }
      if (save.albumUnlocked) {
        text('★ Álbum desbloqueado — pressione A', W/2, H-92, 11, '#ffd86a', 'center');
      }
    }
  };
}

/* =========================================================
   EPILOGUE — Jardim das Certezas
   ========================================================= */
function EpilogueScene() {
  let t = 0;
  let phase = 'run'; // run -> slow -> sit -> message -> credits
  let dist = 0, speed = 5;
  let camera = 0;
  let messageTimer = 0;
  const groundY = H - 40;
  const player = { x: 100, y: groundY };
  return {
    init() {
      const m = PHASE_MUSIC[5];
      playMusic(m.notes, m.tempo, m.type, 0.1);
      save.albumUnlocked = true;
      save.maxPhase = PHASES.length;
      persist();
    },
    input() {
      if (phase === 'message') { fadeTo(CreditsScene(), 1.2); }
    },
    update(dt) {
      t += dt;
      if (phase === 'run') {
        dist += speed; camera += speed;
        if (dist > 600) phase = 'slow';
      } else if (phase === 'slow') {
        speed *= 0.985; camera += speed;
        if (speed < 0.3) { phase = 'sit'; speed = 0; }
      } else if (phase === 'sit') {
        messageTimer += dt*60;
        if (messageTimer > 240) phase = 'message';
      } else if (phase === 'message') {
        messageTimer += dt*60;
      }
    },
    render() {
      // sky - sunrise
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#3a1a5a'); g.addColorStop(0.4,'#e94560'); g.addColorStop(0.8,'#ffd86a'); g.addColorStop(1,'#fff5e0');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H-40);
      // sol nascendo
      ctx.fillStyle='#fff5b0';
      ctx.beginPath(); ctx.arc(W/2+60, H-80, 50, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(W/2+60, H-80, 70, 0, Math.PI*2); ctx.fill();
      // ponte longe
      px(W/2-100, 200, 200, 4, '#fff');
      // balões subindo
      for(let i=0;i<10;i++){
        const x = (i*83 + Math.sin(t+i)*20) % W;
        const y = H - 60 - ((t*15 + i*40) % 200);
        drawBalloon(x, y, ['#e94560','#ffd86a','#9c5cc4','#3aa0ff','#fff'][i%5]);
      }
      // avião
      const px2 = ((t*40)%(W+100))-50;
      ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(px2, 60, 30, 4); ctx.fillRect(px2+10, 56, 6, 12);
      // ipês mistos (símbolos das fases)
      const off1 = camera*0.6;
      for(let i=-1;i<6;i++){
        const x = i*220 - (off1%220);
        drawIpe(x+50, groundY, ['#ffd83a','#f08fbf','#9c5cc4','#fff'][i%4], 50);
      }
      // ground - jardim
      px(0, H-40, W, 40, '#3a8a3a');
      px(0, H-40, W, 3, '#2a6a2a');
      // flores
      for(let i=0;i<W/10;i++){ const x=(i*10-(camera*0.5%10)); px(x, H-32+(i%3), 2,2,['#ff8aa0','#ffd86a','#fff','#9c5cc4'][i%4]); }
      // moto e skate como símbolos no chão
      px(W*0.2 - camera*0.3 % W, groundY-4, 16, 3, '#5a3a1f');
      // cadeado pendurado em arco
      const cadX = W*0.7 - camera*0.4;
      if (cadX > -20 && cadX < W+20) { drawHeart(cadX, groundY-60, 8, '#ffd83a'); }
      // alianças
      ctx.strokeStyle='#ffd83a'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(W*0.4 - camera*0.3, groundY-50, 6, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(W*0.4 - camera*0.3 + 10, groundY-50, 6, 0, Math.PI*2); ctx.stroke();

      // cães
      drawRico(W*0.6 + Math.sin(t*2)*30, groundY, t);
      drawKiara(W*0.8 + Math.cos(t*1.5)*40, groundY, t);

      if (phase === 'run' || phase === 'slow') {
        drawRodrigo(player.x, player.y, 'casual', t);
      } else {
        // sentados juntos
        const sx = W/2;
        // banco
        px(sx-40, groundY-4, 80, 3, '#5a3a1f');
        px(sx-38, groundY-1, 2, 5, '#3a2010');
        px(sx+36, groundY-1, 2, 5, '#3a2010');
        // Rodrigo sentado
        const yy = groundY - 28;
        px(sx-22, yy+10, 12, 10, '#c0392b'); // torso
        px(sx-18, yy+20, 10, 6, '#6b4423'); // pernas
        px(sx-22, yy+26, 6, 2, '#1a1a1a');
        px(sx-12, yy+26, 6, 2, '#1a1a1a');
        px(sx-18, yy+2, 8, 8, SKIN); px(sx-18, yy+2, 8, 3, HAIR);
        px(sx-16, yy+6, 1,1,'#000'); px(sx-13, yy+6, 1,1,'#000');
        // Elizia sentada
        px(sx+10, yy+10, 12, 10, '#b03030');
        px(sx+12, yy+20, 10, 6, '#b03030');
        px(sx+12, yy+26, 6, 2, '#222');
        px(sx+22, yy+26, 6, 2, '#222');
        px(sx+12, yy+2, 8, 8, SKIN); px(sx+12, yy, 8, 5, '#5a3a24');
        px(sx+14, yy+6, 1,1,'#000'); px(sx+17, yy+6, 1,1,'#000');
        // coração entre eles
        drawHeart(sx, yy+5 - Math.sin(t*2)*2, 5, '#e94560');
      }

      if (phase === 'sit' || phase === 'message') {
        const a = Math.min(1, messageTimer/120);
        ctx.fillStyle = `rgba(0,0,0,${0.55*a})`; ctx.fillRect(0, H-130, W, 130);
        textWrap('"Passei anos correndo atrás dos meus sonhos. Então percebi que o mais bonito deles já estava correndo ao meu lado."',
          W/2, H-118, W-80, 14, `rgba(255,255,255,${a})`, 'center');
        if (phase === 'message') {
          text('Rodrigo ❤️ Elizia', W/2, H-50, 18, `rgba(255,216,106,${a})`, 'center');
          text('04 / 04 / 2025', W/2, H-28, 13, `rgba(255,255,255,${a*0.9})`, 'center');
          if (messageTimer > 300) text('Toque para ver os créditos →', W/2, H-12, 10, `rgba(255,255,255,${0.7+Math.sin(t*4)*0.3})`, 'center');
        }
      }
    }
  };
}

/* =========================================================
   CREDITS / ALBUM
   ========================================================= */
function CreditsScene() {
  let t = 0;
  return {
    init() {},
    input() { fadeTo(TitleScene(), 0.8); },
    update(dt) { t += dt; },
    render() {
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#0a0518'); g.addColorStop(1,'#3a1a5a');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // hearts
      for(let i=0;i<8;i++){
        const x=(i*97 + Math.sin(t+i)*20)%W;
        const y=(H - ((t*15+i*60)%(H+60)));
        drawHeart(x, y, 5, 'rgba(255,180,200,0.5)');
      }
      const scrollY = 280 - (t*30);
      const lines = [
        ['ATÉ VOCÊ', 28, '#fff'],
        ['uma corrida de amor', 14, 'rgba(255,255,255,0.8)'],
        ['', 12, '#fff'],
        ['Para Elizia', 20, '#ffd86a'],
        ['', 8, '#fff'],
        ['"Vou te amar patodavida."', 14, 'rgba(255,255,255,0.9)'],
        ['', 12, '#fff'],
        ['CAPÍTULOS', 14, '#ffd86a'],
        ['1. O Começo', 13, '#fff'],
        ['2. O Namoro', 13, '#fff'],
        ['3. O Noivado', 13, '#fff'],
        ['4. O Casamento', 13, '#fff'],
        ['5. Lua de Mel', 13, '#fff'],
        ['Epílogo: O Jardim das Certezas', 13, '#fff'],
        ['', 12, '#fff'],
        ['Personagens', 14, '#ffd86a'],
        ['Rodrigo · Elizia', 13, '#fff'],
        ['Rico (Pinscher) · Kiara (Boxer)', 13, '#fff'],
        ['', 12, '#fff'],
        ['Programação · Arte · Música', 14, '#ffd86a'],
        ['Feito com amor', 13, '#fff'],
        ['', 12, '#fff'],
        ['04 · 04 · 2025', 18, '#ffd86a'],
        ['Rodrigo ❤️ Elizia', 22, '#fff'],
        ['', 30, '#fff'],
        ['★ Álbum desbloqueado ★', 13, '#ffd86a'],
        ['(pressione A no menu para abrir)', 11, 'rgba(255,255,255,0.6)']
      ];
      let yy = scrollY;
      for (const [txt, size, col] of lines) {
        if (yy > -20 && yy < H+20) text(txt, W/2, yy, size, col, 'center');
        yy += size + 10;
      }
      if (yy < 0) {
        text('Toque para voltar ao início', W/2, H-26, 12, `rgba(255,255,255,${0.7+Math.sin(t*4)*0.3})`, 'center');
      }
    }
  };
}

function AlbumScene() {
  let t = 0;
  let page = 0;
  const pages = PHASES.map(p => ({ name: p.name, phrase: p.phrase, id: p.id }));
  pages.push({ name: 'Epílogo', phrase: 'Passei anos correndo atrás dos meus sonhos. Então percebi que o mais bonito deles já estava correndo ao meu lado.', id: '∞' });
  return {
    init(){},
    input() {
      page++;
      if (page >= pages.length) fadeTo(TitleScene(), 0.6);
    },
    update(dt){ t+=dt; },
    render() {
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#1a0530'); g.addColorStop(1,'#3a1a5a');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const p = pages[page];
      text('★ ÁLBUM SECRETO ★', W/2, 24, 16, '#ffd86a', 'center');
      text(`Capítulo ${p.id} — ${p.name}`, W/2, 60, 22, '#fff', 'center');
      // moldura para foto futura
      px(W/2-100, 90, 200, 110, '#fff');
      px(W/2-96, 94, 192, 102, '#222');
      text('[espaço para foto]', W/2, 140, 12, 'rgba(255,255,255,0.5)', 'center');
      text('Adicione fotos em /game/photos/', W/2, 158, 10, 'rgba(255,255,255,0.4)', 'center');
      textWrap(`"${p.phrase}"`, W/2, 210, W-80, 13, 'rgba(255,255,255,0.9)', 'center');
      text('Toque para próxima página →', W/2, H-22, 11, `rgba(255,255,255,${0.7+Math.sin(t*4)*0.3})`, 'center');
    }
  };
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'a' || e.key === 'A') {
    if (save.albumUnlocked && scene && scene.constructor) {
      // Only allow from title
      // identify by checking render fn -- simple heuristic: just allow always once unlocked
      fadeTo(AlbumScene(), 0.6);
    }
  }
});

/* =========================================================
   MAIN LOOP
   ========================================================= */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  scene.update?.(dt);
  // render
  clear('#000');
  withGameTransform(() => scene.render?.());
  // fade overlay
  if (fadeDir !== 0) {
    fadeAlpha += fadeDir * (1/(fadeDuration*60));
    if (fadeDir > 0 && fadeAlpha >= 1) {
      fadeAlpha = 1; fadeDir = 0;
      if (fadeCb) fadeCb();
    } else if (fadeDir < 0 && fadeAlpha <= 0) {
      fadeAlpha = 0; fadeDir = 0;
    }
  }
  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(loop);
}

setScene(TitleScene());
requestAnimationFrame(loop);

// Show touch hint briefly
setTimeout(() => document.getElementById('touchHint').classList.remove('show'), 5000);

})();
