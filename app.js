const game = {
  aether: 0,
  voidShards: 0,
  timeEchoes: 0,
  lastSaveTime: Date.now(),
  
  aetherMultiplier: 1.0,
  idleMultiplier: 1.0,
  clickPower: 1,
  totalAetherEarned: 0,

  upgrades: {
    click1: { lvl: 0, baseCost: 10, costMult: 1.25, val: 1, name: "Force Projection", icon: "fa-hand-fist" },
    click2: { lvl: 0, baseCost: 150, costMult: 1.28, val: 5, name: "Resonant Attunement", icon: "fa-wand-magic" },
    click3: { lvl: 0, baseCost: 2500, costMult: 1.32, val: 25, name: "Wild Resonance", icon: "fa-leaf" },
    click4: { lvl: 0, baseCost: 25000, costMult: 1.35, val: 150, name: "Cosmic Siphon", icon: "fa-bolt" }
  },

  weavers: {
    w1: { owned: 0, baseCost: 15, costMult: 1.15, mps: 0.2, name: "Dust Sprite", icon: "fa-ghost" },
    w2: { owned: 0, baseCost: 100, costMult: 1.15, mps: 2.0, name: "Rune Scribe", icon: "fa-pencil" },
    w3: { owned: 0, baseCost: 1100, costMult: 1.16, mps: 12.0, name: "Alchemy Golem", icon: "fa-robot" },
    w4: { owned: 0, baseCost: 12000, costMult: 1.18, mps: 85.0, name: "Void Siphon", icon: "fa-tornado" },
    w5: { owned: 0, baseCost: 130000, costMult: 1.20, mps: 450.0, name: "Chronos Weaver", icon: "fa-clock" },
    w6: { owned: 0, baseCost: 1500000, costMult: 1.22, mps: 3200.0, name: "Astral Architect", icon: "fa-compass-drafting" }
  },

  relics: {
    hourglass: { crafted: false, costAether: 5000, costVoid: 0, name: "Chrono-hourglass", desc: "+10% global yield boost." },
    guard: { crafted: false, costAether: 20000, costVoid: 10, name: "Nexus Guard", desc: "Stabilizes automated collectors." },
    ignite: { crafted: false, costAether: 150000, costVoid: 150, name: "Solar Ignite", desc: "+50% Expedition exploration speed." },
    crown: { crafted: false, costAether: 1200000, costVoid: 1000, name: "Archmage's Crown", desc: "Triples standard manual click strength." }
  },

  expedition: { active: false, zone: null, progress: 0, totalTime: 0, timeLeft: 0 },

  lore: [
    { trigger: 10, unlocked: false, title: "The Shattered Dawn", snippet: "Aetheria fell quietly, splitting into endless crystal debris.", mult: 1.1 },
    { trigger: 500, unlocked: false, title: "The First Thread", snippet: "Mages wove light to bridge fractured islands.", mult: 1.15 },
    { trigger: 10000, unlocked: false, title: "Void Marauders", snippet: "Dark entities emerged from spatial fractures.", mult: 1.1 },
    { trigger: 150000, unlocked: false, title: "Weaver's Ascension", snippet: "A mortal mind synchronized with the core.", mult: 1.25 }
  ]
};

const zones = {
  meadow: { title: "Whispering Meadow", duration: 10, voidMin: 10, voidMax: 30 },
  ruins: { title: "Echoing Ruins", duration: 30, voidMin: 50, voidMax: 120 },
  breach: { title: "Void Breach", duration: 90, voidMin: 500, voidMax: 1500 }
};

window.addEventListener('DOMContentLoaded', () => {
  loadGame();
  renderUpgrades();
  renderWeavers();
  renderRelics();
  renderZones();
  
  setInterval(gameTick, 100);
  setInterval(saveGame, 15000);

  document.getElementById('nexus-orb').addEventListener('click', handleNexusClick);
  document.getElementById('btn-save').addEventListener('click', () => { saveGame(); showToast("Saved", "Progress stored to browser cache.", "fa-floppy-disk"); });
  document.getElementById('btn-prestige').addEventListener('click', handlePrestige);
});

