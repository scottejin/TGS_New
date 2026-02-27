const { fetchDashboardData } = require('./fetcher');

(async () => {
  try {
    const data = await fetchDashboardData();
    console.log(JSON.stringify({
      ok: data.ok,
      finalUrl: data.finalUrl,
      title: data.title,
      periodsToday: data.todaySchedule.length,
      firstPeriod: data.todaySchedule[0]?.raw || null,
      fetchedAt: data.fetchedAt,
    }, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
