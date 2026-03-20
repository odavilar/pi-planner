import React, { useMemo, useState } from "react";
import {
  ThemeProvider,
  createTheme,
} from "@mui/material/styles";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Chip,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Divider,
  IconButton,
} from "@mui/material";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import holidaysData from "./holidays.json";

/* ---------------------- Theme ---------------------- */

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0C66E4",
    },
    secondary: {
      main: "#44546F",
    },
    success: {
      main: "#1F845A",
    },
    warning: {
      main: "#B65C02",
    },
    error: {
      main: "#C9372C",
    },
    background: {
      default: "#F7F8F9",
      paper: "#FFFFFF",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E5E7EB",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        fullWidth: true,
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          background: "#F8FAFC",
        },
      },
    },
  },
});

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

  const locHolidays = (holidayMap[member.location] || []).filter(
    (d) => sprintSet.has(d) && !isWeekend(d)
  );

  let ptoDays = [];
  for (const p of member.pto) {
    const ov = overlapRange(
      p.fromDate,
      p.toDate,
      sprint.startDate,
      sprint.endDate
    );
    if (!ov) continue;
    ptoDays = ptoDays.concat(getWorkingDays(ov.start, ov.end));
  }
  ptoDays = unique(ptoDays);

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

/* ---------------------- Sprint Naming ---------------------- */

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

/* ---------------------- Small Presentational Component ---------------------- */

