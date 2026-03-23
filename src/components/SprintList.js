// Copyright (c) 2026 odavilar
import React from 'react';
import { Card, CardContent, Stack, Button, Divider, Paper, Box, Typography, IconButton } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SectionHeader from './shared/SectionHeaderProxy';

export default function SprintList({ sprints, sprintForm, setSprintForm, addSprint, removeSprint, pi, PlannerDateField }) {
  return (
    <Card>
      <CardContent>
        <SectionHeader
          title="Sprints"
          subtitle="Add sprint date ranges. Names are generated automatically from the PI name and sorted by date."
        />
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <PlannerDateField
              label="Start Date"
              required
              value={sprintForm.startDate}
              onChange={(value) => setSprintForm((prev) => ({ ...prev, startDate: value }))}
              minDate={pi.startDate || undefined}
              maxDate={sprintForm.endDate || pi.endDate || undefined}
              emptyHelperText="Select sprint start date"
            />

            <PlannerDateField
              label="End Date"
              required
              value={sprintForm.endDate}
              onChange={(value) => setSprintForm((prev) => ({ ...prev, endDate: value }))}
              minDate={sprintForm.startDate || pi.startDate || undefined}
              maxDate={pi.endDate || undefined}
              emptyHelperText="Select sprint end date"
            />
          </Stack>

          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={addSprint}>
            Add Sprint
          </Button>

          <Divider />

          <Stack spacing={1.25}>
            {sprints.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No sprints added yet.</Typography>
            ) : (
              sprints.map((s) => (
                <Paper key={s.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2">{s.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.startDate} → {s.endDate}</Typography>
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
  );
}
