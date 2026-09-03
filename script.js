/**
 * Random Wheel - Weighted Probability Engine & UI Controller
 * Features:
 * - High-DPI Canvas Wheel with text along radial slices
 * - Mathematically exact Weighted Random Selection
 * - Physics easing & real-time slice crossing tick audio
 * - Drag-and-drop item reordering
 * - Color palette picker
 * - Confetti celebration & Victory chime
 * - LocalStorage persistence & History tracker
 */

(function () {
  'use strict';

  // --- Constants & Color Palette (Ultra-Bright Candy Pop Spectrum) ---
  const PALETTE = [
    '#FF7A00', '#00B4D8', '#FF3366', '#FFD000',
    '#70E000', '#8338EC', '#3A86FF', '#FF4D80',
    '#00D084', '#FF9E00', '#E040FB', '#06D6A0',
    '#7B68EE', '#FF0054', '#00E5FF', '#FFBE0B'
  ];

  const DEFAULT_ITEMS = [
    { id: 'item-1', name: 'A', probability: 50, color: '#FF7A00' },
    { id: 'item-2', name: 'B', probability: 25, color: '#00B4D8' },
    { id: 'item-3', name: 'C', probability: 15, color: '#FF3366' },
    { id: 'item-4', name: 'D', probability: 10, color: '#FFD000' }
  ];

  const STORAGE_KEYS = {
    ITEMS: 'random_wheel_items',
    HISTORY: 'random_wheel_history',
    SETTINGS: 'random_wheel_settings'
  };

  // --- State Management ---
  const state = {
    items: [],
    history: [],
    settings: {
      duration: 5.0,
      soundEnabled: true,
      confettiEnabled: true,
      removeWinnerOnSpin: true,
      hidePercentage: true,
      equalSliceVisual: false,
      customProbEnabled: true
    },
    isSpinning: false,
    currentRotation: 0, // in degrees
    activeColorPickerItemId: null,
    isCenterHovered: false
  };

  // --- Web Audio Engine ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTickSound(speedRatio = 1.0) {
    if (!state.settings.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      // Mechanical wooden click sound
      osc.type = 'triangle';
      const baseFreq = 520 + Math.min(speedRatio * 300, 400);
      osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.045);
    } catch (e) {
      // Audio context might fail silently in non-user triggered contexts
    }
  }

  function playWinSound() {
    if (!state.settings.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);

        const startTime = audioCtx.currentTime + idx * 0.08;
        const duration = 0.5;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.error(e);
    }
  }

  // --- Confetti Engine ---
  const confettiCanvas = document.getElementById('confetti-canvas');
  let confettiCtx = null;
  let confettiParticles = [];
  let confettiAnimationId = null;

  function initConfetti() {
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);
  }

  function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth * window.devicePixelRatio;
    confettiCanvas.height = window.innerHeight * window.devicePixelRatio;
    if (confettiCtx) {
      confettiCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function triggerConfetti() {
    if (!state.settings.confettiEnabled || !confettiCanvas) return;
    confettiParticles = [];
    const count = 90;
    const colors = ['#FF7A00', '#00B4D8', '#FF3366', '#FFD000', '#70E000', '#8338EC', '#3A86FF', '#FF4D80', '#00E5FF', '#FF0054'];

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: window.innerWidth * (0.3 + Math.random() * 0.4),
        y: window.innerHeight * 0.45,
        w: 8 + Math.random() * 8,
        h: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: -8 - Math.random() * 12,
        gravity: 0.35 + Math.random() * 0.15,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1.0,
        fadeSpeed: 0.006 + Math.random() * 0.004
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animateConfetti();
  }

  function animateConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeCount = 0;
    for (let p of confettiParticles) {
      if (p.opacity <= 0) continue;
      activeCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.vRot;
      p.opacity -= p.fadeSpeed;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.globalAlpha = Math.max(0, p.opacity);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    }

    if (activeCount > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  // --- Wheel Canvas Engine ---
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const pointerEl = document.getElementById('wheel-pointer');

  function getWheelAngleSlices(items) {
    const totalProb = items.reduce((sum, it) => sum + (Number(it.probability) || 0), 0);
    let startAngle = 0; // in degrees, starts from 0 (top/12 o'clock relative coordinate)
    return items.map((item) => {
      const prob = Number(item.probability) || 0;
      let sliceAngle;
      if ((state.settings.equalSliceVisual || state.settings.customProbEnabled === false) && items.length > 0) {
        sliceAngle = 360 / items.length;
      } else {
        sliceAngle = totalProb > 0 ? (prob / totalProb) * 360 : (1 / items.length) * 360;
      }
      const slice = {
        ...item,
        startAngle: startAngle,
        endAngle: startAngle + sliceAngle,
        angleSize: sliceAngle
      };
      startAngle += sliceAngle;
      return slice;
    });
  }

  function renderWheel() {
    if (!canvas || !ctx) return;

    // Support High-DPI crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height > 0 ? rect.height : rect.width)) || 320;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 6;

    ctx.clearRect(0, 0, size, size);

    const items = state.items;
    if (items.length === 0) {
      return;
    }

    const slices = getWheelAngleSlices(items);
    const rotationRad = (state.currentRotation * Math.PI) / 180;

    // Draw Wheel Background & Slices
    ctx.save();
    ctx.translate(centerX, centerY);

    // Balanced clean outer border ring with soft shadow
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Draw each slice
    slices.forEach((slice) => {
      // 0 deg in our system corresponds to 12 o'clock (-90 deg in canvas polar system)
      const startRad = ((slice.startAngle - 90) * Math.PI) / 180 + rotationRad;
      const endRad = ((slice.endAngle - 90) * Math.PI) / 180 + rotationRad;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startRad, endRad);
      ctx.closePath();

      ctx.fillStyle = slice.color;
      ctx.fill();

      // Divider line (balanced and clear)
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Draw Item Name Text inside slice
      drawSliceText(ctx, slice, radius, rotationRad);
    });

    // Outer circle border
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.restore();
  }

  function drawSliceText(ctx, slice, radius, rotationRad) {
    if (!slice.name || slice.angleSize < 2) return;

    const midAngleDeg = slice.startAngle + slice.angleSize / 2;
    const midAngleRad = ((midAngleDeg - 90) * Math.PI) / 180 + rotationRad;

    ctx.save();
    ctx.rotate(midAngleRad);

    const hubRadius = Math.max(34, radius * 0.16);
    const innerR = hubRadius + 14;
    const outerR = radius - 14;
    const availableLength = outerR - innerR;
    const midR = (innerR + outerR) / 2;

    // Angular thickness available at mid-radius
    const sliceAngleRad = (slice.angleSize * Math.PI) / 180;
    const availableThickness = Math.max(10, 2 * midR * Math.sin(sliceAngleRad / 2) - 6);

    let text = slice.name.trim();
    if (!state.settings.hidePercentage && slice.probability !== undefined) {
      text = `${text} (${slice.probability}%)`;
    }

    // Determine best font size by trying decreasing sizes
    const fontSizes = [24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9];
    let chosenFontSize = 10;
    let lines = [text];
    let fits = false;

    // 1. Try single line along radius ray
    for (let size of fontSizes) {
      ctx.font = `600 ${size}px Prompt, sans-serif`;
      const textWidth = ctx.measureText(text).width;

      if (textWidth <= availableLength && size * 1.05 <= availableThickness) {
        chosenFontSize = size;
        lines = [text];
        fits = true;
        break;
      }
    }

    // 2. If single line doesn't fit, try 2 lines if thickness permits
    if (!fits && availableThickness >= 20) {
      for (let size of [14, 13, 12, 11, 10, 9]) {
        ctx.font = `600 ${size}px Prompt, sans-serif`;
        let words = [];
        if (!state.settings.hidePercentage && slice.probability !== undefined) {
          words = [slice.name.trim(), `(${slice.probability}%)`];
        } else if (text.includes(' ')) {
          const parts = text.split(' ');
          const half = Math.ceil(parts.length / 2);
          words = [parts.slice(0, half).join(' '), parts.slice(half).join(' ')];
        } else if (text.length >= 6) {
          const midIdx = Math.ceil(text.length / 2);
          words = [text.slice(0, midIdx), text.slice(midIdx)];
        }

        if (words.length === 2 && words[0] && words[1]) {
          const w1 = ctx.measureText(words[0]).width;
          const w2 = ctx.measureText(words[1]).width;
          if (Math.max(w1, w2) <= availableLength && size * 2.1 <= availableThickness) {
            chosenFontSize = size;
            lines = words;
            fits = true;
            break;
          }
        }
      }
    }

    // 3. If still too long, reduce font size to minimum and truncate with ellipsis
    if (!fits) {
      chosenFontSize = Math.min(13, Math.max(9, Math.floor(availableThickness * 0.7)));
      ctx.font = `600 ${chosenFontSize}px Prompt, sans-serif`;
      let truncated = text;
      while (truncated.length > 1 && ctx.measureText(truncated + '…').width > availableLength) {
        truncated = truncated.slice(0, -1);
      }
      lines = [truncated + (truncated.length < text.length ? '…' : '')];
    }

    // Draw text cleanly
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 ${chosenFontSize}px Prompt, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    if (lines.length === 1) {
      ctx.fillText(lines[0], midR, 0);
    } else {
      const lineHeight = chosenFontSize * 1.15;
      ctx.fillText(lines[0], midR, -lineHeight / 2);
      ctx.fillText(lines[1], midR, lineHeight / 2);
    }

    ctx.restore();
  }

  // --- Weighted / Equal Random Selection Logic ---
  function selectWeightedItem(items) {
    if (state.settings.customProbEnabled === false) {
      const randIdx = Math.floor(Math.random() * items.length);
      return items[randIdx];
    }
    const totalProb = items.reduce((sum, it) => sum + (Number(it.probability) || 0), 0);
    const rand = Math.random() * (totalProb > 0 ? totalProb : 1);
    let cumulative = 0;

    for (let item of items) {
      cumulative += Number(item.probability) || 0;
      if (rand < cumulative) {
        return item;
      }
    }
    return items[items.length - 1];
  }

  // --- Keyboard Shortcuts & Secret Bias Trigger ---
  let secretBiasIndex = null;

  window.addEventListener('keydown', (e) => {
    // 1. Support Ctrl+Enter (or Cmd+Enter on Mac) to trigger spin from anywhere
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      spinWheel();
      return;
    }

    // Ignore remaining single keys when typing inside any input or textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // 2. Space or Enter outside inputs also triggers spin
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      spinWheel();
      return;
    }

    // 3. Support numbers 1-9 (Top row numbers & Numpad) for Secret Bias
    let num = null;
    if (/^(Digit|Numpad)[1-9]$/.test(e.code) || /^[1-9]$/.test(e.key)) {
      num = parseInt(e.key, 10);
    }

    if (num !== null) {
      const targetIdx = num - 1;
      if (state.items[targetIdx]) {
        secretBiasIndex = targetIdx;
      }
    } else if (e.key === '0' || e.key === 'Escape') {
      secretBiasIndex = null; // Clear secret bias
    }
  });

  // --- Spin Wheel Controller ---
  function spinWheel() {
    if (state.isSpinning) return;

    const items = state.items;
    if (items.length === 0) return;

    const isCustom = state.settings.customProbEnabled !== false;
    const total = getTotalPercentage();
    if (isCustom && Math.abs(total - 100) > 0.01) return;

    initAudio();
    state.isSpinning = true;
    updateSpinButtonState();

    // 1. Determine the winner: check secret bias first, otherwise weighted random
    let winner;
    if (secretBiasIndex !== null && state.items[secretBiasIndex]) {
      winner = state.items[secretBiasIndex];
      secretBiasIndex = null; // Auto-reset after triggering so subsequent spins are random
    } else {
      winner = selectWeightedItem(items);
    }

    const slices = getWheelAngleSlices(items);
    const winningSlice = slices.find((s) => s.id === winner.id) || slices[0];

    // 2. Pick landing point inside the winning slice (safe margin away from borders)
    const margin = Math.min(winningSlice.angleSize * 0.2, 4);
    const minAngle = winningSlice.startAngle + margin;
    const maxAngle = winningSlice.endAngle - margin;
    const targetSliceAngle = minAngle + Math.random() * Math.max(0.1, maxAngle - minAngle);

    // 3. Compute target rotation:
    // When pointer is at 12 o'clock (0 deg), the angle on the wheel under pointer is:
    // angleOnWheel = (360 - (currentRotation % 360)) % 360.
    // So targetRotation mod 360 must be (360 - targetSliceAngle) mod 360.
    const targetMod = (360 - (targetSliceAngle % 360) + 360) % 360;
    const currentMod = (state.currentRotation % 360 + 360) % 360;
    let deltaAngle = (targetMod - currentMod + 360) % 360;

    // Minimum 6 full spins + variable delta
    const fullSpins = 6 * 360;
    const totalSpinAngle = fullSpins + deltaAngle;

    const startRotation = state.currentRotation;
    const finalRotation = startRotation + totalSpinAngle;

    const duration = (state.settings.duration || 5.0) * 1000;
    const startTime = performance.now();

    let lastTickAngle = startRotation;
    let lastSliceIdx = -1;

    // Easing function: Quartic Ease-Out for smooth deceleration
    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      state.currentRotation = startRotation + totalSpinAngle * easedProgress;

      // Detect slice boundary crossings for ticking sound & pointer wiggle
      const currentWheelAngle = (360 - (state.currentRotation % 360) + 360) % 360;
      let currentSliceIdx = slices.findIndex(
        (s) => currentWheelAngle >= s.startAngle && currentWheelAngle < s.endAngle
      );
      if (currentSliceIdx === -1) currentSliceIdx = slices.length - 1;

      if (currentSliceIdx !== lastSliceIdx && lastSliceIdx !== -1) {
        const speedRatio = 1 - progress;
        playTickSound(speedRatio);

        if (pointerEl) {
          pointerEl.classList.add('hit');
          setTimeout(() => pointerEl.classList.remove('hit'), 40);
        }
      }
      lastSliceIdx = currentSliceIdx;

      renderWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Spin complete
        state.isSpinning = false;
        state.currentRotation = finalRotation;
        renderWheel();
        updateSpinButtonState();

        // Record history
        recordHistoryItem(winner);

        // Celebratory chime & confetti
        playWinSound();
        triggerConfetti();

        // Display result modal
        showResultModal(winner);

        // Auto-remove winning item if enabled
        if (state.settings.removeWinnerOnSpin) {
          state.items = state.items.filter((it) => it.id !== winner.id);
          if (state.items.length > 0) {
            normalizeProbabilities();
          } else {
            saveItemsToStorage();
            renderEditorItems();
            renderWheel();
          }
        }
      }
    }

    requestAnimationFrame(animate);
  }

  // --- Result Modal & History ---
  const resultModal = document.getElementById('result-modal');
  const resultText = document.getElementById('result-text');
  const resultColorCircle = document.getElementById('result-color-circle');
  const resultProbValue = document.getElementById('result-prob-value');
  const resultRemovedBadge = document.getElementById('result-removed-badge');

  function showResultModal(item) {
    if (!resultModal) return;
    const name = item.name.trim();
    resultText.textContent = name;
    resultColorCircle.style.backgroundColor = item.color;
    resultProbValue.textContent = `${item.probability}%`;

    // Dynamic adaptive font scaling based on text length
    const len = name.length;
    if (len <= 4) {
      resultText.style.fontSize = '2.35rem';
    } else if (len <= 10) {
      resultText.style.fontSize = '1.9rem';
    } else if (len <= 20) {
      resultText.style.fontSize = '1.5rem';
    } else if (len <= 35) {
      resultText.style.fontSize = '1.25rem';
    } else {
      resultText.style.fontSize = '1.05rem';
    }

    if (resultRemovedBadge) {
      if (state.settings.removeWinnerOnSpin) {
        resultRemovedBadge.classList.remove('hidden');
      } else {
        resultRemovedBadge.classList.add('hidden');
      }
    }

    resultModal.classList.add('open');
  }

  function hideResultModal() {
    if (resultModal) {
      resultModal.classList.remove('open');
    }
  }

  function recordHistoryItem(item) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: item.name,
      color: item.color,
      probability: item.probability,
      timestamp: Date.now()
    };

    state.history.unshift(entry);
    if (state.history.length > 50) {
      state.history = state.history.slice(0, 50);
    }
    saveHistoryToStorage();
    renderHistoryView();
  }

  function formatRelativeTime(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 15) return 'เมื่อสักครู่';
    if (diff < 60) return `${diff} วินาทีที่แล้ว`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  }

  function renderHistoryView() {
    const tbody = document.getElementById('history-table-body');
    const emptyState = document.getElementById('history-empty');
    const summaryBar = document.getElementById('history-summary-bar');
    if (!tbody || !summaryBar) return;

    tbody.innerHTML = '';
    summaryBar.innerHTML = '';

    const history = state.history;
    if (history.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      document.querySelector('.table-responsive').classList.add('hidden');
      summaryBar.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    document.querySelector('.table-responsive').classList.remove('hidden');
    summaryBar.classList.remove('hidden');

    // Summary stats (e.g. A x5 50%)
    const counts = {};
    const colorMap = {};
    const probMap = {};
    const recent = history.slice(0, 10);

    recent.forEach((item) => {
      counts[item.name] = (counts[item.name] || 0) + 1;
      colorMap[item.name] = item.color;
      probMap[item.name] = item.probability;
    });

    Object.keys(counts).forEach((name) => {
      const pill = document.createElement('div');
      pill.className = 'stat-pill';
      const actualPct = Math.round((counts[name] / recent.length) * 100);
      pill.innerHTML = `
        <span class="stat-dot" style="background-color: ${colorMap[name] || '#FF7A00'};"></span>
        <span class="stat-name">${escapeHtml(name)} <span class="stat-count">×${counts[name]}</span></span>
        <span class="stat-pct-badge">${actualPct}%</span>
      `;
      summaryBar.appendChild(pill);
    });

    // History rows (last 10)
    recent.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>
          <div class="table-result-cell">
            <span class="stat-dot" style="background-color: ${item.color};"></span>
            <span>${escapeHtml(item.name)}</span>
          </div>
        </td>
        <td>
          <span class="table-prob-badge">${item.probability}%</span>
        </td>
        <td>${formatRelativeTime(item.timestamp)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Probability Editor & UI Controller ---
  const itemsListEl = document.getElementById('items-list');
  const itemCountEl = document.getElementById('item-count');
  const totalPercentageEl = document.getElementById('total-percentage');
  const totalStatusEl = document.getElementById('total-status');
  const statusMessageEl = document.getElementById('status-message');
  const spinBtn = document.getElementById('btn-spin');
  const emptyStateEl = document.getElementById('empty-state');
  const wheelStageEl = document.getElementById('wheel-stage');

  function getTotalPercentage() {
    return state.items.reduce((sum, it) => sum + (parseFloat(it.probability) || 0), 0);
  }

  function updateSpinButtonState() {
    const isCustom = state.settings.customProbEnabled !== false;
    const total = getTotalPercentage();
    const count = state.items.length;
    const isValid = count > 0 && (!isCustom || Math.abs(total - 100) <= 0.5);

    if (totalPercentageEl) {
      totalPercentageEl.textContent = `${Math.round(total * 10) / 10}%`;
    }

    const iconValid = document.querySelector('.icon-valid');
    const iconInvalid = document.querySelector('.icon-invalid');

    if (totalStatusEl) {
      totalStatusEl.className = 'total-status';
      if (isValid) {
        totalStatusEl.classList.add('valid');
        if (iconValid) iconValid.classList.remove('hidden');
        if (iconInvalid) iconInvalid.classList.add('hidden');
        if (statusMessageEl) {
          statusMessageEl.className = 'status-message hidden';
          statusMessageEl.textContent = '';
        }
      } else if (total < 100) {
        totalStatusEl.classList.add('invalid-less');
        if (iconValid) iconValid.classList.add('hidden');
        if (iconInvalid) iconInvalid.classList.remove('hidden');
        if (statusMessageEl) {
          statusMessageEl.className = 'status-message warning';
          statusMessageEl.textContent = 'Probability รวมไม่ถึง 100%';
        }
      } else {
        totalStatusEl.classList.add('invalid-more');
        if (iconValid) iconValid.classList.add('hidden');
        if (iconInvalid) iconInvalid.classList.remove('hidden');
        if (statusMessageEl) {
          statusMessageEl.className = 'status-message danger';
          statusMessageEl.textContent = 'Probability รวมเกิน 100%';
        }
      }
    }

    if (spinBtn) {
      spinBtn.disabled = !isValid || state.isSpinning;
    }

    const centerHubBtn = document.getElementById('btn-center-hub');
    if (centerHubBtn) {
      centerHubBtn.disabled = !isValid || state.isSpinning;
    }
  }

  function renderEditorItems() {
    if (!itemsListEl) return;
    itemsListEl.innerHTML = '';

    const isCustom = state.settings.customProbEnabled !== false;
    const editorCardEl = document.querySelector('.editor-card');
    if (editorCardEl) {
      editorCardEl.classList.toggle('hide-custom-prob', !isCustom);
    }

    const count = state.items.length;
    if (itemCountEl) {
      itemCountEl.textContent = `${count} รายการ`;
    }

    const editorColumnEl = document.getElementById('editor-column') || document.querySelector('.editor-column');
    const wheelLayoutEl = document.querySelector('.wheel-layout');

    if (count === 0) {
      if (emptyStateEl) emptyStateEl.classList.remove('hidden');
      if (wheelStageEl) wheelStageEl.classList.add('hidden');
      if (editorColumnEl) editorColumnEl.classList.add('hidden');
      if (wheelLayoutEl) wheelLayoutEl.classList.add('is-empty');
    } else {
      if (emptyStateEl) emptyStateEl.classList.add('hidden');
      if (wheelStageEl) wheelStageEl.classList.remove('hidden');
      if (editorColumnEl) editorColumnEl.classList.remove('hidden');
      if (wheelLayoutEl) wheelLayoutEl.classList.remove('is-empty');
    }

    state.items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.draggable = true;
      row.dataset.id = item.id;
      row.dataset.index = index;

      row.innerHTML = `
        <div class="drag-handle" title="ลากเพื่อเรียงลำดับ">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <circle cx="8" cy="6" r="1.8"/>
            <circle cx="16" cy="6" r="1.8"/>
            <circle cx="8" cy="12" r="1.8"/>
            <circle cx="16" cy="12" r="1.8"/>
            <circle cx="8" cy="18" r="1.8"/>
            <circle cx="16" cy="18" r="1.8"/>
          </svg>
        </div>
        <button type="button" class="color-dot-btn" style="background-color: ${item.color};" title="เปลี่ยนสี" data-id="${item.id}"></button>
        <input type="text" class="input-name" value="${escapeHtml(item.name)}" placeholder="ชื่อรายการ" data-id="${item.id}">
        <div class="prob-input-wrapper">
          <input type="number" class="input-prob" value="${item.probability}" min="0" max="100" step="any" data-id="${item.id}">
          <span class="prob-symbol">%</span>
        </div>
        <button type="button" class="btn-delete-row" title="ลบรายการ" data-id="${item.id}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      `;

      setupRowEvents(row, item);
      itemsListEl.appendChild(row);
    });

    updateSpinButtonState();
    renderWheel();
  }

  function setupRowEvents(row, item) {
    const nameInput = row.querySelector('.input-name');
    const probInput = row.querySelector('.input-prob');
    const deleteBtn = row.querySelector('.btn-delete-row');
    const colorBtn = row.querySelector('.color-dot-btn');

    nameInput.addEventListener('input', (e) => {
      item.name = e.target.value;
      saveItemsToStorage();
      renderWheel();
    });

    nameInput.addEventListener('paste', (e) => {
      const pasteData = (e.clipboardData || window.clipboardData)?.getData('text');
      if (!pasteData) return;

      const lines = pasteData
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length > 1) {
        e.preventDefault();
        const currentIdx = state.items.findIndex((it) => it.id === item.id);
        if (currentIdx === -1) return;

        lines.forEach((lineText, i) => {
          const targetIdx = currentIdx + i;
          if (targetIdx < state.items.length) {
            state.items[targetIdx].name = lineText;
          } else {
            const nextColorIdx = state.items.length;
            const color = PALETTE[nextColorIdx % PALETTE.length];
            state.items.push({
              id: 'item-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4) + i,
              name: lineText,
              probability: 0,
              color: color
            });
          }
        });

        // Automatically equalize probabilities across all items
        const count = state.items.length;
        if (count > 0) {
          const equalVal = Math.round((100 / count) * 100) / 100;
          state.items.forEach((it) => {
            it.probability = equalVal;
          });
        }

        saveItemsToStorage();
        renderEditorItems();

        const targetFocusIdx = Math.min(currentIdx + lines.length - 1, state.items.length - 1);
        const focusRow = itemsListEl.children[targetFocusIdx];
        const focusInput = focusRow?.querySelector('.input-name');
        if (focusInput) {
          focusInput.focus();
        }
      }
    });

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentIdx = state.items.findIndex((it) => it.id === item.id);
        if (currentIdx !== -1) {
          if (currentIdx + 1 < state.items.length) {
            const nextRow = itemsListEl.children[currentIdx + 1];
            const nextInput = nextRow?.querySelector('.input-name');
            if (nextInput) {
              nextInput.focus();
              nextInput.select();
            }
          } else {
            addNewItem();
            const lastRow = itemsListEl.lastElementChild;
            const lastInput = lastRow?.querySelector('.input-name');
            if (lastInput) {
              lastInput.focus();
              lastInput.select();
            }
          }
        }
      }
    });

    probInput.addEventListener('input', (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val < 0) val = 0;
      item.probability = val;
      saveItemsToStorage();
      updateSpinButtonState();
      renderWheel();
    });

    probInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentIdx = state.items.findIndex((it) => it.id === item.id);
        if (currentIdx !== -1) {
          if (currentIdx + 1 < state.items.length) {
            const nextRow = itemsListEl.children[currentIdx + 1];
            const nextProbInput = nextRow?.querySelector('.input-prob');
            if (nextProbInput) {
              nextProbInput.focus();
              nextProbInput.select();
            }
          } else {
            probInput.blur();
          }
        }
      }
    });

    deleteBtn.addEventListener('click', () => {
      state.items = state.items.filter((it) => it.id !== item.id);
      if (state.settings.customProbEnabled === false) {
        equalizeProbabilities();
      } else {
        saveItemsToStorage();
        renderEditorItems();
      }
    });

    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openColorPicker(item.id, colorBtn);
    });

    // Drag and Drop Events
    row.addEventListener('dragstart', (e) => {
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.id);
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      document.querySelectorAll('.item-row').forEach((r) => r.classList.remove('drag-over'));
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const draggingEl = document.querySelector('.item-row.dragging');
      if (draggingEl && draggingEl !== row) {
        row.classList.add('drag-over');
      }
    });

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over');
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== item.id) {
        const fromIdx = state.items.findIndex((it) => it.id === draggedId);
        const toIdx = state.items.findIndex((it) => it.id === item.id);
        if (fromIdx !== -1 && toIdx !== -1) {
          const [moved] = state.items.splice(fromIdx, 1);
          state.items.splice(toIdx, 0, moved);
          saveItemsToStorage();
          renderEditorItems();
        }
      }
    });
  }

  // --- Color Palette Popover ---
  const colorPopover = document.getElementById('color-palette-popover');
  const paletteGrid = document.getElementById('palette-grid');

  function initColorPalette() {
    if (!paletteGrid) return;
    paletteGrid.innerHTML = '';
    PALETTE.forEach((color) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-color-btn';
      btn.style.backgroundColor = color;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.activeColorPickerItemId) {
          const item = state.items.find((it) => it.id === state.activeColorPickerItemId);
          if (item) {
            item.color = color;
            saveItemsToStorage();
            renderEditorItems();
          }
        }
        closeColorPicker();
      });
      paletteGrid.appendChild(btn);
    });

    document.addEventListener('click', (e) => {
      if (colorPopover && !colorPopover.contains(e.target) && !e.target.classList.contains('color-dot-btn')) {
        closeColorPicker();
      }
    });
  }

  function openColorPicker(itemId, targetBtn) {
    if (!colorPopover) return;
    state.activeColorPickerItemId = itemId;
    const rect = targetBtn.getBoundingClientRect();
    colorPopover.style.top = `${window.scrollY + rect.bottom + 6}px`;
    colorPopover.style.left = `${window.scrollX + rect.left - 10}px`;
    colorPopover.classList.remove('hidden');
  }

  function closeColorPicker() {
    if (colorPopover) {
      colorPopover.classList.add('hidden');
      state.activeColorPickerItemId = null;
    }
  }

  // --- Quick Actions ---
  function equalizeProbabilities() {
    const count = state.items.length;
    if (count === 0) return;
    const equalVal = Math.round((100 / count) * 100) / 100;

    state.items.forEach((it) => {
      it.probability = equalVal;
    });

    saveItemsToStorage();
    renderEditorItems();
  }

  function normalizeProbabilities() {
    const total = getTotalPercentage();
    if (total <= 0 || state.items.length === 0) return;

    let runningSum = 0;
    state.items.forEach((it, idx) => {
      if (idx === state.items.length - 1) {
        it.probability = Math.max(0, Math.round((100 - runningSum) * 10) / 10);
      } else {
        const normalized = Math.round(((Number(it.probability) || 0) / total) * 100 * 10) / 10;
        it.probability = normalized;
        runningSum += normalized;
      }
    });

    saveItemsToStorage();
    renderEditorItems();
  }

  function addNewItem(customName = null, customProb = null) {
    const nextIndex = state.items.length + 1;
    const name = customName || String.fromCharCode(64 + nextIndex) || `รายการ ${nextIndex}`;
    const color = PALETTE[(nextIndex - 1) % PALETTE.length];

    const newItem = {
      id: 'item-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name: name,
      probability: 0,
      color: color
    };

    state.items.push(newItem);

    if (customProb !== null) {
      newItem.probability = customProb;
    } else {
      // By default: divide 100% equally across all items
      const count = state.items.length;
      if (count > 0) {
        const equalVal = Math.round((100 / count) * 100) / 100;
        state.items.forEach((it) => {
          it.probability = equalVal;
        });
      }
    }

    saveItemsToStorage();
    renderEditorItems();
  }

  function clearAllItems() {
    if (state.items.length === 0) return;
    if (confirm('คุณต้องการล้างรายการทั้งหมดใช่หรือไม่?')) {
      state.items = [];
      saveItemsToStorage();
      renderEditorItems();
    }
  }

  function loadDefaultPreset() {
    state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    saveItemsToStorage();
    renderEditorItems();
  }

  // --- LocalStorage Persistence ---
  function loadFromStorage() {
    try {
      const savedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (savedItems) {
        state.items = JSON.parse(savedItems);
      } else {
        state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
      }

      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHistory) {
        state.history = JSON.parse(savedHistory);
      }

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
      }

      // If simple mode, ensure all items have the exact same equal probability
      if (state.settings.customProbEnabled === false && state.items.length > 0) {
        const equalVal = Math.round((100 / state.items.length) * 100) / 100;
        state.items.forEach((it) => {
          it.probability = equalVal;
        });
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
      state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    }
  }

  function saveItemsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(state.items));
    } catch (e) {}
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    } catch (e) {}
  }

  function saveSettingsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    } catch (e) {}
  }

  // --- Utility Functions ---
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- App Initialization & Event Listeners ---
  function initApp() {
    loadFromStorage();
    initConfetti();
    initColorPalette();

    // --- Client-Side URL Router & Tab Navigation ---
    const tabWheel = document.getElementById('tab-wheel');
    const tabHistory = document.getElementById('tab-history');
    const viewWheel = document.getElementById('view-wheel');
    const viewHistory = document.getElementById('view-history');

    function switchTab(tabName, updateUrl = true) {
      const isWheel = tabName !== 'history';

      tabWheel?.classList.toggle('active', isWheel);
      tabHistory?.classList.toggle('active', !isWheel);
      viewWheel?.classList.toggle('active', isWheel);
      viewHistory?.classList.toggle('active', !isWheel);

      if (updateUrl) {
        const isHttp = window.location.protocol.startsWith('http');
        if (isHttp) {
          const targetPath = isWheel ? '/wheel' : '/history';
          if (window.location.pathname !== targetPath) {
            history.pushState(null, '', targetPath);
          }
        } else {
          const targetHash = isWheel ? '#/wheel' : '#/history';
          if (window.location.hash !== targetHash && !(isWheel && (window.location.hash === '' || window.location.hash === '#/' || window.location.hash === '#'))) {
            history.pushState(null, '', targetHash);
          }
        }
      }

      if (isWheel) {
        renderWheel();
      } else {
        renderHistoryView();
      }
    }

    function handleRoute() {
      const path = (window.location.pathname + window.location.hash).toLowerCase();
      if (path.includes('history')) {
        switchTab('history', false);
      } else if (path.includes('settings')) {
        switchTab('wheel', false);
        openSettings();
      } else if (path.includes('help') || path.includes('guide')) {
        switchTab('wheel', false);
        openHelp();
      } else {
        switchTab('wheel', false);
      }
    }

    if (tabWheel) tabWheel.addEventListener('click', () => switchTab('wheel'));
    if (tabHistory) tabHistory.addEventListener('click', () => switchTab('history'));

    const btnHistoryGoSpin = document.getElementById('btn-history-go-spin');
    if (btnHistoryGoSpin) {
      btnHistoryGoSpin.addEventListener('click', () => switchTab('wheel'));
    }

    // Listen to browser Back/Forward button & URL changes
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);

    // Spin Button, Wheel Canvas Tap & Center Hub Click
    if (spinBtn) {
      spinBtn.addEventListener('click', spinWheel);
    }

    if (canvas) {
      canvas.addEventListener('click', spinWheel);
    }

    const centerHubBtn = document.getElementById('btn-center-hub');
    if (centerHubBtn) {
      centerHubBtn.addEventListener('click', spinWheel);
    }

    // Quick Actions
    document.getElementById('btn-action-equal')?.addEventListener('click', equalizeProbabilities);
    document.getElementById('btn-action-normalize')?.addEventListener('click', normalizeProbabilities);
    document.getElementById('btn-action-add')?.addEventListener('click', () => addNewItem());
    document.getElementById('btn-action-clear')?.addEventListener('click', clearAllItems);

    // Empty State Buttons
    document.getElementById('btn-empty-add')?.addEventListener('click', () => addNewItem());

    // Clear History Button
    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      if (state.history.length === 0) return;
      if (confirm('คุณต้องการล้างประวัติการสุ่มทั้งหมดใช่หรือไม่?')) {
        state.history = [];
        saveHistoryToStorage();
        renderHistoryView();
      }
    });

    // Result Modal Events
    document.getElementById('btn-close-result')?.addEventListener('click', hideResultModal);
    document.getElementById('btn-close-result-bottom')?.addEventListener('click', hideResultModal);
    document.getElementById('btn-spin-again')?.addEventListener('click', () => {
      hideResultModal();
      setTimeout(spinWheel, 250);
    });

    // Sound Toggle Header Button
    const soundToggleBtn = document.getElementById('btn-sound-toggle');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');

    function updateSoundUI() {
      if (state.settings.soundEnabled) {
        iconSoundOn?.classList.remove('hidden');
        iconSoundOff?.classList.add('hidden');
      } else {
        iconSoundOn?.classList.add('hidden');
        iconSoundOff?.classList.remove('hidden');
      }
    }

    soundToggleBtn?.addEventListener('click', () => {
      state.settings.soundEnabled = !state.settings.soundEnabled;
      updateSoundUI();
      saveSettingsToStorage();
      if (state.settings.soundEnabled) initAudio();
    });
    updateSoundUI();

    // Remove Winner on Spin Toggle (Synced across Header & Settings Modal)
    const toggleRemoveWinnerHeader = document.getElementById('toggle-remove-winner');
    const settingRemoveWinnerToggle = document.getElementById('setting-remove-winner-toggle');

    function updateRemoveWinnerUI() {
      const isEnabled = !!state.settings.removeWinnerOnSpin;
      if (toggleRemoveWinnerHeader) toggleRemoveWinnerHeader.checked = isEnabled;
      if (settingRemoveWinnerToggle) settingRemoveWinnerToggle.checked = isEnabled;
    }

    toggleRemoveWinnerHeader?.addEventListener('change', (e) => {
      state.settings.removeWinnerOnSpin = e.target.checked;
      updateRemoveWinnerUI();
      saveSettingsToStorage();
    });

    settingRemoveWinnerToggle?.addEventListener('change', (e) => {
      state.settings.removeWinnerOnSpin = e.target.checked;
      updateRemoveWinnerUI();
      saveSettingsToStorage();
    });
    updateRemoveWinnerUI();

    // --- Help / User Guide Modal ---
    const helpModal = document.getElementById('help-modal');
    const btnHelp = document.getElementById('btn-help');
    const btnCloseHelp = document.getElementById('btn-close-help');
    const btnCloseHelpBottom = document.getElementById('btn-close-help-bottom');

    function openHelp() {
      helpModal?.classList.add('open');
    }

    function closeHelp() {
      helpModal?.classList.remove('open');
    }

    btnHelp?.addEventListener('click', openHelp);
    btnCloseHelp?.addEventListener('click', closeHelp);
    btnCloseHelpBottom?.addEventListener('click', closeHelp);

    // Settings Modal
    const settingsModal = document.getElementById('settings-modal');
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingDuration = document.getElementById('setting-duration');
    const durationVal = document.getElementById('duration-val');
    const settingSoundToggle = document.getElementById('setting-sound-toggle');
    const settingConfettiToggle = document.getElementById('setting-confetti-toggle');
    const settingCustomProbToggle = document.getElementById('setting-custom-prob-toggle');
    const settingHidePercentToggle = document.getElementById('setting-hide-percent-toggle');
    const settingEqualSlicesToggle = document.getElementById('setting-equal-slices-toggle');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnResetDefaults = document.getElementById('btn-reset-defaults');

    function updateSliderTrack(val) {
      if (!settingDuration) return;
      const min = parseFloat(settingDuration.min) || 2;
      const max = parseFloat(settingDuration.max) || 10;
      const current = parseFloat(val) || 5;
      const pct = Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
      settingDuration.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, #EDF2F7 ${pct}%, #EDF2F7 100%)`;
    }

    function openSettings() {
      if (!settingsModal) return;
      if (settingDuration) {
        settingDuration.value = state.settings.duration;
        durationVal.textContent = `${state.settings.duration.toFixed(1)}s`;
        updateSliderTrack(state.settings.duration);
      }
      if (settingSoundToggle) settingSoundToggle.checked = state.settings.soundEnabled;
      if (settingConfettiToggle) settingConfettiToggle.checked = state.settings.confettiEnabled;
      if (settingRemoveWinnerToggle) settingRemoveWinnerToggle.checked = !!state.settings.removeWinnerOnSpin;
      if (settingCustomProbToggle) settingCustomProbToggle.checked = state.settings.customProbEnabled !== false;
      if (settingHidePercentToggle) settingHidePercentToggle.checked = !!state.settings.hidePercentage;
      if (settingEqualSlicesToggle) settingEqualSlicesToggle.checked = !!state.settings.equalSliceVisual;
      settingsModal.classList.add('open');
    }

    function closeSettings() {
      settingsModal?.classList.remove('open');
    }

    btnSettings?.addEventListener('click', openSettings);
    btnCloseSettings?.addEventListener('click', closeSettings);

    settingCustomProbToggle?.addEventListener('change', (e) => {
      state.settings.customProbEnabled = e.target.checked;
      if (!state.settings.customProbEnabled) {
        equalizeProbabilities();
      }
      saveSettingsToStorage();
      renderEditorItems();
      renderWheel();
    });

    settingHidePercentToggle?.addEventListener('change', (e) => {
      state.settings.hidePercentage = e.target.checked;
      saveSettingsToStorage();
      renderWheel();
    });

    settingEqualSlicesToggle?.addEventListener('change', (e) => {
      state.settings.equalSliceVisual = e.target.checked;
      saveSettingsToStorage();
      renderWheel();
    });

    settingDuration?.addEventListener('input', (e) => {
      durationVal.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
      updateSliderTrack(e.target.value);
    });

    btnSaveSettings?.addEventListener('click', () => {
      if (settingDuration) state.settings.duration = parseFloat(settingDuration.value);
      if (settingSoundToggle) state.settings.soundEnabled = settingSoundToggle.checked;
      if (settingConfettiToggle) state.settings.confettiEnabled = settingConfettiToggle.checked;
      if (settingRemoveWinnerToggle) state.settings.removeWinnerOnSpin = settingRemoveWinnerToggle.checked;
      if (settingCustomProbToggle) state.settings.customProbEnabled = settingCustomProbToggle.checked;
      if (settingHidePercentToggle) state.settings.hidePercentage = settingHidePercentToggle.checked;
      if (settingEqualSlicesToggle) state.settings.equalSliceVisual = settingEqualSlicesToggle.checked;
      if (!state.settings.customProbEnabled) {
        equalizeProbabilities();
      }
      updateSoundUI();
      updateRemoveWinnerUI();
      saveSettingsToStorage();
      renderEditorItems();
      renderWheel();
      closeSettings();
    });

    btnResetDefaults?.addEventListener('click', () => {
      state.settings = {
        duration: 5.0,
        soundEnabled: true,
        confettiEnabled: true,
        removeWinnerOnSpin: true,
        hidePercentage: true,
        equalSliceVisual: false,
        customProbEnabled: true
      };
      if (settingDuration) {
        settingDuration.value = 5.0;
        durationVal.textContent = '5.0s';
        updateSliderTrack(5.0);
      }
      if (settingSoundToggle) settingSoundToggle.checked = true;
      if (settingConfettiToggle) settingConfettiToggle.checked = true;
      if (settingRemoveWinnerToggle) settingRemoveWinnerToggle.checked = true;
      if (settingCustomProbToggle) settingCustomProbToggle.checked = true;
      if (settingHidePercentToggle) settingHidePercentToggle.checked = true;
      if (settingEqualSlicesToggle) settingEqualSlicesToggle.checked = false;
      updateRemoveWinnerUI();
      saveSettingsToStorage();
      renderEditorItems();
      renderWheel();
    });

    // Window resize handler for wheel canvas
    window.addEventListener('resize', () => {
      renderWheel();
    });

    // Initial Render & Route Sync
    renderEditorItems();
    handleRoute();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
