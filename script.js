const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Safe localStorage helpers */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ============ Sound (off by default) ============ */
let audio = null, soundOn = false;
function beep(freq = 660, dur = 0.09, type = "square", vol = 0.035) {
  if (!soundOn) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(audio.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.stop(audio.currentTime + dur);
  } catch (e) {}
}
function jingle() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.14, "triangle", 0.05), i * 110)); }
$("#snd").classList.add("off");
$("#snd").addEventListener("click", e => {
  soundOn = !soundOn;
  const b = e.currentTarget;
  b.textContent = soundOn ? "🔊" : "🔇";
  b.title = "Sound effects (" + (soundOn ? "on" : "off") + ")";
  b.classList.toggle("off", !soundOn);
  beep(880, 0.1);
});

/* ============ Toast ============ */
let tt;
function toast(msg, ms = 3200) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove("show"), ms);
}

/* ============ Crosshair cursor (desktop only, toggleable) ============ */
const xh = $("#xh"), curBtn = $("#cur");
const finePointer = matchMedia("(pointer: fine)").matches;
let xhOn = finePointer && store.get("xhair", "on") !== "off";
function applyCursor() {
  document.body.classList.toggle("xhair", xhOn);
  if (!xhOn) xh.classList.remove("on");
  curBtn.classList.toggle("off", !xhOn);
  curBtn.title = "Crosshair cursor (" + (xhOn ? "on" : "off") + ")";
}
if (!finePointer) {
  curBtn.style.display = "none";
} else {
  applyCursor();
  curBtn.addEventListener("click", () => { xhOn = !xhOn; store.set("xhair", xhOn ? "on" : "off"); applyCursor(); });
  addEventListener("pointermove", e => {
    if (!xhOn) return;
    xh.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    xh.classList.add("on");
  });
  addEventListener("pointerdown", () => {
    if (!xhOn) return;
    xh.classList.remove("hit"); void xh.offsetWidth; xh.classList.add("hit");
    beep(180, 0.05, "sawtooth", 0.03);
  });
  document.addEventListener("pointerover", e => {
    xh.classList.toggle("lock", !!e.target.closest("a, button, [role=button], .skill, .slot, .proj"));
  });
  document.addEventListener("mouseleave", () => xh.classList.remove("on"));
}

/* ============ Mobile menu ============ */
const nav = $("#nav"), menuBtn = $("#menuBtn");
function closeMenu() { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "☰"; }
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.textContent = open ? "✕" : "☰";
});
$$("a", nav).forEach(a => a.addEventListener("click", closeMenu));
addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

/* ============ Quests & XP ============ */
const QUESTS = [
  ["portrait", "Click the player portrait"],
  ["skill", "Level up a skill bar"],
  ["project", "Inspect a project mission"],
  ["inv", "Inspect 3 inventory items"],
  ["boss", "Face the boss (spot the lie)"],
  ["chest", "Open the loot chest"],
  ["time", "Survive 45 seconds on my page"]
];
const done = new Set();
QUESTS.forEach(([id, text]) => {
  const li = document.createElement("li");
  li.dataset.id = id; li.textContent = text;
  $("#qList").appendChild(li);
});
$("#qCount").textContent = "0/" + QUESTS.length;
$("#qHead").addEventListener("click", () => {
  const q = $("#quests");
  q.classList.toggle("closed");
  $("#qHead").setAttribute("aria-expanded", !q.classList.contains("closed"));
});
if (innerWidth < 700) { $("#quests").classList.add("closed"); $("#qHead").setAttribute("aria-expanded", "false"); }

