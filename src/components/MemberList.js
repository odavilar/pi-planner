// Copyright (c) 2026 odavilar
import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Divider,
  Typography,
  Paper,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SectionHeader from './shared/SectionHeaderProxy';

export default function MemberList({
  memberForm,
  onMemberChange,
  ptoForm,
  setPtoForm,
  addPtoToMemberDraft,
  removeDraftPto,
  addMember,
  members,
  removeMember,
  editingMemberId,
  editMemberDraft,
  startEditingMember,
  cancelEditMember,
  onEditMemberChange,
  editPtoForm,
  setEditPtoForm,
  addPtoToEditMember,
  removeEditPto,
  saveEditMember,
  PlannerDateField,
  holidaysData,
}) {
  return (
    <Card>
      <CardContent>
        <SectionHeader title="Team Members" subtitle="Create a member, assign a location, allocation, and PTO." />

        <Stack spacing={2}>
          <TextField label="Name" name="name" value={memberForm.name ?? ''} onChange={onMemberChange} />

          <TextField
            label="Location"
            name="location"
            value={memberForm.location ?? ''}
            onChange={onMemberChange}
            placeholder="London"
            select={false}
            inputProps={{ list: 'locations' }}
          />
          <datalist id="locations">
            {Object.keys(holidaysData).map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>

          <TextField label="Allocation %" type="number" inputProps={{ min: 0, max: 100 }} name="allocation" value={memberForm.allocation ?? ''} onChange={onMemberChange} />

          <Divider />

          <Typography variant="subtitle1">Draft PTO</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <PlannerDateField
              label="From"
              required
              value={ptoForm.fromDate}
              onChange={(value) => setPtoForm((prev) => ({ ...prev, fromDate: value }))}
              maxDate={ptoForm.toDate || undefined}
              emptyHelperText="Select PTO start date"
            />

            <PlannerDateField
              label="To"
              value={ptoForm.toDate}
              onChange={(value) => setPtoForm((prev) => ({ ...prev, toDate: value }))}
              minDate={ptoForm.fromDate || undefined}
              emptyHelperText="Optional — defaults to the same day"
            />
          </Stack>

          <Button variant="outlined" onClick={addPtoToMemberDraft}>
            Add PTO to Draft Member
          </Button>

          <Stack spacing={1}>
            {memberForm.pto.map((p) => (
              <Paper key={p.id} variant="outlined" sx={{ p: 1.25, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">PTO: {p.fromDate} → {p.toDate}</Typography>
                <IconButton color="error" onClick={() => removeDraftPto(p.id)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            ))}
          </Stack>

          <Button variant="contained" color="primary" onClick={addMember} startIcon={<AddOutlinedIcon />}>
            Add Member
          </Button>

          <Divider />

          <Typography variant="subtitle1">Current Members</Typography>
          <Stack spacing={1.25}>
            {members.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No members added yet.</Typography>
            ) : (
              members.map((m) => (
                <Paper key={m.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  {editingMemberId === m.id && editMemberDraft ? (
                    <Stack spacing={1}>
                      <Box>
                        <TextField label="Name" name="name" value={editMemberDraft.name ?? ''} onChange={onEditMemberChange} />

                        <TextField
                          label="Location"
                          name="location"
                          value={editMemberDraft.location ?? ''}
                          onChange={onEditMemberChange}
                          placeholder="London"
                          inputProps={{ list: 'locations' }}
                          sx={{ mt: 1 }}
                        />

                        <TextField
                          label="Allocation %"
                          type="number"
                          inputProps={{ min: 0, max: 100 }}
                          name="allocation"
                          value={editMemberDraft.allocation ?? ''}
                          onChange={onEditMemberChange}
                          sx={{ mt: 1 }}
                        />

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle2">PTO</Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {(editMemberDraft.pto || []).map((p) => (
                            <Paper key={p.id} variant="outlined" sx={{ p: 1, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2">{p.fromDate} → {p.toDate}</Typography>
                              <IconButton color="error" onClick={() => removeEditPto(p.id)}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Paper>
                          ))}

                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                            <PlannerDateField label="From" required value={editPtoForm.fromDate} onChange={(value) => setEditPtoForm((prev) => ({ ...prev, fromDate: value }))} maxDate={editPtoForm.toDate || undefined} emptyHelperText="Select PTO start date" />

                            <PlannerDateField label="To" value={editPtoForm.toDate} onChange={(value) => setEditPtoForm((prev) => ({ ...prev, toDate: value }))} minDate={editPtoForm.fromDate || undefined} emptyHelperText="Optional — defaults to the same day" />

                            <Button variant="outlined" onClick={addPtoToEditMember}>Add PTO</Button>
                          </Stack>
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button variant="contained" onClick={saveEditMember}>Save</Button>
                        <Button variant="outlined" onClick={cancelEditMember}>Cancel</Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">{m.name}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                          <Chip size="small" label={m.location} />
                          <Chip size="small" variant="outlined" label={`${m.allocation}% allocation`} />
                          <Chip size="small" variant="outlined" label={`${(m.pto || []).length} PTO entries`} />
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton color="primary" onClick={() => startEditingMember(m.id)}>
                          <EditOutlinedIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => removeMember(m.id)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  )}
                </Paper>
              ))
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
