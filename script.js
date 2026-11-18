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
let zeroKeyDown = false;

const SPIN_FRICTION = 0.9995;
const WALL_BOUNCE = 0.95;
const BALL_BOUNCE = 0.98;
const IDLE_GRAVITY = 0.22;
const IDLE_FRICTION = 0.92;
const IDLE_BOUNCE = 0.08;
const IDLE_SLEEP_SPEED = 0.12;
const MAX_SPIN_SPEED = 14;
const SEPARATE_ITERATION = 10;

// ========== 全部 *1.25 ==========
const SCALE = 1.25;
const BALL_SIZE = 64 * SCALE;
const BALL_RADIUS = 32 * SCALE;
const CAGE_SIZE = 260 * SCALE;
const CAGE_HALF = CAGE_SIZE / 2;
const CAGE_LEFT = 0;
const CAGE_TOP = 0;
const CAGE_RIGHT = CAGE_SIZE;
const CAGE_BOTTOM = CAGE_SIZE;

const IDLE_START_OFFSETS = [
  [-52 * SCALE, -40 * SCALE], [0 * SCALE, -40 * SCALE], [52 * SCALE, -40 * SCALE],
  [-78 * SCALE, 15 * SCALE], [-26 * SCALE, 15 * SCALE], [26 * SCALE, 15 * SCALE], [78 * SCALE, 15 * SCALE]
];

function initEggs(){
  eggInner.innerHTML = '';
  eggList = [];

  for(let i=0;i<7;i++){
    const e = document.createElement('div');
    e.className = 'egg ' + colorClass[i];
    e.innerText = i+1;

    e.style.width = BALL_SIZE + 'px';
    e.style.height = BALL_SIZE + 'px';
    e.style.fontSize = (22 * SCALE) + 'px';

    const x = CAGE_HALF + IDLE_START_OFFSETS[i][0] - BALL_RADIUS;
    const y = CAGE_HALF + IDLE_START_OFFSETS[i][1] - BALL_RADIUS;

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
      isSleeping:false,
      isFallingToTube:false
    });
  }
}
initEggs();


function updateBalls(){
  if(!isRunning && eggList.every(b=>b.isSleeping || b.isFallingToTube)) return;

  const idle = !isRunning;

  for(let b of eggList){
    if(b.isFallingToTube) continue;
    if(idle && b.isSleeping) continue;

    if(idle) b.vy += IDLE_GRAVITY;
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if(!idle && speed < 1.5 && Math.random() < 0.025){
      const kickAngle = Math.random() * Math.PI * 2;
      b.vx += Math.cos(kickAngle) * 3.5;
      b.vy += Math.sin(kickAngle) * 3.5;
    }

    const friction = idle ? IDLE_FRICTION : SPIN_FRICTION;
    b.vx *= friction;
    b.vy *= friction;

    const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if(currentSpeed > MAX_SPIN_SPEED){
      b.vx = b.vx / currentSpeed * MAX_SPIN_SPEED;
      b.vy = b.vy / currentSpeed * MAX_SPIN_SPEED;
    }

    b.x += b.vx;
    b.y += b.vy;

    if(b.x < CAGE_LEFT){
      b.x = CAGE_LEFT;
      b.vx = -b.vx * (idle ? IDLE_BOUNCE : WALL_BOUNCE);
      b.isSleeping = false;
    }
    if(b.x + b.size > CAGE_RIGHT){
      b.x = CAGE_RIGHT - b.size;
      b.vx = -b.vx * (idle ? IDLE_BOUNCE : WALL_BOUNCE);
      b.isSleeping = false;
    }
    if(b.y < CAGE_TOP){
      b.y = CAGE_TOP;
      b.vy = -b.vy * (idle ? IDLE_BOUNCE : WALL_BOUNCE);
      b.isSleeping = false;
    }
    if(b.y + b.size > CAGE_BOTTOM){
      b.y = CAGE_BOTTOM - b.size;
      b.vy = -b.vy * (idle ? IDLE_BOUNCE : WALL_BOUNCE);
      b.isSleeping = false;
    }
  }

  for(let iter = 0; iter < SEPARATE_ITERATION; iter++){
    ballToBallCollision(idle ? IDLE_BOUNCE : BALL_BOUNCE);
  }

  if(idle){
    for(let b of eggList){
      if(!b.isFallingToTube && !b.isSleeping &&
         Math.hypot(b.vx, b.vy) < IDLE_SLEEP_SPEED){
        b.vx = 0;
        b.vy = 0;
        b.isSleeping = true;
      }
    }
  }

  for(let b of eggList){
    b.dom.style.left = b.x + 'px';
    b.dom.style.top = b.y + 'px';
  }
}

function ballToBallCollision(restitution){
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
          if(!isRunning && Math.abs(dot) > IDLE_SLEEP_SPEED){
            a.isSleeping = false;
            b.isSleeping = false;
          }
          const impulse = -(1 + restitution) * dot * 0.5;
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
    requestAnimationFrame(loop);
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
    b.isSleeping = false;
    b.isFallingToTube = false;
    b.dom.style.transition = 'none';
    b.dom.style.visibility = 'visible';
  }

  await sleep(spinDuration);

  isRunning = false;
  prizeBall.isFallingToTube = true;
  const dropX = CAGE_HALF - prizeBall.radius;
  const dropY = CAGE_BOTTOM - 2 * prizeBall.radius - 4;
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