function StatCard({ icon, label, value, color = "primary.main" }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "rgba(12, 102, 228, 0.08)",
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6">{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
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

  /* -------- PI -------- */

  const onPiChange = (e) => {
    const { name, value } = e.target;

    setPi((prevPi) => {
      const nextPi = { ...prevPi, [name]: value };
      if (name === "name") {
        setSprints((prevSprints) => normalizeSprintNames(prevSprints, nextPi.name));
      }
      return nextPi;
    });
  };

  /* -------- Sprints -------- */

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

  /* -------- Members / PTO -------- */

  const onMemberChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((m) => ({
      ...m,
      [name]: name === "allocation" ? Number(value) : value,
    }));
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
    setMemberForm((m) => ({
      ...m,
      pto: m.pto.filter((p) => p.id !== id),
    }));
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
    setMemberForm({
      name: "",
      location: "",
      allocation: 100,
      pto: [],
    });
    setPtoForm({ fromDate: "", toDate: "" });
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  /* -------- Validation -------- */

  const validationIssues = useMemo(() => {
    const issues = [];

    if (pi.startDate && pi.endDate && pi.startDate > pi.endDate) {
      issues.push("PI start date must be less than or equal to PI end date.");
    }

    if (pi.startDate && pi.endDate) {
      for (const s of sprints) {
        if (s.startDate < pi.startDate || s.endDate > pi.endDate) {
          issues.push(`Sprint "${s.name}" is outside the PI date range.`);
        }
      }
    }

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

    for (const m of members) {
      if (!holidaysData[m.location]) {
        issues.push(
          `No holiday calendar found for "${m.location}" (member: ${m.name}). Holidays will be treated as 0.`
        );
      }
    }

    return issues;
  }, [pi, sprints, members]);

  /* -------- Results -------- */

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

  /* -------- Export / Import -------- */

  const exportPlan = () => {
    const plan = { pi, sprints, members };
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json",
    });
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
        const normalizedSprints = normalizeSprintNames(
          data.sprints,
          importedPi?.name || "PI"
        );

        setPi(importedPi);
        setSprints(normalizedSprints);
        setMembers(data.members);
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  /* -------- Derived UI values -------- */

  const piDateLabel =
    pi.startDate && pi.endDate ? `${pi.startDate} → ${pi.endDate}` : "Dates not set";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #E5E7EB" }}>
          <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              PI Capacity Planner
            </Typography>

            <Chip
              color="primary"
              variant="outlined"
              label={pi.name || "Unnamed PI"}
            />
            <Chip
              variant="outlined"
              icon={<EventOutlinedIcon />}
              label={piDateLabel}
            />
            <Chip
              color="success"
              label={`${piTotals.totalStoryPoints} SP`}
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "380px 1fr" },
              gap: 3,
              alignItems: "start",
            }}
          >
            {/* LEFT COLUMN */}
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <SectionHeader
                    title="Program Increment"
                    subtitle="Define the PI name and date range."
                  />
                  <Stack spacing={2}>
                    <TextField
                      label="PI Name"
                      name="name"
                      value={pi.name}
                      onChange={onPiChange}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Start Date"
                        type="date"
                        name="startDate"
                        value={pi.startDate}
                        onChange={onPiChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        name="endDate"
                        value={pi.endDate}
                        onChange={onPiChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <SectionHeader
                    title="Sprints"
                    subtitle="Add sprint date ranges. Names are generated automatically from the PI name and sorted by date."
                  />
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Start Date"
                        type="date"
                        name="startDate"
                        value={sprintForm.startDate}
                        onChange={onSprintChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        name="endDate"
                        value={sprintForm.endDate}
                        onChange={onSprintChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>

                    <Button
                      variant="contained"
                      startIcon={<AddOutlinedIcon />}
                      onClick={addSprint}
                    >
                      Add Sprint
                    </Button>

                    <Divider />

                    <Stack spacing={1.25}>
                      {sprints.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No sprints added yet.
                        </Typography>
                      ) : (
                        sprints.map((s) => (
                          <Paper
                            key={s.id}
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2">{s.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {s.startDate} → {s.endDate}
                              </Typography>
                            </Box>
                            <IconButton color="error" onClick={() => removeSprint(s.id)}>
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <SectionHeader
                    title="Team Members"
                    subtitle="Create a member, assign a location, allocation, and PTO."
                  />

                  <Stack spacing={2}>
                    <TextField
                      label="Name"
                      name="name"
                      value={memberForm.name}
                      onChange={onMemberChange}
                    />

                    <TextField
                      label="Location"
                      name="location"
                      value={memberForm.location}
                      onChange={onMemberChange}
                      placeholder="London"
                      select={false}
                      inputProps={{ list: "locations" }}
                    />
                    <datalist id="locations">
                      {Object.keys(holidaysData).map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>

                    <TextField
                      label="Allocation %"
                      type="number"
                      inputProps={{ min: 0, max: 100 }}
                      name="allocation"
                      value={memberForm.allocation}
                      onChange={onMemberChange}
                    />

                    <Divider />

                    <Typography variant="subtitle1">Draft PTO</Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="From"
                        type="date"
                        name="fromDate"
                        value={ptoForm.fromDate}
                        onChange={onPtoChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="To"
                        type="date"
                        name="toDate"
                        value={ptoForm.toDate}
                        onChange={onPtoChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>

                    <Button variant="outlined" onClick={addPtoToMemberDraft}>
                      Add PTO to Draft Member
                    </Button>

                    <Stack spacing={1}>
                      {memberForm.pto.map((p) => (
                        <Paper
                          key={p.id}
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2">
                            PTO: {p.fromDate} → {p.toDate}
                          </Typography>
                          <IconButton color="error" onClick={() => removeDraftPto(p.id)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Paper>
                      ))}
                    </Stack>

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={addMember}
                      startIcon={<AddOutlinedIcon />}
                    >
                      Add Member
                    </Button>

                    <Divider />

                    <Typography variant="subtitle1">Current Members</Typography>
                    <Stack spacing={1.25}>
                      {members.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No members added yet.
                        </Typography>
                      ) : (
                        members.map((m) => (
                          <Paper
                            key={m.id}
                            variant="outlined"
                            sx={{ p: 1.5, borderRadius: 2 }}
                          >
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", sm: "center" }}
                            >
                              <Box>
                                <Typography variant="subtitle2">{m.name}</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                                  <Chip size="small" label={m.location} />
                                  <Chip size="small" variant="outlined" label={`${m.allocation}% allocation`} />
                                  <Chip size="small" variant="outlined" label={`${m.pto.length} PTO entries`} />
                                </Stack>
                              </Box>
                              <IconButton color="error" onClick={() => removeMember(m.id)}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Stack>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            {/* RIGHT COLUMN */}
            <Stack spacing={3}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <StatCard
                  icon={<AutoStoriesOutlinedIcon />}
                  label="PI Story Points"
                  value={piTotals.totalStoryPoints}
                  color="success.main"
                />
                <StatCard
                  icon={<ScheduleOutlinedIcon />}
                  label="PI Hours"
                  value={piTotals.totalHours}
                  color="primary.main"
                />
                <StatCard
                  icon={<GroupOutlinedIcon />}
                  label="Team Members"
                  value={members.length}
                  color="secondary.main"
                />
                <StatCard
                  icon={<EventOutlinedIcon />}
                  label="Sprints"
                  value={sprints.length}
                  color="warning.main"
                />
              </Box>

              <Card>
                <CardContent>
                  <SectionHeader
                    title="Validation"
                    subtitle="Warnings and data quality checks before trusting the capacity output."
                  />
                  <Stack spacing={1.25}>
                    {validationIssues.length === 0 ? (
                      <Alert severity="success">No validation issues found.</Alert>
                    ) : (
                      validationIssues.map((issue, idx) => (
                        <Alert key={idx} severity="warning">
                          {issue}
                        </Alert>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <SectionHeader
                    title="PI Total Capacity / Velocity"
                    subtitle="Aggregate capacity across all configured sprints."
                  />
                  {sprints.length === 0 || members.length === 0 ? (
                    <Alert severity="info">
                      Add at least one sprint and one member to compute PI totals.
                    </Alert>
                  ) : (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
                      <Chip color="primary" label={`${piTotals.totalDays} days`} />
                      <Chip color="primary" variant="outlined" label={`${piTotals.totalHours} hours`} />
                      <Chip color="success" label={`${piTotals.totalStoryPoints} story points`} />
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <SectionHeader
                    title="Sprint Capacity Results"
                    subtitle="Per-member capacity by sprint in days, hours, and story points."
                  />

                  {sprints.length === 0 || members.length === 0 ? (
                    <Alert severity="info">
                      Add at least one sprint and one member.
                    </Alert>
                  ) : (
                    <Stack spacing={3}>
                      {results.map((r) => (
                        <Paper
                          key={r.sprint.id}
                          variant="outlined"
                          sx={{ borderRadius: 3, overflow: "hidden" }}
                        >
                          <Box
                            sx={{
                              px: 2,
                              py: 1.5,
                              bgcolor: "#F8FAFC",
                              borderBottom: "1px solid #E5E7EB",
                            }}
                          >
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              spacing={1}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", md: "center" }}
                            >
                              <Box>
                                <Typography variant="subtitle1">{r.sprint.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {r.sprint.startDate} → {r.sprint.endDate}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip size="small" label={`${r.totalCapacityDays} days`} />
                                <Chip size="small" label={`${r.totalCapacityHours} hours`} />
                                <Chip size="small" color="success" label={`${r.totalCapacityStoryPoints} SP`} />
                              </Stack>
                            </Stack>
                          </Box>

                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Member</TableCell>
                                  <TableCell align="right">Working Days</TableCell>
                                  <TableCell align="right">Holidays</TableCell>
                                  <TableCell align="right">PTO</TableCell>
                                  <TableCell align="right">Available</TableCell>
                                  <TableCell align="right">Allocation %</TableCell>
                                  <TableCell align="right">Capacity Days</TableCell>
                                  <TableCell align="right">Capacity Hours</TableCell>
                                  <TableCell align="right">Story Points</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {r.memberRows.map((row) => (
                                  <TableRow key={row.member.id} hover>
                                    <TableCell>
                                      <Stack spacing={0.5}>
                                        <Typography variant="body2" fontWeight={600}>
                                          {row.member.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {row.member.location}
                                        </Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell align="right">{row.workingDays}</TableCell>
                                    <TableCell align="right">{row.holidays}</TableCell>
                                    <TableCell align="right">{row.ptoDays}</TableCell>
                                    <TableCell align="right">{row.availableDays}</TableCell>
                                    <TableCell align="right">{row.allocation}</TableCell>
                                    <TableCell align="right">{row.capacityDays}</TableCell>
                                    <TableCell align="right">{row.capacityHours}</TableCell>
                                    <TableCell align="right">
                                      <Typography fontWeight={700}>
                                        {row.capacityStoryPoints}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow
                                  sx={{
                                    "& td": {
                                      fontWeight: 700,
                                      backgroundColor: "#FCFCFD",
                                    },
                                  }}
                                >
                                  <TableCell>Total</TableCell>
                                  <TableCell />
                                  <TableCell />
                                  <TableCell />
                                  <TableCell />
                                  <TableCell />
                                  <TableCell align="right">{r.totalCapacityDays}</TableCell>
                                  <TableCell align="right">{r.totalCapacityHours}</TableCell>
                                  <TableCell align="right">{r.totalCapacityStoryPoints}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <SectionHeader
                    title="Import / Export"
                    subtitle="Save the current plan locally or load an existing JSON file."
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<DownloadOutlinedIcon />}
                      onClick={exportPlan}
                    >
                      Export Plan JSON
                    </Button>

                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadFileOutlinedIcon />}
                    >
                      Import Plan JSON
                      <input
                        hidden
                        type="file"
                        accept="application/json"
                        onChange={importPlan}
                      />
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}