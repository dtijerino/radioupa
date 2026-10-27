(() => {
  'use strict';
  const cfg = window.UPAVOZ_CONFIG || {};
  const audio = document.querySelector('#radioAudio');
  const playButton = document.querySelector('#playButton');
  const miniPlay = document.querySelector('#miniPlay');
  const miniPlayer = document.querySelector('#miniPlayer');
  const status = document.querySelector('#audioStatus');
  const miniStatus = document.querySelector('#miniStatus');
  const signalLabel = document.querySelector('#signalLabel');
  const signalPill = document.querySelector('#signalPill');
  const volumeControl = document.querySelector('#volumeControl');
  const muteButton = document.querySelector('#muteButton');
  const toast = document.querySelector('#toast');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  if (!audio || !playButton) return;

  const STREAM_URL = cfg.streamUrl || '';
  const PLAYLIST_URL = cfg.playlistUrl || '';
  let lastVolume = 0.75;
  let hasPlayed = false;
  let toastTimeout;
  audio.volume = lastVolume;
  document.querySelector('#currentYear').textContent = new Date().getFullYear();

  function inform(message) {
    toast.textContent = message;
    toast.classList.add('toast-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('toast-visible'), 4200);
  }

  function setState(state, text) {
    document.body.dataset.radioState = state;
    status.textContent = text;
    const isPlaying = state === 'playing';
    const isLoading = state === 'loading';
    playButton.setAttribute('aria-label', isPlaying ? 'Pausar radio' : 'Reproducir radio');
    playButton.setAttribute('aria-pressed', String(isPlaying));
    playButton.classList.toggle('is-loading', isLoading);
    document.querySelectorAll('[data-play-trigger]').forEach(btn => {
      const textNode = btn.querySelector('span');
      if (textNode && btn.classList.contains('btn-primary')) textNode.textContent = isPlaying ? 'PAUSAR RADIO' : 'ESCUCHAR AHORA';
      btn.setAttribute('aria-label', isPlaying ? 'Pausar Upa Voz Radio' : 'Reproducir Upa Voz Radio');
    });
    signalPill.classList.toggle('is-onair', isPlaying);
    signalLabel.textContent = isPlaying ? 'REPRODUCIENDO' : isLoading ? 'CONECTANDO' : 'SEÑAL ONLINE';
    miniStatus.textContent = isPlaying ? 'REPRODUCIENDO EN VIVO' : text;
    miniPlay.textContent = isPlaying ? 'Ⅱ' : '▶';
    miniPlay.setAttribute('aria-label', isPlaying ? 'Pausar radio' : 'Reproducir radio');
    const showMini = hasPlayed && (isPlaying || isLoading);
    miniPlayer.classList.toggle('is-visible', showMini);
    miniPlayer.setAttribute('aria-hidden', String(!showMini));
    // Un control oculto no debe quedar disponible para navegación con teclado.
    miniPlay.tabIndex = showMini ? 0 : -1;
  }

  async function startRadio() {
    if (!STREAM_URL) { setState('error', 'Falta configurar el enlace HTTPS del audio.'); return; }
    setState('loading', 'Conectando con la señal de Upa Voz Radio…');
    try {
      if (!audio.src) audio.src = STREAM_URL;
      await audio.play();
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setState('paused', 'Tocá reproducir para activar el audio.');
      } else if (error.name !== 'AbortError') {
        setState('error', 'No pudimos conectar con la señal. Intentá de nuevo.');
      }
    }
  }
  function pauseRadio() { audio.pause(); }
  function toggleRadio() { audio.paused ? startRadio() : pauseRadio(); }

  playButton.addEventListener('click', toggleRadio);
  miniPlay.addEventListener('click', toggleRadio);
  document.querySelectorAll('[data-play-trigger]').forEach(btn => btn.addEventListener('click', toggleRadio));

  audio.addEventListener('playing', () => { hasPlayed = true; setState('playing', 'Estás escuchando la transmisión en vivo.'); });
  audio.addEventListener('waiting', () => { if (!audio.paused) setState('loading', 'La señal está cargando…'); });
  audio.addEventListener('stalled', () => { if (!audio.paused) setState('loading', 'Reconectando con la transmisión…'); });
  audio.addEventListener('pause', () => { if (!audio.ended) setState('paused', 'La radio está en pausa. Tocá reproducir para continuar.'); });
  audio.addEventListener('error', () => {
    setState('error', 'No se pudo abrir la señal. Podés intentar nuevamente o usar la lista de audio.');
  });

  // Volumen. En Safari/iOS la potencia sonora depende de los botones físicos.
  function syncVolume() {
    const value = Number(volumeControl.value) / 100;
    audio.volume = value;
    audio.muted = value === 0;
    if (value > 0) lastVolume = value;
    muteButton.classList.toggle('is-muted', audio.muted);
    muteButton.setAttribute('aria-label', audio.muted ? 'Activar sonido' : 'Silenciar');
    volumeControl.style.setProperty('--volume', `${value * 100}%`);
  }
  volumeControl.addEventListener('input', syncVolume);
  muteButton.addEventListener('click', () => {
    if (audio.muted || audio.volume === 0) {
      volumeControl.value = String(Math.round(lastVolume * 100));
    } else {
      volumeControl.value = '0';
    }
    syncVolume();
  });
  syncVolume();

  async function shareRadio() {
    const locationUrl = /^https?:$/.test(window.location.protocol) ? window.location.origin + window.location.pathname : window.location.href;
    const data = { title: 'Upa Voz Radio', text: 'Escuchá Upa Voz Radio, la radio que conecta con vos.', url: locationUrl };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(locationUrl);
      inform('¡Enlace copiado! Compartilo con quien querás.');
    } catch (_) {
      window.prompt('Copiá el enlace de la radio:', locationUrl);
    }
  }
  document.querySelectorAll('[data-share]').forEach(btn => btn.addEventListener('click', shareRadio));

  function closeMenu() {
    nav.classList.remove('is-open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
  }
  menuToggle.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuToggle.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 880) closeMenu(); });

  // Los navegadores no permiten reproducir emisoras automáticamente sin interacción.
  // No se usan contraseñas, llamadas administrativas ni datos privados en el navegador.
  setState('idle', 'Tocá reproducir para comenzar a escuchar.');
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
