import React from 'react';
import { Card, CardContent, TextField, Stack } from '@mui/material';
import SectionHeader from './shared/SectionHeaderProxy';

export default function PiForm({ pi, onPiChange, PlannerDateField, setPi }) {
  return (
    <Card>
      <CardContent>
        <SectionHeader
          title="Program Increment"
          subtitle="Define the PI name and date range. Required date fields stay highlighted until selected."
        />
        <Stack spacing={2}>
          <TextField
            label="PI Name"
            name="name"
            value={pi.name ?? ''}
            onChange={onPiChange}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <PlannerDateField
              label="Start Date"
              required
              value={pi.startDate}
              onChange={(value) => setPi((prev) => ({ ...prev, startDate: value }))}
              maxDate={pi.endDate || undefined}
              emptyHelperText="Select the PI start date"
            />

            <PlannerDateField
              label="End Date"
              required
              value={pi.endDate}
              onChange={(value) => setPi((prev) => ({ ...prev, endDate: value }))}
              minDate={pi.startDate || undefined}
              emptyHelperText="Select the PI end date"
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
