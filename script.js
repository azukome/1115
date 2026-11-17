const spinCage = document.getElementById('spinCage');
const eggInner = document.getElementById('eggInner');
const fallZone = document.getElementById('fallZone');
const startBtn = document.getElementById('startBtn');
const prizeTextarea = document.getElementById('prizeTextarea');
const resultBox = document.getElementById('resultBox');
const resultEggWrap = resultBox.querySelector('.result-egg');

const colorClass = ['egg-1','egg-2','egg-3','egg-4','egg-5','egg-6','egg-7'];
let isRunning = false;
let forcePickIndex = null;
let eggList = [];
let animateId = null;
let zeroKeyDown = false;

const GRAVITY = 0.22;
const FRICTION = 0.99;
const SPIN_FRICTION = 0.9995;
const WALL_BOUNCE = 0.95;
const BALL_BOUNCE = 0.98;
const MAX_SPIN_SPEED = 14;
const SEPARATE_ITERATION = 10;

const BALL_SIZE = 52;
const BALL_RADIUS = 26;
const CAGE_RADIUS = 108;
const HOLE_CENTER_X = 130;
const HOLE_CENTER_Y = 230;
const HOLE_RADIUS = 32;

function initEggs(){
  eggInner.innerHTML = '';
  eggList = [];

  for(let i=0;i<7;i++){
    const e = document.createElement('div');
    e.className = 'egg ' + colorClass[i];
    e.innerText = i+1;

    e.style.width = BALL_SIZE + 'px';
    e.style.height = BALL_SIZE + 'px';
    e.style.fontSize = '16px';

    const angle = (Math.PI*2 /7)*i - Math.PI/2;
    const r = 90;
    const x = 130 + Math.cos(angle)*r - BALL_RADIUS;
    const y = 130 + Math.sin(angle)*r - BALL_RADIUS;

    e.style.left = x + 'px';
    e.style.top = y + 'px';
    eggInner.appendChild(e);

    eggList.push({
      dom:e,
      x,
      y,
      vx:0,
      vy:0,
      size:BALL_SIZE,
      radius:BALL_RADIUS,
      isFallingToTube:false
    });
  }
}
initEggs();

function updateBalls(){
  const centerX = 130;
  const centerY = 130;
  const cageRadius = CAGE_RADIUS;

  for(let b of eggList){
    if(b.isFallingToTube) continue;

    if(isRunning){
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if(speed < 1.5 && Math.random() < 0.025){
        const kickAngle = Math.random() * Math.PI * 2;
        b.vx += Math.cos(kickAngle) * 3.5;
        b.vy += Math.sin(kickAngle) * 3.5;
      }
    }else{
      b.vy += GRAVITY;
      const dxHole = (HOLE_CENTER_X - b.x - b.radius);
      const dyHole = (HOLE_CENTER_Y - b.y - b.radius);
      const distHole = Math.sqrt(dxHole*dxHole + dyHole*dyHole);
      if(distHole < 80){
        b.vx += dxHole * 0.0015;
        b.vy += dyHole * 0.0015;
      }
    }

    const friction = isRunning ? SPIN_FRICTION : FRICTION;
    b.vx *= friction;
    b.vy *= friction;

    if(isRunning){
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if(speed > MAX_SPIN_SPEED){
        b.vx = b.vx / speed * MAX_SPIN_SPEED;
        b.vy = b.vy / speed * MAX_SPIN_SPEED;
      }
    }

    b.x += b.vx;
    b.y += b.vy;

    const dx = b.x + b.radius - centerX;
    const dy = b.y + b.radius - centerY;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if(dist > cageRadius - b.radius){
      const nx = dx / dist;
      const ny = dy / dist;
      const dot = b.vx * nx + b.vy * ny;

      if(dot > 0){
        b.vx = (b.vx - 2 * dot * nx) * WALL_BOUNCE;
        b.vy = (b.vy - 2 * dot * ny) * WALL_BOUNCE;
      }

      b.x = centerX + nx * (cageRadius - b.radius) - b.radius;
      b.y = centerY + ny * (cageRadius - b.radius) - b.radius;
    }
  }

  for(let iter = 0; iter < SEPARATE_ITERATION; iter++){
    ballToBallCollision();
  }

  for(let b of eggList){
    b.dom.style.left = b.x + 'px';
    b.dom.style.top = b.y + 'px';
  }
}