function handleNexusClick(e) {
  let p = game.clickPower;
  Object.keys(game.upgrades).forEach(k => p += game.upgrades[k].lvl * game.upgrades[k].val);
  p *= game.aetherMultiplier;
  if (game.relics.crown.crafted) p *= 3;

  game.aether += p;
  game.totalAetherEarned += p;
  spawnFloatingText(e.clientX, e.clientY, `+${Math.floor(p)}`);
  updateUI();
}

function gameTick() {
  let mps = 0;
  Object.keys(game.weavers).forEach(k => mps += game.weavers[k].owned * game.weavers[k].mps);
  const add = (mps * game.idleMultiplier) / 10;
  
  game.aether += add;
  game.totalAetherEarned += add;

  if (game.expedition.active) {
    let speed = 0.1;
    if (game.relics.ignite.crafted) speed *= 1.5;
    game.expedition.timeLeft -= speed;
    
    let pct = Math.min(100, ((game.expedition.totalTime - game.expedition.timeLeft) / game.expedition.totalTime) * 100);
    document.getElementById('ex-progress-bar').style.width = `${pct}%`;

    if (game.expedition.timeLeft <= 0) {
      game.expedition.active = false;
      const z = zones[game.expedition.zone];
      const rew = Math.floor(Math.random() * (z.voidMax - z.voidMin)) + z.voidMin;
      game.voidShards += rew;
      showToast("Expedition Complete", `Gained +${rew} Void Shards!`, "fa-trophy");
    }
  }

  checkLore();
  updateUI();
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-content-${tabId}`).classList.remove('hidden');
}

function renderUpgrades() {
  const c = document.getElementById('upgrades-container');
  c.innerHTML = '';
  Object.keys(game.upgrades).forEach(k => {
    const u = game.upgrades[k];
    c.innerHTML += `
      <button onclick="buyUpgrade('${k}')" class="p-3 bg-slate-900 border border-slate-800 rounded-lg text-left hover:border-purple-500 transition">
        <div class="text-xs font-bold">${u.name}</div>
        <div class="text-[10px] text-slate-400">+${u.val} Base Power</div>
        <div class="text-xs text-purple-400 font-mono mt-1" id="cost-up-${k}">Cost: 0</div>
      </button>
    `;
  });
}

function renderWeavers() {
  const c = document.getElementById('weavers-container');
  c.innerHTML = '';
  Object.keys(game.weavers).forEach(k => {
    const w = game.weavers[k];
    c.innerHTML += `
      <div class="glass-panel p-4 rounded-xl flex flex-col justify-between">
        <div>
          <h4 class="font-cinzel text-sm font-bold text-slate-200">${w.name}</h4>
          <p class="text-[10px] text-slate-400">Generates +${w.mps} Aether/s</p>
        </div>
        <button onclick="buyWeaver('${k}')" class="mt-3 w-full bg-slate-900 border border-slate-700 py-1 rounded text-xs" id="cost-wv-${k}">Buy</button>
      </div>
    `;
  });
}

function renderRelics() {
  const c = document.getElementById('relics-container');
  c.innerHTML = '';
  Object.keys(game.relics).forEach(k => {
    const r = game.relics[k];
    c.innerHTML += `
      <div class="glass-panel p-4 rounded-xl space-y-2">
        <h4 class="font-cinzel text-xs font-bold text-slate-200">${r.name}</h4>
        <p class="text-[10px] text-slate-400">${r.desc}</p>
        <button onclick="craftRelic('${k}')" id="btn-relic-${k}" class="bg-blue-900/60 border border-blue-500 text-[10px] px-3 py-1 rounded">Craft</button>
      </div>
    `;
  });
}

function renderZones() {
  const c = document.getElementById('zones-container');
  c.innerHTML = '';
  Object.keys(zones).forEach(k => {
    const z = zones[k];
    c.innerHTML += `
      <div class="glass-panel p-4 rounded-xl flex flex-col justify-between">
        <div>
          <h4 class="font-cinzel text-xs font-bold">${z.title}</h4>
          <p class="text-[10px] text-slate-400">Duration: ${z.duration}s</p>
        </div>
        <button onclick="startExpedition('${k}')" class="mt-2 bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-xs py-1 rounded">Dispatch</button>
      </div>
    `;
  });
}

function buyUpgrade(k) {
  const u = game.upgrades[k];
  const cost = Math.round(u.baseCost * Math.pow(u.costMult, u.lvl));
  if (game.aether >= cost) {
    game.aether -= cost;
    u.lvl++;
    updateUI();
  }
}

function buyWeaver(k) {
  const w = game.weavers[k];
  const cost = Math.round(w.baseCost * Math.pow(w.costMult, w.owned));
  if (game.aether >= cost) {
    game.aether -= cost;
    w.owned++;
    updateUI();
  }
}

function craftRelic(k) {
  const r = game.relics[k];
  if (!r.crafted && game.aether >= r.costAether && game.voidShards >= r.costVoid) {
    game.aether -= r.costAether;
    game.voidShards -= r.costVoid;
    r.crafted = true;
    showToast("Relic Crafted", `${r.name} active!`, "fa-hammer");
    updateUI();
  }
}

function startExpedition(k) {
  if (game.expedition.active) return;
  const z = zones[k];
  game.expedition = { active: true, zone: k, progress: 0, totalTime: z.duration, timeLeft: z.duration };
  document.getElementById('current-ex-title').innerText = z.title;
}

function checkLore() {
  game.lore.forEach(l => {
    if (!l.unlocked && game.totalAetherEarned >= l.trigger) {
      l.unlocked = true;
      showToast("Lore Found", l.title, "fa-book");
    }
  });
}

function updateUI() {
  document.getElementById('res-aether').innerText = Math.floor(game.aether).toLocaleString();
  document.getElementById('res-void').innerText = Math.floor(game.voidShards).toLocaleString();
  document.getElementById('res-echoes').innerText = Math.floor(game.timeEchoes).toLocaleString();

  Object.keys(game.upgrades).forEach(k => {
    const u = game.upgrades[k];
    const cost = Math.round(u.baseCost * Math.pow(u.costMult, u.lvl));
    const el = document.getElementById(`cost-up-${k}`);
    if (el) el.innerText = `Cost: ${cost.toLocaleString()}`;
  });

  Object.keys(game.weavers).forEach(k => {
    const w = game.weavers[k];
    const cost = Math.round(w.baseCost * Math.pow(w.costMult, w.owned));
    const el = document.getElementById(`cost-wv-${k}`);
    if (el) el.innerText = `Buy (${w.owned}) - ${cost.toLocaleString()}`;
  });
}

function spawnFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.className = "click-particle font-cinzel text-xs font-bold text-purple-300 drop-shadow-md z-50";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.innerText = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function showToast(title, body, icon) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = "glass-panel p-3 rounded-xl border border-slate-800 text-xs space-y-1";
  t.innerHTML = `<div class="font-bold text-purple-400"><i class="fa-solid ${icon}"></i> ${title}</div><div class="text-slate-400">${body}</div>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function handlePrestige() {
  if (game.totalAetherEarned < 100000) return;
  const echoes = Math.floor(Math.sqrt(game.totalAetherEarned / 100000));
  game.timeEchoes += echoes;
  game.aether = 0;
  game.voidShards = 0;
  game.totalAetherEarned = 0;
  Object.keys(game.upgrades).forEach(k => game.upgrades[k].lvl = 0);
  Object.keys(game.weavers).forEach(k => game.weavers[k].owned = 0);
  updateUI();
  showToast("Prestige Achieved", `Forged ${echoes} Time Echoes.`, "fa-skull");
}

function saveGame() {
  game.lastSaveTime = Date.now();
  localStorage.setItem('aetheria_v2_save', JSON.stringify(game));
}

function loadGame() {
  const raw = localStorage.getItem('aetheria_v2_save');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      Object.assign(game, parsed);
      
      // Offline calculation logic
      const diff = (Date.now() - (game.lastSaveTime || Date.now())) / 1000;
      if (diff > 5) {
        let mps = 0;
        Object.keys(game.weavers).forEach(k => mps += (game.weavers[k].owned || 0) * game.weavers[k].mps);
        const gains = Math.floor(mps * diff * 0.5); // 50% idle offline efficiency rate
        game.aether += gains;
        game.totalAetherEarned += gains;
        showToast("Welcome Back!", `Gathered +${gains.toLocaleString()} Aether while away.`, "fa-moon");
      }
    } catch(e) {}
  }
}