function complete(id) {
  if (done.has(id)) return;
  done.add(id);
  $(`#qList li[data-id="${id}"]`).classList.add("done");
  const pct = Math.round((done.size / QUESTS.length) * 100);
  $("#xpPct").textContent = pct;
  $("#xpFill").style.width = pct + "%";
  $("#qCount").textContent = done.size + "/" + QUESTS.length;
  if (done.size === QUESTS.length) {
    levelUp();
  } else {
    toast("✔ QUEST COMPLETE: " + QUESTS.find(q => q[0] === id)[1]);
    beep(784, 0.12, "triangle", 0.05);
  }
}
function levelUp() {
  jingle();
  confetti();
  const l = $("#lvl");
  l.classList.add("show");
  setTimeout(() => l.classList.remove("show"), 3200);
}

/* ============ Typewriter class ============ */
const roles = ["Software Developer", "UI/UX Designer", "Gamer 🎮", "Photographer 📸", "Badminton Player 🏸"];
let ri = 0, ci = 0, del = false;
(function type() {
  const w = roles[ri];
  $("#typed").textContent = w.slice(0, ci);
  if (!del && ci < w.length) { ci++; setTimeout(type, 80); }
  else if (!del) { del = true; setTimeout(type, 1300); }
  else if (ci > 0) { ci--; setTimeout(type, 38); }
  else { del = false; ri = (ri + 1) % roles.length; setTimeout(type, 300); }
})();

/* ============ Portrait ============ */
const portrait = $("#portrait"), img = $("#photoImg");
function photoFallback() {
  img.remove();
  const d = document.createElement("div");
  d.className = "initials";
  d.textContent = "ET";
  $(".pframe").prepend(d);
}
img.addEventListener("error", photoFallback);
if (img.complete && img.naturalWidth === 0) photoFallback();

const lines = ["Hey! I'm Edmar 👋", "Ouch, that tickles! 😄", "Headshot! 🎯", "Okay, okay, I'm famous now 😎"];
let pc = 0;
function portraitClick() {
  portrait.classList.remove("glitchy"); void portrait.offsetWidth; portrait.classList.add("glitchy");
  beep(300, 0.08, "sawtooth");
  if (!done.has("portrait")) complete("portrait");
  else toast(lines[pc++ % lines.length], 1800);
}
portrait.addEventListener("click", portraitClick);
portrait.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); portraitClick(); } });

