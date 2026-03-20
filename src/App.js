import React, { useMemo, useState } from "react";
import "./App.css";
import holidaysData from "./holidays.json";

/* ---------------------- Date/Capacity Helpers ---------------------- */

function toISODate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function parseDate(iso) {
  return new Date(iso + "T00:00:00");
}

function eachDateInclusive(startISO, endISO) {
  const out = [];
  let d = parseDate(startISO);
  const end = parseDate(endISO);
  while (d <= end) {
    out.push(toISODate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function isWeekend(iso) {
  const day = parseDate(iso).getDay();
  return day === 0 || day === 6;
}

function overlapRange(aStart, aEnd, bStart, bEnd) {
  const s = aStart > bStart ? aStart : bStart;
  const e = aEnd < bEnd ? aEnd : bEnd;
  if (s > e) return null;
  return { start: s, end: e };
}

function unique(arr) {
  return [...new Set(arr)];
}

function getWorkingDays(startISO, endISO) {
  return eachDateInclusive(startISO, endISO).filter((d) => !isWeekend(d));
}

// 8h/day, 1 SP = 8h => SP equals effective person-days under this model
function calcMemberCapacityForSprint(member, sprint, holidayMap) {
  const sprintWorking = getWorkingDays(sprint.startDate, sprint.endDate);
  const sprintSet = new Set(sprintWorking);

  // Holidays for member location (only weekdays inside sprint)
  const locHolidays = (holidayMap[member.location] || []).filter(
    (d) => sprintSet.has(d) && !isWeekend(d)
  );

  // PTO overlap with sprint (only weekdays)
  let ptoDays = [];
  for (const p of member.pto) {
    const ov = overlapRange(p.fromDate, p.toDate, sprint.startDate, sprint.endDate);
    if (!ov) continue;
    ptoDays = ptoDays.concat(getWorkingDays(ov.start, ov.end));
  }
  ptoDays = unique(ptoDays);

  // Avoid double subtraction if PTO falls on holiday
  const holidaySet = new Set(locHolidays);
  const effectivePto = ptoDays.filter((d) => !holidaySet.has(d));

  const availableDays = Math.max(
    0,
    sprintWorking.length - locHolidays.length - effectivePto.length
  );

  const allocationFactor = (Number(member.allocation) || 0) / 100;
  const capacityDays = availableDays * allocationFactor;
  const capacityHours = capacityDays * 8;
  const capacityStoryPoints = capacityHours / 8;

  return {
    workingDays: sprintWorking.length,
    holidays: locHolidays.length,
    ptoDays: effectivePto.length,
    availableDays,
    allocation: Number(member.allocation) || 0,
    capacityDays: Number(capacityDays.toFixed(2)),
    capacityHours: Number(capacityHours.toFixed(2)),
    capacityStoryPoints: Number(capacityStoryPoints.toFixed(2)),
  };
}

/* ---------------------- Sprint Naming Helper ---------------------- */

function normalizeSprintNames(sprints, piName) {
  const base = (piName || "PI").trim();

  const sorted = [...sprints].sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    if (a.endDate !== b.endDate) return a.endDate.localeCompare(b.endDate);
    return (a.id || "").localeCompare(b.id || "");
  });

  return sorted.map((s, index) => ({
    ...s,
    name: `${base}.${index + 1}`,
  }));
}

/* ---------------------- Main App ---------------------- */

export default function App() {
  const [pi, setPi] = useState({
    name: "PI Planning",
    startDate: "",
    endDate: "",
  });

  const [sprints, setSprints] = useState([]);
  const [sprintForm, setSprintForm] = useState({
    startDate: "",
    endDate: "",
  });

  const [members, setMembers] = useState([]);
  const [memberForm, setMemberForm] = useState({
    name: "",
    location: "",
    allocation: 100,
    pto: [],
  });

  const [ptoForm, setPtoForm] = useState({ fromDate: "", toDate: "" });

  // -------- PI --------
  const onPiChange = (e) => {
    const { name, value } = e.target;

    setPi((prevPi) => {
      const nextPi = { ...prevPi, [name]: value };

      // If PI name changes, regenerate sprint names
      if (name === "name") {
        setSprints((prevSprints) => normalizeSprintNames(prevSprints, nextPi.name));
      }

      return nextPi;
    });
  };

  // -------- Sprints --------
  const onSprintChange = (e) => {
    const { name, value } = e.target;
    setSprintForm((s) => ({ ...s, [name]: value }));
  };

  const addSprint = () => {
    if (!sprintForm.startDate || !sprintForm.endDate) {
      alert("Please fill sprint start/end.");
      return;
    }
    if (sprintForm.startDate > sprintForm.endDate) {
      alert("Sprint start date must be <= end date.");
      return;
    }

    const next = [
      ...sprints,
      {
        id: crypto.randomUUID(),
        startDate: sprintForm.startDate,
        endDate: sprintForm.endDate,
      },
    ];

    setSprints(normalizeSprintNames(next, pi.name));
    setSprintForm({ startDate: "", endDate: "" });
  };

  const removeSprint = (id) => {
    const next = sprints.filter((s) => s.id !== id);
    setSprints(normalizeSprintNames(next, pi.name));
  };

  // -------- Members / PTO --------
  const onMemberChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((m) => ({ ...m, [name]: name === "allocation" ? Number(value) : value }));
  };

  const onPtoChange = (e) => {
    const { name, value } = e.target;
    setPtoForm((p) => ({ ...p, [name]: value }));
  };

  const addPtoToMemberDraft = () => {
    if (!ptoForm.fromDate) {
      alert("PTO from date is required.");
      return;
    }
    const toDate = ptoForm.toDate || ptoForm.fromDate;
    if (ptoForm.fromDate > toDate) {
      alert("PTO from date must be <= to date.");
      return;
    }

    setMemberForm((m) => ({
      ...m,
      pto: [...m.pto, { id: crypto.randomUUID(), fromDate: ptoForm.fromDate, toDate }],
    }));
    setPtoForm({ fromDate: "", toDate: "" });
  };

  const removeDraftPto = (id) => {
    setMemberForm((m) => ({ ...m, pto: m.pto.filter((p) => p.id !== id) }));
  };

  const addMember = () => {
    if (!memberForm.name || !memberForm.location) {
      alert("Member name and location are required.");
      return;
    }
    if (memberForm.allocation < 0 || memberForm.allocation > 100) {
      alert("Allocation must be between 0 and 100.");
      return;
    }

    setMembers((prev) => [...prev, { ...memberForm, id: crypto.randomUUID() }]);
    setMemberForm({ name: "", location: "", allocation: 100, pto: [] });
    setPtoForm({ fromDate: "", toDate: "" });
  };

  const removeMember = (id) => setMembers((prev) => prev.filter((m) => m.id !== id));

  // -------- Validation --------
  const validationIssues = useMemo(() => {
    const issues = [];

    if (pi.startDate && pi.endDate && pi.startDate > pi.endDate) {
      issues.push("PI start date must be <= PI end date.");
    }

    // Sprint in PI range
    if (pi.startDate && pi.endDate) {
      for (const s of sprints) {
        if (s.startDate < pi.startDate || s.endDate > pi.endDate) {
          issues.push(`Sprint "${s.name}" is outside PI range.`);
        }
      }
    }

    // Overlap check
    const sorted = [...sprints].sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return a.endDate.localeCompare(b.endDate);
    });

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (cur.startDate <= prev.endDate) {
        issues.push(`Sprints "${prev.name}" and "${cur.name}" overlap.`);
      }
    }

    // Unknown member locations
    for (const m of members) {
      if (!holidaysData[m.location]) {
        issues.push(
          `No holiday calendar for location "${m.location}" (member: ${m.name}). Holidays treated as 0.`
        );
      }
    }

    return issues;
  }, [pi, sprints, members]);

  // -------- Results Matrix --------
  const results = useMemo(() => {
    return sprints.map((s) => {
      const memberRows = members.map((m) => ({
        member: m,
        ...calcMemberCapacityForSprint(m, s, holidaysData),
      }));

      const totalCapacityDays = Number(
        memberRows.reduce((acc, r) => acc + r.capacityDays, 0).toFixed(2)
      );
      const totalCapacityHours = Number(
        memberRows.reduce((acc, r) => acc + r.capacityHours, 0).toFixed(2)
      );
      const totalCapacityStoryPoints = Number(
        memberRows.reduce((acc, r) => acc + r.capacityStoryPoints, 0).toFixed(2)
      );

      return {
        sprint: s,
        memberRows,
        totalCapacityDays,
        totalCapacityHours,
        totalCapacityStoryPoints,
      };
    });
  }, [sprints, members]);

  // -------- PI Totals --------
  const piTotals = useMemo(() => {
    const totalDays = Number(
      results.reduce((acc, s) => acc + s.totalCapacityDays, 0).toFixed(2)
    );
    const totalHours = Number(
      results.reduce((acc, s) => acc + s.totalCapacityHours, 0).toFixed(2)
    );
    const totalStoryPoints = Number(
      results.reduce((acc, s) => acc + s.totalCapacityStoryPoints, 0).toFixed(2)
    );

    return {
      totalDays,
      totalHours,
      totalStoryPoints,
    };
  }, [results]);

  // -------- Export / Import JSON --------
  const exportPlan = () => {
    const plan = { pi, sprints, members };
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pi-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlan = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.pi || !Array.isArray(data.sprints) || !Array.isArray(data.members)) {
          throw new Error("Invalid JSON structure.");
        }

        const importedPi = data.pi;
        const normalizedSprints = normalizeSprintNames(data.sprints, importedPi?.name || "PI");

        setPi(importedPi);
        setSprints(normalizedSprints);
        setMembers(data.members);
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container">
      <h1>PI Capacity Planner (Frontend Only)</h1>

      <section className="card">
        <h2>1) Program Increment</h2>
        <div className="row">
          <label>
            PI Name
            <input name="name" value={pi.name} onChange={onPiChange} />
          </label>
          <label>
            Start Date
            <input type="date" name="startDate" value={pi.startDate} onChange={onPiChange} />
          </label>
          <label>
            End Date
            <input type="date" name="endDate" value={pi.endDate} onChange={onPiChange} />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>2) Sprints</h2>
        <div className="row">
          <label>
            Start Date
            <input
              type="date"
              name="startDate"
              value={sprintForm.startDate}
              onChange={onSprintChange}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              name="endDate"
              value={sprintForm.endDate}
              onChange={onSprintChange}
            />
          </label>
          <button onClick={addSprint}>Add Sprint</button>
        </div>

        <ul>
          {sprints.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong> ({s.startDate} → {s.endDate})
              <button className="danger" onClick={() => removeSprint(s.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>3) Team Members</h2>
        <div className="row">
          <label>
            Name
            <input name="name" value={memberForm.name} onChange={onMemberChange} />
          </label>
          <label>
            Location
            <input
              name="location"
              value={memberForm.location}
              onChange={onMemberChange}
              list="locations"
              placeholder="London"
            />
            <datalist id="locations">
              {Object.keys(holidaysData).map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </label>
          <label>
            Allocation %
            <input
              type="number"
              min="0"
              max="100"
              name="allocation"
              value={memberForm.allocation}
              onChange={onMemberChange}
            />
          </label>
        </div>

        <h3>Add PTO to Draft Member</h3>
        <div className="row">
          <label>
            From
            <input type="date" name="fromDate" value={ptoForm.fromDate} onChange={onPtoChange} />
          </label>
          <label>
            To (optional, defaults to From)
            <input type="date" name="toDate" value={ptoForm.toDate} onChange={onPtoChange} />
          </label>
          <button onClick={addPtoToMemberDraft}>Add PTO</button>
        </div>

        {memberForm.pto.length > 0 && (
          <ul>
            {memberForm.pto.map((p) => (
              <li key={p.id}>
                PTO: {p.fromDate} → {p.toDate}
                <button className="danger" onClick={() => removeDraftPto(p.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button onClick={addMember}>Add Member</button>

        <h3>Current Members</h3>
        <ul>
          {members.map((m) => (
            <li key={m.id}>
              <strong>{m.name}</strong> | {m.location} | Allocation: {m.allocation}% | PTO entries:{" "}
              {m.pto.length}
              <button className="danger" onClick={() => removeMember(m.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>4) Validation</h2>
        {validationIssues.length === 0 ? (
          <p className="ok">No validation issues found.</p>
        ) : (
          <ul className="warn">
            {validationIssues.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>5) PI Total Capacity / Velocity</h2>
        {sprints.length === 0 || members.length === 0 ? (
          <p>Add at least one sprint and one member.</p>
        ) : (
          <p>
            <strong>{pi.name || "PI"} Totals: </strong>
            {piTotals.totalDays} days | {piTotals.totalHours} hours | {piTotals.totalStoryPoints} story points
          </p>
        )}
      </section>

      <section className="card">
        <h2>6) Sprint Capacity Results</h2>
        {sprints.length === 0 || members.length === 0 ? (
          <p>Add at least one sprint and one member.</p>
        ) : (
          results.map((r) => (
            <div key={r.sprint.id} className="resultBlock">
              <h3>
                {r.sprint.name} ({r.sprint.startDate} → {r.sprint.endDate})
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Working Days</th>
                    <th>Holidays</th>
                    <th>PTO</th>
                    <th>Available</th>
                    <th>Allocation %</th>
                    <th>Capacity (days)</th>
                    <th>Capacity (hours)</th>
                    <th>Capacity (story points)</th>
                  </tr>
                </thead>
                <tbody>
                  {r.memberRows.map((row) => (
                    <tr key={row.member.id}>
                      <td>{row.member.name}</td>
                      <td>{row.workingDays}</td>
                      <td>{row.holidays}</td>
                      <td>{row.ptoDays}</td>
                      <td>{row.availableDays}</td>
                      <td>{row.allocation}</td>
                      <td><strong>{row.capacityDays}</strong></td>
                      <td><strong>{row.capacityHours}</strong></td>
                      <td><strong>{row.capacityStoryPoints}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <strong>Total Sprint Capacity: </strong>
                {r.totalCapacityDays} days | {r.totalCapacityHours} hours | {r.totalCapacityStoryPoints} story points
              </p>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>7) Export / Import</h2>
        <div className="row">
          <button onClick={exportPlan}>Export Plan JSON</button>
          <label className="fileLabel">
            Import Plan JSON
            <input type="file" accept="application/json" onChange={importPlan} />
          </label>
        </div>
      </section>
    </div>
  );
}