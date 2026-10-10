/* Áudio 100% sintetizado (WebAudio): música de fundo oriental pentatônica + efeitos. */
const Sound = (() => {
  let ctx, master, musicBus, sfxBus, musicOn = true, sfxOn = true, timer = null, step = 0, nextT = 0;
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81]; // ré maior pentatônica

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .9;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? .5 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0; sfxBus.connect(master);
    if (musicOn) startMusic();
  }

  function tone(freq, t, dur, { type = 'sine', vol = .3, bus = sfxBus, slide = 0, attack = .005 } = {}) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t, dur, vol, hp = 2000, bus = sfxBus) {
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(bus); s.start(t);
  }
  const pluck = (m, t, vol = .22, bus = musicBus) => { tone(N(m), t, .5, { type: 'triangle', vol, bus }); tone(N(m + 12), t, .25, { type: 'sine', vol: vol * .4, bus }); };

  // ---- música: 8 compassos de 8 colcheias, melodia que caminha pela pentatônica
  const BASS = [50, 50, 57, 57, 52, 52, 57, 54];
  let pos = 4;
  function scheduleStep(t) {
    const bar = Math.floor(step / 8) % 8, beat = step % 8;
    if (beat === 0) tone(N(BASS[bar] - 12), t, .9, { type: 'sine', vol: .35, bus: musicBus });
    if (beat === 4) tone(N(BASS[bar] - 5), t, .5, { type: 'sine', vol: .2, bus: musicBus });
    if (beat % 2 === 0) noise(t, .04, .05, 6000, musicBus);               // chocalho
    if (beat === 0 || beat === 4) tone(180, t, .12, { type: 'square', vol: .06, bus: musicBus, slide: .5 }); // bloco de madeira
    if (Math.random() < .72) {
      pos = Math.max(0, Math.min(PENTA.length - 1, pos + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      pluck(PENTA[pos], t + (beat % 2 ? .02 : 0), .2);
    }
    if (beat === 0 && bar % 2 === 0) { tone(N(PENTA[0] + 12), t, 1.2, { type: 'sine', vol: .08, bus: musicBus }); }
    step++;
  }
  function startMusic() {
    if (!ctx || timer) return;
    nextT = ctx.currentTime + .1;
    timer = setInterval(() => { while (nextT < ctx.currentTime + .4) { scheduleStep(nextT); nextT += .2; } }, 100);
  }
  function stopMusic() { clearInterval(timer); timer = null; }

  // ---- efeitos
  const api = {
    init,
    setMusic(on) { musicOn = on; if (!ctx) return; musicBus.gain.setTargetAtTime(on ? .5 : 0, ctx.currentTime, .1); on ? startMusic() : stopMusic(); },
    setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? 1 : 0; },
    // Aliases compatíveis com @pixi/sound (SoundToggleButton do slot-game).
    muteAll() { api.setMusic(false); api.setSfx(false); musicOn = sfxOn = false; },
    unmuteAll() { musicOn = sfxOn = true; api.setMusic(true); api.setSfx(true); },
    isMuted() { return !musicOn && !sfxOn; },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    click() { if (!ctx) return; tone(900, ctx.currentTime, .06, { type: 'square', vol: .08, slide: .6 }); },
    spin() { if (!ctx) return; const t = ctx.currentTime; noise(t, .5, .12, 800); tone(220, t, .5, { type: 'sawtooth', vol: .07, slide: 3 }); },
    tick() { if (!ctx) return; tone(1400 + Math.random() * 300, ctx.currentTime, .03, { type: 'square', vol: .035 }); },
    stop(i = 0) { if (!ctx) return; const t = ctx.currentTime; tone(140, t, .18, { type: 'sine', vol: .5, slide: .4 }); noise(t, .06, .12, 1500); tone(N(62 + i * 4), t, .2, { type: 'triangle', vol: .08 }); },
    anticipation() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 8; i++) tone(N(60 + i * 2), t + i * .1, .12, { type: 'square', vol: .05 }); },
    lock() { if (!ctx) return; const t = ctx.currentTime; tone(N(74), t, .15, { type: 'square', vol: .1 }); tone(N(81), t + .1, .4, { type: 'triangle', vol: .2 }); noise(t, .3, .1, 4000); },
    coin(i = 0) { if (!ctx) return; const t = ctx.currentTime; tone(N(86 + (i % 4) * 2), t, .12, { type: 'square', vol: .06 }); tone(N(93 + (i % 4) * 2), t + .05, .35, { type: 'sine', vol: .12 }); },
    win(level = 1) {
      if (!ctx) return; const t = ctx.currentTime, notes = [74, 78, 81, 86, 90, 93];
      for (let i = 0; i < Math.min(3 + level, 6); i++) { tone(N(notes[i]), t + i * .08, .5, { type: 'triangle', vol: .2 }); tone(N(notes[i] + 12), t + i * .08, .3, { type: 'sine', vol: .06 }); }
      noise(t, .4, .08, 5000);
    },
    big() {
      if (!ctx) return; const t = ctx.currentTime;
      [62, 66, 69, 74, 78, 81, 86].forEach((m, i) => { tone(N(m), t + i * .1, .9, { type: 'sawtooth', vol: .1 }); tone(N(m + 12), t + i * .1, .6, { type: 'triangle', vol: .12 }); });
      tone(N(38), t, 1.8, { type: 'sine', vol: .5 }); noise(t, 1.2, .15, 3000);
      for (let i = 0; i < 14; i++) tone(N(90 + (i % 5) * 2), t + .7 + i * .06, .2, { type: 'sine', vol: .08 });
    },
    // Camada de intensidade: sobe a música por alguns segundos em grandes vitórias.
    boost(ms = 1500) {
      if (!ctx || !musicOn) return;
      const now = ctx.currentTime; musicBus.gain.cancelScheduledValues(now); musicBus.gain.setTargetAtTime(.8, now, .05);
      clearTimeout(api._boostT); api._boostT = setTimeout(() => { if (ctx && musicOn) musicBus.gain.setTargetAtTime(.5, ctx.currentTime, .4); }, ms);
    },
    levelup() { if (!ctx) return; const t = ctx.currentTime; [69, 73, 76, 81, 85].forEach((m, i) => tone(N(m), t + i * .09, .6, { type: 'triangle', vol: .2 })); },
    gong() { if (!ctx) return; const t = ctx.currentTime; tone(N(50), t, 2.4, { type: 'sine', vol: .4, slide: .98 }); tone(N(57.2), t, 2, { type: 'sine', vol: .2 }); noise(t, .3, .1, 800); },
  };
  return api;
})();
