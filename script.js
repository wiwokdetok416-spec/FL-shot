(() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SAFE_MAX = 3;      // kedipan/detik (pedoman aksesibilitas WCAG: maks 3)
  const UNLOCK_MAX = 10;   // batas mutlak, tidak bisa dilewati
  const MIN_HZ = 0.5;

  let speedPct = 50;       // posisi slider 0..100
  let volume = 0.15;       // 0..1
  let muted = false;
  let unlocked = false;
  let running = false;

  const maxHz = () => (unlocked && !reduceMotion) ? UNLOCK_MAX : SAFE_MAX;
  const hz = () => MIN_HZ + (speedPct / 100) * (maxHz() - MIN_HZ);

  /* ---------- Peringatan ---------- */
  const agree = $('agree'), enter = $('enter'), warning = $('warning');
  agree.addEventListener('change', () => { enter.disabled = !agree.checked; });
  enter.addEventListener('click', () => warning.classList.add('hidden'));

  /* ---------- Suara (Web Audio, tanpa file audio) ---------- */
  let ac, master, comp, oscA, oscB, noiseSrc;

  function ensureAudio() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    comp = ac.createDynamicsCompressor();   // meredam puncak suara
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(comp).connect(ac.destination);
  }

  function startSound() {
    ensureAudio();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();

    oscA = ac.createOscillator(); oscA.type = 'square';
    oscB = ac.createOscillator(); oscB.type = 'sawtooth';
    const ga = ac.createGain(); ga.gain.value = 0.5;
    const gb = ac.createGain(); gb.gain.value = 0.4;
    oscA.connect(ga).connect(master);
    oscB.connect(gb).connect(master);

    const len = ac.sampleRate;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseSrc = ac.createBufferSource();
    noiseSrc.buffer = buf; noiseSrc.loop = true;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const gn = ac.createGain(); gn.gain.value = 0.3;
    noiseSrc.connect(hp).connect(gn).connect(master);

    setTone(false);
    oscA.start(); oscB.start(); noiseSrc.start();
    applyVolume(0.25);   // naik pelan agar tidak mengagetkan
  }

  function stopSound() {
    if (!ac || !master) return;
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(0, ac.currentTime, 0.03);
    const nodes = [oscA, oscB, noiseSrc];
    setTimeout(() => nodes.forEach(n => { try { n && n.stop(); } catch (e) {} }), 250);
  }

  // Nada ganti setiap kali layar ganti warna: putih = tinggi, hitam = rendah
  function setTone(white) {
    if (!ac || !oscA) return;
    const t = ac.currentTime;
    oscA.frequency.setValueAtTime(white ? 2300 : 330, t);
    oscB.frequency.setValueAtTime(white ? 1170 : 165, t);
  }

  function applyVolume(timeConst = 0.05) {
    if (!ac || !master) return;
    // Kuadratik + batas 0.35 supaya naik halus dan tidak melengking
    const level = muted ? 0 : volume * volume * 0.35;
    master.gain.setTargetAtTime(level, ac.currentTime, timeConst);
  }

  /* ---------- Kedipan ---------- */
  let phase = 0, lastT = 0, isWhite = false, raf = 0;

  function setWhite(w) {
    if (w === isWhite) return;
    isWhite = w;
    stage.classList.toggle('white', w);
    setTone(w);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastT) / 1000, 0.1);
    lastT = now;
    phase += dt * hz();
    setWhite(Math.floor(phase * 2) % 2 === 1);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    $('play').disabled = true;
    $('stop').disabled = false;
    phase = 0; isWhite = true; setWhite(false);
    startSound();
    lastT = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    stage.classList.remove('white');
    isWhite = false;
    stopSound();
    $('play').disabled = false;
    $('stop').disabled = true;
  }

  $('play').addEventListener('click', start);
  $('stop').addEventListener('click', stop);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('blur', stop);

  /* ---------- Kontrol ---------- */
  function refreshSpeedUI() {
    $('speedOut').textContent = hz().toFixed(1);
    $('speedHint').textContent = unlocked && !reduceMotion
      ? 'Mode cepat aktif: maksimum 10 kali per detik. Hentikan jika tidak nyaman.'
      : 'Mode aman: maksimum 3 kali per detik.';
  }

  $('speed').addEventListener('input', (e) => { speedPct = +e.target.value; refreshSpeedUI(); });

  const unlockEl = $('unlock');
  if (reduceMotion) {
    unlockEl.disabled = true;
    unlockEl.parentElement.append(' (dinonaktifkan karena perangkatmu meminta animasi dikurangi)');
  }
  unlockEl.addEventListener('change', () => { unlocked = unlockEl.checked; refreshSpeedUI(); });

  $('volume').addEventListener('input', (e) => {
    volume = e.target.value / 100;
    $('volumeOut').textContent = e.target.value;
    const hint = $('volHint');
    if (volume > 0.7) hint.textContent = 'Sangat berisik. Bisa merusak pendengaran jika lama.';
    else if (volume > 0.4) hint.textContent = 'Cukup berisik.';
    else hint.textContent = 'Volume rendah.';
    applyVolume();
  });

  const muteBtn = $('mute');
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.setAttribute('aria-pressed', muted);
    muteBtn.textContent = muted ? 'Nyalakan suara' : 'Matikan suara';
    applyVolume();
  });

  refreshSpeedUI();
})();
