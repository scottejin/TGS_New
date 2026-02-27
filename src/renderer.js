let lastData = null;
let timer = null;

function fmtMs(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${m}m ${ss}s`;
  return `${m}m ${ss}s`;
}

function computeStatus(schedule) {
  const now = new Date();
  for (const p of schedule) {
    const start = new Date(p.start);
    const end = new Date(p.end);
    if (now >= start && now < end) {
      return { mode: 'current', p, ms: end - now };
    }
    if (now < start) {
      return { mode: 'next', p, ms: start - now };
    }
  }
  return { mode: 'done' };
}

function render() {
  const statusMain = document.getElementById('statusMain');
  const statusSub = document.getElementById('statusSub');
  const ul = document.getElementById('schedule');
  const meta = document.getElementById('meta');

  if (!lastData) {
    statusMain.textContent = 'No data yet';
    statusSub.textContent = '';
    return;
  }

  const schedule = (lastData.todaySchedule || []).map(x => ({ ...x, start: new Date(x.start), end: new Date(x.end) }));
  const st = computeStatus(schedule);

  if (!lastData.ok) {
    statusMain.textContent = 'Not logged in / dashboard not reachable';
    statusSub.textContent = `Final URL: ${lastData.finalUrl || 'unknown'}`;
  } else if (st.mode === 'current') {
    statusMain.textContent = `${st.p.raw}`;
    statusSub.textContent = `Ends in ${fmtMs(st.ms)}`;
  } else if (st.mode === 'next') {
    statusMain.textContent = `Next: ${st.p.raw}`;
    statusSub.textContent = `Starts in ${fmtMs(st.ms)}`;
  } else {
    statusMain.textContent = 'School day finished';
    statusSub.textContent = 'No remaining periods today.';
  }

  meta.textContent = `Fetched: ${new Date(lastData.fetchedAt).toLocaleString()} | ${lastData.title || ''}`;

  ul.innerHTML = '';
  for (const p of schedule) {
    const li = document.createElement('li');
    li.textContent = `${p.startHm}–${p.endHm}  ${p.roomAndSubject || p.raw}`;
    const now = new Date();
    if (now >= p.start && now < p.end) li.classList.add('current');
    ul.appendChild(li);
  }
}

async function refreshData() {
  const btn = document.getElementById('btnRefresh');
  btn.disabled = true;
  btn.textContent = 'Refreshing...';
  try {
    lastData = await window.mytgsApi.refresh();
    render();
  } catch (e) {
    alert(`Refresh failed: ${e.message || e}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Refresh timetable';
  }
}

document.getElementById('btnRefresh').addEventListener('click', refreshData);
document.getElementById('btnLogin').addEventListener('click', async () => {
  await window.mytgsApi.openLogin();
  alert('Login window opened. Sign in there, then come back and click "I finished login".');
});
document.getElementById('btnLoginDone').addEventListener('click', async () => {
  await window.mytgsApi.closeLogin();
  await refreshData();
});

(async () => {
  await refreshData();
  timer = setInterval(render, 1000);
})();
