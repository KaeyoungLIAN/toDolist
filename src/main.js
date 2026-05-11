import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

let tasks = [], currentDate = new Date(), editingId = null;
const WN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const $ = id => document.getElementById(id);
const taskList = $('task-list'), emptyState = $('empty-state'), dateDisplay = $('date-display');
const taskInput = $('task-input'), addBtn = $('add-btn'), addBtnText = $('add-btn-text');
const onceDate = $('once-date'), onceTime = $('once-time'), weeklyTime = $('weekly-time');
const onceConfig = $('once-config'), weeklyConfig = $('weekly-config');
const dayBtns = document.querySelectorAll('.day-btn');

// ── Window controls ──
$('pin-btn').addEventListener('click', async () => {
  const w = getCurrentWindow();
  const pinned = await w.isAlwaysOnTop();
  await w.setAlwaysOnTop(!pinned);
  showToast(pinned ? 'Unpinned' : 'Pinned');
});
$('min-btn').addEventListener('click', async () => { await getCurrentWindow().minimize(); });
$('close-btn').addEventListener('click', async () => { await getCurrentWindow().hide(); });

// ── Date navigation ──
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function updDate() {
  dateDisplay.textContent = `${fmt(currentDate)}  ${WN[currentDate.getDay()]}`;
}
$('prev-btn').onclick = () => { currentDate.setDate(currentDate.getDate() - 1); updDate(); render(); };
$('next-btn').onclick = () => { currentDate.setDate(currentDate.getDate() + 1); updDate(); render(); };
$('today-btn').onclick = () => { currentDate = new Date(); updDate(); render(); };
$('refresh-btn').onclick = loadTasks;

// ── Reminder type toggle ──
document.querySelectorAll('input[name="rtype"]').forEach(r =>
  r.addEventListener('change', () => {
    onceConfig.style.display = r.value === 'once' ? 'flex' : 'none';
    weeklyConfig.style.display = r.value === 'weekly' ? 'flex' : 'none';
  })
);

dayBtns.forEach(b => b.addEventListener('click', () => b.classList.toggle('active')));

// ── Toast system ──
function showToast(message) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── Data loading ──
async function loadTasks() {
  try {
    tasks = await invoke('get_tasks');
    render();
    await checkReminders();
  } catch (e) { /* silent on first load */ }
}

function filterTasks() {
  const ds = fmt(currentDate);
  return tasks
    .filter(t =>
      t.completed ||
      t.reminder_type === 'weekly' ||
      (t.reminder_data.datetime && t.reminder_data.datetime.startsWith(ds))
    )
    .sort((a, b) => a.completed - b.completed);
}

// ── Render ──
function render() {
  const list = filterTasks();
  taskList.innerHTML = '';

  if (!list.length) {
    taskList.appendChild(emptyState);
    return;
  }

  list.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'task-card' + (t.completed ? ' completed' : '');
    card.style.animationDelay = `${i * 40}ms`;

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked = t.completed;
    cb.onchange = () => toggleComplete(t.id);

    // Body
    const body = document.createElement('div');
    body.className = 'task-body';

    const ct = document.createElement('div');
    ct.className = 'task-content';
    ct.textContent = t.content;

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    if (t.completed) {
      meta.innerHTML = `<span class="reminder-badge once">Done</span>`;
    } else if (t.reminder_type === 'once' && t.reminder_data.datetime) {
      const dt = t.reminder_data.datetime.replace('T', ' ');
      meta.innerHTML = `<span class="reminder-badge once">${dt}</span>`;
    } else if (t.reminder_type === 'weekly') {
      const days = t.reminder_data.days.map(d => WN[d]).join(', ');
      meta.innerHTML = `<span class="reminder-badge weekly">${days} ${t.reminder_data.time}</span>`;
    }

    body.appendChild(ct);
    body.appendChild(meta);

    // Edit button
    const eb = document.createElement('button');
    eb.className = 'action-btn edit-btn';
    eb.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    eb.onclick = () => startEdit(t);

    // Delete button
    const db = document.createElement('button');
    db.className = 'action-btn delete-btn';
    db.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
    db.onclick = () => deleteTask(t.id, t.content);

    card.append(cb, body, eb, db);
    taskList.appendChild(card);
  });
}

