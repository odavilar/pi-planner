import React, { useMemo } from 'react';
import { Box } from '@mui/material';

function parseDate(iso) {
  return new Date(iso + 'T00:00:00');
}

function toISO(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function eachDateInclusive(startISO, endISO) {
  const out = [];
  let d = parseDate(startISO);
  const end = parseDate(endISO);
  while (d <= end) {
    out.push(toISO(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function colorForString(str) {
  const colors = ['#F97316', '#06B6D4', '#A78BFA', '#F43F5E', '#10B981', '#F59E0B'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return colors[Math.abs(h) % colors.length];
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function shadeHex(hex, alpha = 0.5) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatHuman(iso) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (_) {
    return iso;
  }
}

export default function CalendarView({ pi, sprints = [], members = [], holidaysData = {} }) {
  const dates = useMemo(() => {
    if (!pi?.startDate || !pi?.endDate) return [];
    return eachDateInclusive(pi.startDate, pi.endDate);
  }, [pi]);

  // compute months covering the PI
  const months = useMemo(() => {
    if (!dates.length) return [];
    const out = [];
    let cur = new Date(dates[0] + 'T00:00:00');
    cur.setDate(1);
    const end = new Date(dates[dates.length - 1] + 'T00:00:00');
    end.setDate(1);
    while (cur <= end) {
      const year = cur.getFullYear();
      const month = cur.getMonth();
      // get first and last day of month
      const first = new Date(year, month, 1);
      const last = new Date(year, month + 1, 0);

      // Determine Monday-start week range covering the whole month
      const start = new Date(first);
      const startDay = start.getDay() === 0 ? 7 : start.getDay(); // 1..7 (Mon..Sun)
      start.setDate(start.getDate() - (startDay - 1)); // move to Monday

      const finish = new Date(last);
      const finishDay = finish.getDay() === 0 ? 7 : finish.getDay();
      finish.setDate(finish.getDate() + (7 - finishDay)); // move to Sunday

      // build weeks grid (Mon-Fri only)
      const weeks = [];
      let cursor = new Date(start);
      while (cursor <= finish) {
        const week = [];
        // for Mon..Fri (1..5)
        for (let dow = 1; dow <= 5; dow++) {
          const d = new Date(cursor);
          d.setDate(d.getDate() + (dow - 1));
          if (d.getMonth() === month) {
            week.push(d.toISOString().slice(0, 10));
          } else {
            week.push(null);
          }
        }
        weeks.push(week);
        // advance to next Monday
        cursor.setDate(cursor.getDate() + 7);
      }

      out.push({ year, month, weeks, label: first.toLocaleString(undefined, { month: 'long', year: 'numeric' }) });
      cur = new Date(year, month + 1, 1);
    }
    return out;
  }, [dates]);

  // stable colors for sprints and members
  const sprintColorMap = useMemo(() => {
    const map = new Map();
    sprints.forEach((s) => {
      const base = colorForString(s.name || `${s.startDate}-${s.endDate}`);
      map.set(s, {
        base,
        bg: shadeHex(base, 0.18),
        border: base,
      });
    });
    return map;
  }, [sprints]);

  if (!dates.length) {
    return (
      <div>
        <strong>Calendar</strong>
        <div style={{ marginTop: 8 }}>
          Set PI start and end dates to view the calendar.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Calendar</strong>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{pi.startDate} – {pi.endDate}</div>
        </div>
      </div>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
            {months.map((month) => (
              <Box key={`${month.year}-${month.month}`} sx={{ border: '1px solid #eef2ff', borderRadius: 1, overflow: 'hidden', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.25, borderBottom: '1px solid #eef2ff' }}>
                  <Box sx={{ fontWeight: 700 }}>{month.label}</Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, p: 1 }}>
                  {['Mon','Tue','Wed','Thu','Fri'].map((d) => (
                    <Box key={d} sx={{ p: 0.75, background: '#f8fafc', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>{d}</Box>
                  ))}

                  {month.weeks.flat().map((iso, idx) => {
                    if (!iso) return <Box key={`pad-${idx}`} sx={{ p: 0.75 }} />;

                    // Determine sprint(s) for this day
                    const sprintsToday = sprints.filter((s) => iso >= s.startDate && iso <= s.endDate);
                    const sprintPrimary = sprintsToday[0];
                    const holidayLocations = Object.keys(holidaysData).filter((loc) => (holidaysData[loc] || []).includes(iso));

                    const bgColor = sprintPrimary ? (sprintColorMap.get(sprintPrimary)?.bg || '#E6F7FF') : '#fff';
                    const borderLeft = sprintPrimary ? `3px solid ${sprintColorMap.get(sprintPrimary)?.border}` : '1px solid #eef2ff';

                    // Build hover tooltip text
                    const ptoMembers = members.filter((m) => (m.pto || []).some((p) => iso >= p.fromDate && iso <= p.toDate));
                    const title = [
                      `${formatHuman(iso)}`,
                      sprintPrimary ? `Sprint: ${sprintPrimary.name || ''} (${sprintPrimary.startDate} – ${sprintPrimary.endDate})` : null,
                      holidayLocations.length ? `Holiday${holidayLocations.length > 1 ? 's' : ''} in: ${holidayLocations.join(', ')}` : null,
                      ptoMembers.length ? `PTO: ${ptoMembers.map((m) => m.name).join(', ')}` : null,
                    ].filter(Boolean).join('\n');

                    return (
                      <Box key={iso} title={title} sx={{ minHeight: 56, p: 0.75, background: bgColor, position: 'relative', borderRadius: 0, borderLeft, borderTop: '1px solid #eef2ff' }}>
                        <Box sx={{ position: 'absolute', top: 6, right: 6, fontSize: 11, color: '#6b7280' }}>{iso.slice(8)}</Box>

                        {holidayLocations.length > 0 && <Box sx={{ position: 'absolute', left: 6, top: 6, width: 8, height: 8, background: '#F3F4F6', borderRadius: 0 }} />}

                        <Box sx={{ mt: 3, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {members.map((m) => {
                            const onPto = (m.pto || []).some((p) => iso >= p.fromDate && iso <= p.toDate);
                            if (!onPto) return null;
                            const c = colorForString(m.name);
                            return <Box key={m.id + '-' + iso} title={`${m.name} PTO`} sx={{ width: 10, height: 10, background: c, borderRadius: 0 }} />;
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
        ))}
          </Box>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, alignItems: 'center', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, marginRight: 4 }}>Sprints:</div>
          {sprints.map((s) => {
            const colors = sprintColorMap.get(s) || { base: '#60a5fa' };
            return (
              <div key={`legend-s-${s.name}-${s.startDate}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: colors.base, borderRadius: 2 }} />
                <div style={{ color: '#374151' }}>{s.name}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#F3F4F6', borderRadius: 2 }} />
          <div style={{ color: '#374151' }}>Holiday marker</div>
        </div>
        <div style={{ color: '#374151' }}>Colored dots in each day indicate members on PTO.</div>
      </div>
    </div>
  );
}
