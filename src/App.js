import React, { useMemo, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";

import holidaysData from "./holidays.json";
import PiForm from "./components/PiForm";
import SprintList from "./components/SprintList";
import MemberList from "./components/MemberList";
import ImportExport from "./components/ImportExport";
import CalendarView from "./components/CalendarView";

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

function formatLocalDate(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

// 8h/day and 1 SP = 8h under this planning model
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
  const capacityHours = availableDays * allocationFactor * 8;
  const capacityStoryPoints = capacityHours / 8;

  return {
    workingDays: sprintWorking.length,
    holidays: locHolidays.length,
    ptoDays: effectivePto.length,
    availableDays,
    allocation: Number(member.allocation) || 0,
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
    id: s.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sprint-${Date.now()}-${index}`),
    name: `${base}.${index + 1}`,
  }));
}

/* ---------------------- Small Presentational Components ---------------------- */

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

function PlannerDateField({
  label,
  value,
  onChange,
  required = false,
  emptyHelperText = "Select a date",
  minDate,
  maxDate,
}) {
  const isEmpty = !value;

  return (
    <DatePicker
      label={label}
        format="yyyy-MM-dd"
        value={value ? parseDate(value) : undefined}
      onChange={(newValue) => {
        if (!newValue || Number.isNaN(newValue.getTime())) {
          onChange("");
          return;
        }
        onChange(formatLocalDate(newValue));
      }}
      minDate={minDate ? parseDate(minDate) : undefined}
      maxDate={maxDate ? parseDate(maxDate) : undefined}
      slotProps={{
        textField: {
          required,
          fullWidth: true,
          size: "small",
          helperText: isEmpty ? emptyHelperText : "Format: YYYY-MM-DD",
          sx: isEmpty
            ? {
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#FFF8E1",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderStyle: "dashed",
                  borderColor: "#B65C02",
                },
              }
            : undefined,
        },
      }}
    />
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
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberDraft, setEditMemberDraft] = useState(null);
  const [editPtoForm, setEditPtoForm] = useState({ fromDate: "", toDate: "" });
  const [memberForm, setMemberForm] = useState({
    name: "",
    location: "",
    allocation: 100,
    pto: [],
  });

  const [ptoForm, setPtoForm] = useState({ fromDate: "", toDate: "" });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = (message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

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

  const addSprint = () => {
    if (!sprintForm.startDate || !sprintForm.endDate) {
      showToast("Please select both sprint start and end dates.", "warning");
      return;
    }

    if (sprintForm.startDate > sprintForm.endDate) {
      showToast("Sprint start date must be before or equal to the end date.", "error");
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
    showToast("Sprint added successfully.", "success");
  };

  const removeSprint = (id) => {
    setSprints((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return normalizeSprintNames(next, pi.name);
    });
    showToast("Sprint removed.", "info");
  };

  /* -------- Members / PTO -------- */

  const onMemberChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((m) => ({
      ...m,
      [name]: name === "allocation" ? Number(value) : value,
    }));
  };

  const addPtoToMemberDraft = () => {
    if (!ptoForm.fromDate) {
      showToast("PTO start date is required.", "warning");
      return;
    }

    const toDate = ptoForm.toDate || ptoForm.fromDate;
    if (ptoForm.fromDate > toDate) {
      showToast("PTO start date must be before or equal to the end date.", "error");
      return;
    }

    setMemberForm((m) => ({
      ...m,
      pto: [
        ...m.pto,
        {
          id: crypto.randomUUID(),
          fromDate: ptoForm.fromDate,
          toDate,
        },
      ],
    }));

    setPtoForm({ fromDate: "", toDate: "" });
    showToast("PTO added to draft member.", "success");
  };

  const removeDraftPto = (id) => {
    setMemberForm((m) => ({
      ...m,
      pto: m.pto.filter((p) => p.id !== id),
    }));
    showToast("Draft PTO entry removed.", "info");
  };

  const addMember = () => {
    if (!memberForm.name || !memberForm.location) {
      showToast("Member name and location are required.", "warning");
      return;
    }

    if (memberForm.allocation < 0 || memberForm.allocation > 100) {
      showToast("Allocation must be between 0 and 100.", "error");
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
    showToast("Member added successfully.", "success");
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    showToast("Member removed.", "info");
  };

  /* -------- Member Editing -------- */

  const startEditingMember = (id) => {
    const m = members.find((x) => x.id === id);
    if (!m) return;
    setEditMemberDraft(JSON.parse(JSON.stringify(m)));
    setEditingMemberId(id);
  };

  const cancelEditMember = () => {
    setEditingMemberId(null);
    setEditMemberDraft(null);
    setEditPtoForm({ fromDate: "", toDate: "" });
  };

  const onEditMemberChange = (e) => {
    const { name, value } = e.target;
    setEditMemberDraft((m) => ({
      ...m,
      [name]: name === "allocation" ? Number(value) : value,
    }));
  };

  const addPtoToEditMember = () => {
    if (!editPtoForm.fromDate) {
      showToast("PTO start date is required.", "warning");
      return;
    }

    const toDate = editPtoForm.toDate || editPtoForm.fromDate;
    if (editPtoForm.fromDate > toDate) {
      showToast("PTO start date must be before or equal to the end date.", "error");
      return;
    }

    setEditMemberDraft((m) => ({
      ...m,
      pto: [
        ...(m.pto || []),
        { id: crypto.randomUUID(), fromDate: editPtoForm.fromDate, toDate },
      ],
    }));

    setEditPtoForm({ fromDate: "", toDate: "" });
    showToast("PTO added to member draft.", "success");
  };

  const removeEditPto = (id) => {
    setEditMemberDraft((m) => ({ ...m, pto: (m.pto || []).filter((p) => p.id !== id) }));
    showToast("PTO removed from draft.", "info");
  };

  const saveEditMember = () => {
    if (!editMemberDraft.name || !editMemberDraft.location) {
      showToast("Member name and location are required.", "warning");
      return;
    }

    if (editMemberDraft.allocation < 0 || editMemberDraft.allocation > 100) {
      showToast("Allocation must be between 0 and 100.", "error");
      return;
    }

    setMembers((prev) => prev.map((m) => (m.id === editingMemberId ? editMemberDraft : m)));
    cancelEditMember();
    showToast("Member updated successfully.", "success");
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

      const totalCapacityHours = Number(
        memberRows.reduce((acc, r) => acc + r.capacityHours, 0).toFixed(2)
      );

      const totalCapacityStoryPoints = Number(
        memberRows.reduce((acc, r) => acc + r.capacityStoryPoints, 0).toFixed(2)
      );

      return {
        sprint: s,
        memberRows,
        totalCapacityHours,
        totalCapacityStoryPoints,
      };
    });
  }, [sprints, members]);

  const piTotals = useMemo(() => {
    const totalHours = Number(
      results.reduce((acc, s) => acc + s.totalCapacityHours, 0).toFixed(2)
    );

    const totalStoryPoints = Number(
      results.reduce((acc, s) => acc + s.totalCapacityStoryPoints, 0).toFixed(2)
    );

    return {
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
    showToast("Plan exported successfully.", "success");
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
        setMembers(
          data.members.map((m, idx) => ({
            ...m,
            id: m.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `member-${Date.now()}-${idx}`),
            pto: m.pto || [],
          }))
        );
        showToast("Plan imported successfully.", "success");
      } catch (e) {
        showToast(`Import failed: ${e.message}`, "error");
      }
    };
    reader.readAsText(file);

    // Allows re-importing the same file without needing to pick a different one first
    event.target.value = "";
  };

  /* -------- Derived UI values -------- */

  const piDateLabel =
    pi.startDate && pi.endDate ? `${pi.startDate} → ${pi.endDate}` : "Dates not set";

  

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />

        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
          <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{ borderBottom: "1px solid #E5E7EB" }}
          >
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
              <Chip color="success" label={`${piTotals.totalStoryPoints} SP`} />
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
                <PiForm pi={pi} onPiChange={onPiChange} PlannerDateField={PlannerDateField} setPi={setPi} />

                <SprintList
                  sprints={sprints}
                  sprintForm={sprintForm}
                  setSprintForm={setSprintForm}
                  addSprint={addSprint}
                  removeSprint={removeSprint}
                  pi={pi}
                  PlannerDateField={PlannerDateField}
                />

                <MemberList
                  memberForm={memberForm}
                  onMemberChange={onMemberChange}
                  ptoForm={ptoForm}
                  setPtoForm={setPtoForm}
                  addPtoToMemberDraft={addPtoToMemberDraft}
                  removeDraftPto={removeDraftPto}
                  addMember={addMember}
                  members={members}
                  removeMember={removeMember}
                  editingMemberId={editingMemberId}
                  editMemberDraft={editMemberDraft}
                  startEditingMember={startEditingMember}
                  cancelEditMember={cancelEditMember}
                  onEditMemberChange={onEditMemberChange}
                  editPtoForm={editPtoForm}
                  setEditPtoForm={setEditPtoForm}
                  addPtoToEditMember={addPtoToEditMember}
                  removeEditPto={removeEditPto}
                  saveEditMember={saveEditMember}
                  PlannerDateField={PlannerDateField}
                  holidaysData={holidaysData}
                />
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
                    <CalendarView pi={pi} sprints={sprints} members={members} holidaysData={holidaysData} />
                  </CardContent>
                </Card>

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
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        flexWrap="wrap"
                      >
                        <Chip
                          color="primary"
                          variant="outlined"
                          label={`${piTotals.totalHours} hours`}
                        />
                        <Chip
                          color="success"
                          label={`${piTotals.totalStoryPoints} story points`}
                        />
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <SectionHeader
                      title="Sprint Capacity Results"
                      subtitle="Per-member capacity by sprint in hours and story points."
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
                                  <Chip size="small" label={`${r.totalCapacityHours} hours`} />
                                  <Chip
                                    size="small"
                                    color="success"
                                    label={`${r.totalCapacityStoryPoints} SP`}
                                  />
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
                                    <TableCell align="right">{r.totalCapacityHours}</TableCell>
                                    <TableCell align="right">
                                      {r.totalCapacityStoryPoints}
                                    </TableCell>
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

                <ImportExport exportPlan={exportPlan} importPlan={importPlan} />
              </Stack>
            </Box>
          </Container>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={3500}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}