/* ============ Counters + skill segments + reveal ============ */
function countUp(el) {
  const target = +el.dataset.count, start = performance.now(), dur = 1600;
  (function step(now) {
    const k = Math.min((now - start) / dur, 1);
    el.textContent = Math.floor(target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  })(start);
}
$$(".skill").forEach(s => {
  const segs = $(".segs", s);
  for (let i = 0; i < 20; i++) segs.appendChild(document.createElement("i"));
});
function fillSkill(s, delay = 0) {
  const n = Math.round(+s.dataset.level / 5);
  const bars = $$(".segs i", s);
  bars.forEach(b => b.classList.remove("on"));
  bars.slice(0, n).forEach((b, i) => setTimeout(() => b.classList.add("on"), delay + i * 45));
}
$$("[data-count]").forEach(countUp);
const io = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("show");
    $$(".skill", e.target).forEach((s, i) => fillSkill(s, 250 + i * 220));
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
$$(".rev").forEach(el => io.observe(el));

/* Skills: click to "level up" */
$$(".skill").forEach(s => {
  const act = () => {
    s.classList.add("boost");
    fillSkill(s);
    beep(988, 0.1, "triangle", 0.05);
    setTimeout(() => s.classList.remove("boost"), 1600);
    complete("skill");
  };
  s.addEventListener("click", act);
  s.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
});

/* Projects: hover/click/focus a card counts as inspecting a mission */
$$(".proj").forEach(p => {
  const inspect = () => { p.classList.add("seen"); setTimeout(() => p.classList.remove("seen"), 900); beep(700, 0.08, "triangle", 0.04); complete("project"); };
  p.addEventListener("click", inspect);
  p.addEventListener("focus", () => complete("project"));
});
/* Hide broken project images so the "NO IMAGE YET" placeholder shows */
$$(".proj-img img").forEach(im => {
  im.addEventListener("error", () => im.remove());
  if (im.complete && im.naturalWidth === 0) im.remove();
});

/* ============ Nav scroll-spy ============ */
const spyLinks = $$(".hud nav a");
const spy = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    spyLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
$$("main section[id]").forEach(s => spy.observe(s));

/* ============ Inventory ============ */
const seen = new Set();
const colors = { COMMON: "var(--common)", RARE: "var(--rare)", EPIC: "var(--epic)", LEGENDARY: "var(--legendary)" };
$$(".slot").forEach(slot => {
  slot.addEventListener("click", () => {
    $$(".slot").forEach(s => s.classList.remove("sel"));
    slot.classList.add("sel", "seen");
    const d = $("#detail");
    d.style.setProperty("--dc", colors[slot.dataset.rarity]);
    $("#dRarity").textContent = slot.dataset.rarity + " ITEM";
    $("#dName").textContent = slot.dataset.name;
    $("#dDesc").textContent = slot.dataset.desc;
    d.classList.remove("flash"); void d.offsetWidth; d.classList.add("flash");
    seen.add(slot.dataset.name);
    $("#dCount").textContent = seen.size;
    beep(520 + seen.size * 60, 0.07, "square");
    if (seen.size === 3) complete("inv");
  });
});

/* ============ Boss fight (two truths & a lie) ============ */
let lives = 3, fightOver = false;
function endFight(won) {
  fightOver = true;
  $$(".move").forEach(m => {
    m.disabled = true;
    if (m.dataset.lie === "true") m.classList.add("lie");
  });
  if (won) {
    $("#bossHp").style.width = "0%";
    $("#bossAv").classList.add("dead");
    $("#bossResult").textContent = "🎯 K.O.! You caught the lie, you know me well already!";
    confetti();
    jingle();
  } else {
    $("#bossResult").textContent = "💀 Out of lives! The red one was the lie. GG!";
  }
  complete("boss");
}
$$(".move").forEach(btn => {
  btn.addEventListener("click", () => {
    if (fightOver) return;
    const bossAv = $("#bossAv");
    if (btn.dataset.lie === "true") {
      endFight(true);
    } else {
      lives--;
      btn.classList.add("truth");
      btn.disabled = true;
      $("#hearts").textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
      bossAv.classList.remove("hurt"); void bossAv.offsetWidth; bossAv.classList.add("hurt");
      $("#bossResult").textContent = "😅 That one's TRUE! −1 life. Try another.";
      beep(150, 0.18, "sawtooth", 0.05);
      if (lives === 0) endFight(false);
    }
  });
});

/* ============ Loot chest ============ */
const loot = [
  "🎮 Fun fact: a clutch round is my favorite feeling in the world.",
  "☕ Fun fact: coffee is basically my main power-up.",
  "🎧 I code and design best with Joji or Justin Bieber playing.",
  "📸 I edit photos for fun: sharp angles, strong stories.",
  "🚀 Dream drop: ship web and mobile apps people love using.",
  "🏸 Challenge me to badminton, I never say no!"
];
let li = 0;
$("#chest").addEventListener("click", e => {
  const c = e.currentTarget;
  c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
  setTimeout(() => {
    c.textContent = ["💎", "🏆", "🎁", "⭐"][li % 4];
    $("#lootText").textContent = loot[li++ % loot.length];
    beep(880, 0.1, "triangle", 0.05);
    confetti();
    complete("chest");
  }, 450);
});

/* ============ Contact form (opens the visitor's email app) ============ */
const form = $("#cform"), note = $("#fNote");
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#cName"), mail = $("#cMail"), msg = $("#cMsg");
  let ok = true;
  [name, mail, msg].forEach(f => {
    const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value.trim()));
    f.classList.toggle("bad", bad);
    if (bad) ok = false;
  });
  note.classList.toggle("err", !ok);
  if (!ok) { note.textContent = "Please fill in all fields with a valid email."; return; }
  const subject = encodeURIComponent("Portfolio message from " + name.value.trim());
  const body = encodeURIComponent(msg.value.trim() + "\n\n— " + name.value.trim() + " (" + mail.value.trim() + ")");
  note.textContent = "Opening your email app… thanks for reaching out! 🎮";
  location.href = "mailto:edmarbulawin59@gmail.com?subject=" + subject + "&body=" + body;
  beep(880, 0.1, "triangle", 0.05);
});

