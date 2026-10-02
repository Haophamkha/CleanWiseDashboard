import type { WorkerScheduleItem } from "../types/WorkerSchedule";

const DAY = 86400000;

// Split cross-midnight events into day segments and give overlapping events separate lanes.
export function daySegments(items: WorkerScheduleItem[], date: string) {
  const start = new Date(`${date}T00:00:00+07:00`).getTime();
  const events = items.flatMap(item => {
    const from = Math.max(start, new Date(item.scheduled_start).getTime());
    const to = Math.min(start + DAY, new Date(item.scheduled_end).getTime());
    return from < to ? [{ item, from: (from - start) / 60000, to: (to - start) / 60000, lane: 0, lanes: 1 }] : [];
  }).sort((a, b) => a.from - b.from || b.to - a.to || a.item.id - b.item.id);
  let cluster: typeof events = [];
  let clusterEnd = -1;
  let ends: number[] = [];
  const finish = () => cluster.forEach(event => { event.lanes = ends.length; });
  for (const event of events) {
    if (event.from >= clusterEnd) { finish(); cluster = []; ends = []; clusterEnd = -1; }
    let lane = ends.findIndex(end => end <= event.from);
    if (lane < 0) lane = ends.length;
    ends[lane] = event.to;
    event.lane = lane;
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.to);
  }
  finish();
  return events;
}

