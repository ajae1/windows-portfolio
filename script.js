const windows = Array.from(document.querySelectorAll('.window'));
const launchers = Array.from(document.querySelectorAll('[data-window-target]'));
const taskButtons = document.querySelector('#task-buttons');
const startButton = document.querySelector('#start-button');
const startMenu = document.querySelector('#start-menu');
const clock = document.querySelector('#clock');

let topZ = 20;
let activeWindowId = null;

const titleForWindow = (win) => win.querySelector('.titlebar h1, .titlebar h2')?.textContent?.trim() || 'Window';

function focusWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  topZ += 1;
  activeWindowId = id;
  win.classList.add('is-open', 'is-focused');
  win.style.zIndex = topZ;

  windows.forEach((other) => {
    if (other.id !== id) other.classList.remove('is-focused');
  });

  renderTaskbar();
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  win.classList.add('is-open');
  focusWindow(id);
  startMenu.classList.remove('is-open');
  startMenu.setAttribute('aria-hidden', 'true');
  startButton.setAttribute('aria-expanded', 'false');
}

function closeWindow(win) {
  win.classList.remove('is-open', 'is-focused');
  if (activeWindowId === win.id) activeWindowId = null;
  renderTaskbar();
}

function minimizeWindow(win) {
  win.classList.remove('is-open', 'is-focused');
  renderTaskbar();
}

function renderTaskbar() {
  taskButtons.innerHTML = '';

  windows.forEach((win) => {
    const button = document.createElement('button');
    button.className = 'task-button';
    button.type = 'button';
    button.textContent = titleForWindow(win);
    button.dataset.windowTarget = win.id;

    if (win.id === activeWindowId && win.classList.contains('is-open')) {
      button.classList.add('is-focused');
    }

    button.addEventListener('click', () => openWindow(win.id));
    taskButtons.append(button);
  });
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function makeDraggable(win) {
  const titlebar = win.querySelector('.titlebar');
  if (!titlebar) return;

  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let dragging = false;

  titlebar.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    if (window.matchMedia('(max-width: 760px)').matches) return;

    const rect = win.getBoundingClientRect();
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    originX = rect.left;
    originY = rect.top;
    win.setPointerCapture(event.pointerId);
    focusWindow(win.id);
  });

  titlebar.addEventListener('pointermove', (event) => {
    if (!dragging) return;

    const nextX = originX + event.clientX - startX;
    const nextY = originY + event.clientY - startY;
    const maxX = window.innerWidth - win.offsetWidth - 10;
    const maxY = window.innerHeight - win.offsetHeight - 58;

    win.style.left = `${Math.max(10, Math.min(nextX, maxX))}px`;
    win.style.top = `${Math.max(10, Math.min(nextY, maxY))}px`;
  });

  titlebar.addEventListener('pointerup', (event) => {
    dragging = false;
    if (win.hasPointerCapture(event.pointerId)) win.releasePointerCapture(event.pointerId);
  });
}

launchers.forEach((launcher) => {
  launcher.addEventListener('click', () => openWindow(launcher.dataset.windowTarget));
});

windows.forEach((win) => {
  makeDraggable(win);

  win.addEventListener('pointerdown', () => focusWindow(win.id));

  win.querySelectorAll('[data-action]').forEach((control) => {
    control.addEventListener('click', (event) => {
      event.stopPropagation();
      const action = control.dataset.action;
      if (action === 'close') closeWindow(win);
      if (action === 'minimize') minimizeWindow(win);
      if (action === 'focus') focusWindow(win.id);
    });
  });
});

startButton.addEventListener('click', () => {
  const isOpen = startMenu.classList.toggle('is-open');
  startMenu.setAttribute('aria-hidden', String(!isOpen));
  startButton.setAttribute('aria-expanded', String(isOpen));
});

document.addEventListener('click', (event) => {
  if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
    startMenu.classList.remove('is-open');
    startMenu.setAttribute('aria-hidden', 'true');
    startButton.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    startMenu.classList.remove('is-open');
    startMenu.setAttribute('aria-hidden', 'true');
    startButton.setAttribute('aria-expanded', 'false');
  }
});

updateClock();
setInterval(updateClock, 30_000);
focusWindow('about-window');
renderTaskbar();
