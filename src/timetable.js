function stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseDdMmYyyy(s) {
  const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const y = Number(m[3]);
  return new Date(y, mo, d);
}

function toHmDate(baseDate, hm) {
  const [h, m] = hm.split(':').map(Number);
  const dt = new Date(baseDate);
  dt.setHours(h, m, 0, 0);
  return dt;
}

function parseLessonTitle(title) {
  const m = String(title).match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})(?:\s+in\s+([^\n\r<]+))?/i);
  if (!m) return null;
  return {
    startHm: m[1],
    endHm: m[2],
    roomAndSubject: (m[3] || '').trim(),
  };
}

function businessDaysFrom(startDate, count) {
  const days = [];
  let d = new Date(startDate);
  while (days.length < count) {
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function parseDashboardTimetable(html) {
  const dayBlocks = [];

  const startMatch = String(html).match(/data-ff-startdate="(\d{1,2}\/\d{1,2}\/\d{4})"/i);
  const firstDate = startMatch ? parseDdMmYyyy(startMatch[1]) : null;

  const dayRegex = /<ol[^>]*class="[^"]*ff-timetable-day[^"]*"[^>]*>([\s\S]*?)<\/ol>/gi;
  let dm;
  while ((dm = dayRegex.exec(html)) !== null) {
    const block = dm[1];

    const headerMatch = block.match(/ff-timetable-columntitle[\s\S]*?<span>([\s\S]*?)<\/span>/i);
    const dayLabel = headerMatch ? stripTags(headerMatch[1]) : 'Unknown day';

    const lessons = [];
    const lessonRegex = /ff-timetable-lesson-info"[^>]*title="([^"]+)"/gi;
    let lm;
    while ((lm = lessonRegex.exec(block)) !== null) {
      const title = lm[1];
      const parsed = parseLessonTitle(title);
      if (parsed) {
        lessons.push({ raw: title, ...parsed });
      }
    }

    dayBlocks.push({ dayLabel, lessons });
  }

  if (firstDate) {
    const bdays = businessDaysFrom(firstDate, dayBlocks.length);
    dayBlocks.forEach((d, i) => {
      d.date = bdays[i];
    });
  }

  return dayBlocks;
}

function findTodaySchedule(dayBlocks, now = new Date()) {
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
  let chosen = dayBlocks.find((d) => d.date && d.date.toDateString() === todayStr);

  if (!chosen) {
    // fallback: first day with lessons
    chosen = dayBlocks.find((d) => d.lessons.length > 0) || null;
  }
  if (!chosen) return [];

  const baseDate = chosen.date || now;
  return chosen.lessons
    .map((l) => ({
      ...l,
      start: toHmDate(baseDate, l.startHm),
      end: toHmDate(baseDate, l.endHm),
    }))
    .sort((a, b) => a.start - b.start);
}

function getCountdownStatus(schedule, now = new Date()) {
  for (let i = 0; i < schedule.length; i++) {
    const p = schedule[i];
    if (now >= p.start && now < p.end) {
      return {
        mode: 'current',
        current: p,
        msRemaining: p.end - now,
      };
    }
    if (now < p.start) {
      return {
        mode: 'next',
        next: p,
        msUntil: p.start - now,
      };
    }
  }
  return { mode: 'done' };
}

module.exports = {
  parseDashboardTimetable,
  findTodaySchedule,
  getCountdownStatus,
};
