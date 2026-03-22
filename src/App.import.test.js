import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders header and basic UI', () => {
  render(<App />);
  expect(screen.getByText(/PI Capacity Planner/i)).toBeInTheDocument();
  expect(screen.getByText(/Program Increment/i)).toBeInTheDocument();
  // There are multiple matching "Team Members" texts (header + subtitle), assert at least one exists
  expect(screen.getAllByText(/Team Members/i).length).toBeGreaterThan(0);
});

test('imports plan JSON and shows imported member', async () => {
  render(<App />);

  const plan = {
    pi: { name: 'Test PI', startDate: '2026-01-01', endDate: '2026-01-31' },
    sprints: [
      { startDate: '2026-01-01', endDate: '2026-01-14' }
    ],
    members: [
      { name: 'Alice', location: 'TSR', allocation: 80, pto: [{ fromDate: '2026-01-06', toDate: '2026-01-06' }] }
    ]
  };

  const file = new File([JSON.stringify(plan)], 'plan.json', { type: 'application/json' });

  // find the hidden file input
  const input = document.querySelector('input[type=file]');
  expect(input).toBeTruthy();

  // Simulate user selecting the file
  await waitFor(() => {
    fireEvent.change(input, { target: { files: [file] } });
  });

  // After import, PI name and date range should update
  await waitFor(() => expect(screen.getAllByText(/Test PI/).length).toBeGreaterThan(0));
  expect(screen.getByText(/2026-01-01 → 2026-01-31/)).toBeInTheDocument();
});

test('imported members map to holiday calendars and holiday markers render', async () => {
  render(<App />);

  const plan = {
    pi: { name: 'Holiday PI', startDate: '2026-01-01', endDate: '2026-01-10' },
    sprints: [ { startDate: '2026-01-01', endDate: '2026-01-07' } ],
    members: [ { name: 'Bob', location: 'TSR', allocation: 100, pto: [] } ]
  };

  const file = new File([JSON.stringify(plan)], 'plan2.json', { type: 'application/json' });
  const input = document.querySelector('input[type=file]');
  await waitFor(() => {
    fireEvent.change(input, { target: { files: [file] } });
  });

  // Wait for import to apply
  await waitFor(() => expect(screen.getAllByText(/Holiday PI/).length).toBeGreaterThan(0));

  // There should be at least one day cell whose title includes the holiday location key (Timisoara)
  const holidayCell = Array.from(document.querySelectorAll('[title]')).find(el => /Timisoara|TSR/.test(el.getAttribute('title')));
  expect(holidayCell).toBeTruthy();
});