function ballToBallCollision(){
  for(let i=0;i<eggList.length;i++){
    for(let j=i+1;j<eggList.length;j++){
      const a = eggList[i];
      const b = eggList[j];
      if(a.isFallingToTube || b.isFallingToTube) continue;

      const ax = a.x + a.radius;
      const ay = a.y + a.radius;
      const bx = b.x + b.radius;
      const by = b.y + b.radius;

      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const minDist = a.radius + b.radius;

      if(dist < minDist && dist > 0.0001){
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const dot = dvx * nx + dvy * ny;
        if(dot < 0){
          const impulse = -(1 + BALL_BOUNCE) * dot * 0.5;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
        }
      }
    }
  }
}

function startPhysicsLoop(){
  function loop(){
    updateBalls();
    animateId = requestAnimationFrame(loop);
  }
  loop();
}
startPhysicsLoop();

function getPrizeArr(){
  const raw = prizeTextarea.value.trim().split('\n').map(x=>x.trim());
  const arr = [];
  for(let i=0;i<7;i++){
    arr.push(raw[i] || `獎品${i+1}`);
  }
  return arr;
}

function sleep(ms){
  return new Promise(r=>setTimeout(r,ms));
}

async function runDraw(targetIdx){
  if(isRunning) return;
  isRunning = true;
  const spinDuration = 3000 + Math.random() * 2000;
  const pickIdx = targetIdx ?? Math.floor(Math.random()*7);
  const prizeBall = eggList[pickIdx];
  startBtn.disabled = true;
  fallZone.innerHTML = '';
  resultEggWrap.innerHTML = '';
  resultBox.querySelector('small').textContent = '搖轉中…';

  resultBox.classList.remove('result-celebration');
  void resultBox.offsetWidth;

  for(let b of eggList){
    const angle = Math.random() * Math.PI * 2;
    const speed = 7 + Math.random() * 3;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.isFallingToTube = false;
    b.dom.style.transition = 'none';
    b.dom.style.visibility = 'visible';
  }

  await sleep(spinDuration);

  isRunning = false;
  prizeBall.isFallingToTube = true;
  const dropX = 130 - prizeBall.radius;
  const dropY = 130 + CAGE_RADIUS - 2 * prizeBall.radius - 4;
  prizeBall.dom.style.transition = 'left 0.35s ease-in-out, top 0.35s ease-in-out';
  void prizeBall.dom.offsetWidth;
  prizeBall.x = dropX;
  prizeBall.y = dropY;
  prizeBall.dom.style.left = prizeBall.x + 'px';
  prizeBall.dom.style.top = prizeBall.y + 'px';
  await sleep(350);

  prizeBall.y = 250;
  prizeBall.dom.style.transition = 'top 0.35s ease-in';
  void prizeBall.dom.offsetWidth;
  prizeBall.dom.style.top = prizeBall.y + 'px';
  await sleep(350);
  prizeBall.dom.style.visibility = 'hidden';
  prizeBall.y = dropY;

  const prizeList = getPrizeArr();
  const prizeName = prizeList[pickIdx];
  const cls = colorClass[pickIdx];

  const eggDom = document.createElement('div');
  eggDom.className = 'fall-egg ' + cls;
  eggDom.innerText = prizeName;
  eggDom.style.animation = 'fall 0.45s cubic-bezier(0.2,0.8,0.2,1) both';
  fallZone.appendChild(eggDom);

  const resDom = eggDom.cloneNode(true);
  resDom.style.animation = 'none';
  resultEggWrap.appendChild(resDom);

  await sleep(450);
  resultBox.querySelector('small').textContent = '🎉 開獎結果';
  resultBox.classList.add('result-celebration');

  setTimeout(()=>{
    forcePickIndex = null;
    startBtn.disabled = false;
  }, 600);
}

startBtn.onclick = ()=>{
  runDraw(forcePickIndex);
};

document.addEventListener('keydown', e=>{
  if(e.key === '0'){
    zeroKeyDown = true;
    return;
  }
  if(zeroKeyDown){
    const num = parseInt(e.key);
    if(!isNaN(num)){
      e.preventDefault();
      forcePickIndex = num === 0 ? null : num - 1;
    }
  }
});

document.addEventListener('keyup', e=>{
  if(e.key === '0') zeroKeyDown = false;
});
