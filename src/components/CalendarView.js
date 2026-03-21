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
      // get first day of month and last day
      const first = new Date(year, month, 1);
      const last = new Date(year, month + 1, 0);
      // build weeks grid (Sun-Sat)
      const weeks = [];
      let week = [];
      // pad first week with nulls until first.getDay()
      for (let i = 0; i < first.getDay(); i++) week.push(null);
      for (let d = 1; d <= last.getDate(); d++) {
        const iso = new Date(year, month, d).toISOString().slice(0, 10);
        week.push(iso);
        if (week.length === 7) {
          weeks.push(week);
          week = [];
        }
      }
      if (week.length) {
        while (week.length < 7) week.push(null);
        weeks.push(week);
      }

      out.push({ year, month, weeks, label: first.toLocaleString(undefined, { month: 'long', year: 'numeric' }) });
      cur = new Date(year, month + 1, 1);
    }
    return out;
  }, [dates]);

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

      <div style={{ display: 'grid', gap: 20 }}>
        {months.map((month) => (
          <div key={`${month.year}-${month.month}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{month.label}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, border: '1px solid #eef2ff', borderRadius: 8, overflow: 'hidden' }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} style={{ padding: 8, background: '#f8fafc', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>{d}</div>
              ))}

              {month.weeks.flat().map((iso, idx) => {
                if (!iso) return <div key={`pad-${idx}`} style={{ padding: 8 }} />;

                const inSprint = sprints.some((s) => iso >= s.startDate && iso <= s.endDate);
                const holidayLocations = Object.keys(holidaysData).filter((loc) => (holidaysData[loc] || []).includes(iso));

                return (
                  <div key={iso} style={{ minHeight: 72, padding: 6, borderLeft: '1px solid #fff', background: inSprint ? '#E6F7FF' : '#fff', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 11, color: '#6b7280' }}>{iso.slice(8)}</div>

                    {holidayLocations.length > 0 && <div style={{ position: 'absolute', left: 6, top: 6, width: 8, height: 8, background: '#F3F4F6', borderRadius: 2 }} />}

                    <div style={{ marginTop: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {members.map((m) => {
                        const onPto = (m.pto || []).some((p) => iso >= p.fromDate && iso <= p.toDate);
                        if (!onPto) return null;
                        const c = colorForString(m.name);
                        return <div key={m.id + '-' + iso} title={`${m.name} PTO`} style={{ width: 12, height: 12, background: c, borderRadius: 3 }} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#E6F7FF', borderRadius: 2 }} />
          <div style={{ color: '#374151' }}>Sprint day</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#FFE6E6', borderRadius: 2 }} />
          <div style={{ color: '#374151' }}>PTO</div>
        </div>
      </div>
    </div>
  );
}
