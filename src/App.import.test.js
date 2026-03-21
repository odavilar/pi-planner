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
    pi: { name: 'Test PI', startDate: '2025-01-01', endDate: '2025-03-31' },
    sprints: [
      { startDate: '2025-01-01', endDate: '2025-01-14' }
    ],
    members: [
      { name: 'Alice', location: 'London', allocation: 80, pto: [{ fromDate: '2025-01-06', toDate: '2025-01-06' }] }
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
  expect(screen.getByText(/2025-01-01 → 2025-03-31/)).toBeInTheDocument();
});
