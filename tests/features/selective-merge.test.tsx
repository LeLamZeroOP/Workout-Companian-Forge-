import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { buildMergePlan } from '../../src/domain/selectiveMerge';
import type { PreparedMerge } from '../../src/data/cloudSync';
import { SelectiveMerge } from '../../src/features/settings/SelectiveMerge';

it('starts with nothing selected, previews without committing, and explicitly confirms selected records', async () => {
  const user = userEvent.setup(); const source = createDefaultData(); const account = createDefaultData(); account.programs = [];
  localStorage.setItem('workout-tracker:data', JSON.stringify(source));
  const commit = vi.fn().mockResolvedValue(undefined);
  const prepare = vi.fn(async (data, selection): Promise<PreparedMerge> => ({ ...buildMergePlan(data, account, selection, 'op'), userId: 'alice', revision: 0, source: data }));
  render(<SelectiveMerge accountName="alice@example.com" data={account} pendingCount={0} onPrepare={prepare} onCommit={commit} />);
  await user.click(screen.getByRole('button', { name: 'Review local data for merge' }));
  expect(screen.getByText('0 selected')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Review selected data' })).toBeDisabled();
  await user.click(screen.getAllByRole('checkbox')[0]!); await user.click(screen.getByRole('button', { name: 'Review selected data' }));
  expect(prepare).toHaveBeenCalledOnce(); expect(commit).not.toHaveBeenCalled();
  await user.click(await screen.findByRole('button', { name: /merge 1 records into alice@example.com/i }));
  expect(commit).toHaveBeenCalledOnce(); expect(await screen.findByText('Merge acknowledged by the cloud')).toBeInTheDocument();
  expect(localStorage.getItem('workout-tracker:data')).toBe(JSON.stringify(source));
});

it('invalid backup and pending work cannot trigger an upload', async () => {
  const user = userEvent.setup(); const prepare = vi.fn(); const commit = vi.fn();
  render(<SelectiveMerge accountName="alice" data={createDefaultData()} pendingCount={1} onPrepare={prepare} onCommit={commit} />);
  const input = screen.getByLabelText('Choose merge backup');
  await user.upload(input, new File(['{"pending":[]}'], 'pending.json', { type: 'application/json' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/version/i); expect(prepare).not.toHaveBeenCalled(); expect(commit).not.toHaveBeenCalled();
});