/* ============ Session clock + friendly nudges ============ */
let secs = 0;
setInterval(() => {
  secs++;
  $("#sess").textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
  if (secs === 12 && done.size === 0) toast("💡 Tip: click my portrait to start your first quest!", 4200);
  if (secs === 28 && done.size < 3) toast("🎯 Check the Quest Log (bottom-right) for things to do!", 4200);
  if (secs === 45) complete("time");
}, 1000);

/* ============ Background particles (pauses when tab hidden) ============ */
const fx = $("#fx"), fctx = fx.getContext("2d");
let W, H, bits = [], mx = 0, my = 0;
function resize() {
  W = fx.width = innerWidth; H = fx.height = innerHeight;
  bits = Array.from({ length: Math.min(55, Math.floor((W * H) / 26000)) }, () => ({
    x: Math.random() * W, y: Math.random() * H, s: Math.random() * 8 + 3,
    v: Math.random() * 0.35 + 0.1, d: Math.random() * 0.6 + 0.2, red: Math.random() > 0.6, o: Math.random() * 0.25 + 0.08
  }));
}
addEventListener("resize", resize);
addEventListener("pointermove", e => { mx = e.clientX / W - 0.5; my = e.clientY / H - 0.5; });
resize();
(function draw() {
  if (!document.hidden) {
    fctx.clearRect(0, 0, W, H);
    bits.forEach(b => {
      b.y -= b.v; if (b.y < -20) { b.y = H + 20; b.x = Math.random() * W; }
      const x = b.x + mx * 60 * b.d, y = b.y + my * 40 * b.d;
      fctx.save();
      fctx.translate(x, y); fctx.rotate(Math.PI / 4);
      fctx.strokeStyle = b.red ? `rgba(255,70,85,${b.o + 0.1})` : `rgba(62,230,196,${b.o})`;
      fctx.lineWidth = 1.5;
      fctx.strokeRect(-b.s / 2, -b.s / 2, b.s, b.s);
      fctx.restore();
    });
  }
  requestAnimationFrame(draw);
})();

/* ============ Confetti ============ */
const cv = $("#confetti"), cx = cv.getContext("2d");
let conf = [], running = false;
function confetti() {
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ["#ff4655", "#3ee6c4", "#ffb02e", "#ece8e1", "#b066ff"];
  for (let i = 0; i < 140; i++)
    conf.push({
      x: innerWidth / 2, y: innerHeight * 0.6,
      vx: (Math.random() - 0.5) * 18, vy: Math.random() * -16 - 3,
      s: Math.random() * 9 + 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
      c: cols[i % cols.length], life: 150
    });
  if (!running) { running = true; requestAnimationFrame(tick); }
}
function tick() {
  cx.clearRect(0, 0, cv.width, cv.height);
  conf = conf.filter(b => b.life > 0);
  conf.forEach(b => {
    b.vy += 0.38; b.x += b.vx; b.y += b.vy; b.rot += b.vr; b.life--;
    cx.save(); cx.translate(b.x, b.y); cx.rotate(b.rot);
    cx.globalAlpha = Math.min(1, b.life / 40); cx.fillStyle = b.c;
    cx.fillRect(-b.s / 2, -b.s / 3, b.s, b.s * 0.6);
    cx.restore();
  });
  if (conf.length) requestAnimationFrame(tick);
  else { running = false; cx.clearRect(0, 0, cv.width, cv.height); }
}

/* Welcome */
setTimeout(() => toast("🎮 Welcome, player! Complete the " + QUESTS.length + " quests to level up."), 1700);
