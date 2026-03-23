// Copyright (c) 2026 odavilar
import React from 'react';
import { Card, CardContent, Stack, Button } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SectionHeader from './shared/SectionHeaderProxy';

export default function ImportExport({ exportPlan, importPlan }) {
  return (
    <Card>
      <CardContent>
        <SectionHeader title="Import / Export" subtitle="Save the current plan locally or load an existing JSON file." />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" color="secondary" startIcon={<DownloadOutlinedIcon />} onClick={exportPlan}>
            Export Plan JSON
          </Button>

          <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />}>
            Import Plan JSON
            <input hidden type="file" accept="application/json" onChange={importPlan} />
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