// ── CRUD ──
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

async function addTask() {
  const content = taskInput.value.trim();
  if (!content) return;

  const rtype = document.querySelector('input[name="rtype"]:checked').value;
  let rd;

  if (rtype === 'once') {
    rd = {
      datetime: `${onceDate.value || fmt(new Date())}T${onceTime.value}:00`,
      days: [],
      time: '09:00'
    };
  } else {
    const days = [...document.querySelectorAll('.day-btn.active')].map(b => parseInt(b.dataset.day));
    rd = { datetime: null, days: days.length ? days : [1], time: weeklyTime.value };
  }

  try {
    if (editingId !== null) {
      const t = tasks.find(x => x.id === editingId);
      if (t) {
        t.content = content;
        t.reminder_type = rtype;
        t.reminder_data = rd;
        await invoke('update_task', { task: t });
      }
      editingId = null;
      addBtnText.textContent = 'Add';
      addBtn.classList.remove('editing');
      showToast('Task updated');
    } else {
      await invoke('add_task', { content, reminderType: rtype, reminderData: rd });
      showToast('Task added');
    }
    taskInput.value = '';
    await loadTasks();
    taskInput.focus();
  } catch (e) {
    showToast('Something went wrong');
  }
}

function startEdit(t) {
  taskInput.value = t.content;
  editingId = t.id;
  addBtnText.textContent = 'Update';
  addBtn.classList.add('editing');

  if (t.reminder_type === 'once') {
    document.querySelector('input[value="once"]').checked = true;
    if (t.reminder_data.datetime) {
      const p = t.reminder_data.datetime.split('T');
      onceDate.value = p[0];
      onceTime.value = p[1].substring(0, 5);
    }
    onceConfig.style.display = 'flex';
    weeklyConfig.style.display = 'none';
  } else {
    document.querySelector('input[value="weekly"]').checked = true;
    weeklyTime.value = t.reminder_data.time || '09:00';
    dayBtns.forEach(b =>
      b.classList.toggle('active', t.reminder_data.days.includes(parseInt(b.dataset.day)))
    );
    onceConfig.style.display = 'none';
    weeklyConfig.style.display = 'flex';
  }
  taskInput.focus();
}

let undoTimeout = null;

async function deleteTask(id, content) {
  // Inline undo bar instead of confirm()
  const undoBar = document.createElement('div');
  undoBar.className = 'undo-bar';
  undoBar.innerHTML = `
    <span>Deleted: ${content.length > 30 ? content.slice(0, 30) + '...' : content}</span>
    <button class="undo-btn">Undo</button>
  `;

  // Insert at top of task list
  taskList.prepend(undoBar);

  // Set timeout for actual deletion
  const doDelete = async () => {
    undoBar.remove();
    try {
      await invoke('delete_task', { id });
      await loadTasks();
    } catch (e) { /* silent */ }
  };

  undoTimeout = setTimeout(doDelete, 5000);

  undoBar.querySelector('.undo-btn').onclick = async (e) => {
    e.stopPropagation();
    clearTimeout(undoTimeout);
    undoBar.remove();
    showToast('Delete cancelled');
  };
}

async function toggleComplete(id) {
  try {
    await invoke('toggle_complete', { id });
    await loadTasks();
  } catch (e) { /* silent */ }
}

async function checkReminders() {
  try { await invoke('check_and_notify'); } catch (e) { /* silent */ }
}

// ── Init ──
onceDate.value = fmt(new Date());
updDate();
loadTasks();
setInterval(checkReminders, 60000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) loadTasks();
});
