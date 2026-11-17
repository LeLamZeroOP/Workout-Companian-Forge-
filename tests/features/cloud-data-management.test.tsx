import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { CloudDataManagement } from '../../src/features/settings/CloudDataManagement';

describe('CloudDataManagement', () => {
  it('requires explicit confirmation before importing a legacy browser copy', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    localStorage.setItem('workout-tracker:data', JSON.stringify(createDefaultData()));
    render(<CloudDataManagement data={createDefaultData()} pendingCount={0} onSignOut={() => {}} onImport={onImport} onGetDeviceBackup={async () => ({ userId: 'alice', snapshot: { userId: 'alice', revision: 0, data: createDefaultData(), recentMutationIds: [] }, pending: [] })} />);
    fireEvent.click(screen.getByRole('button', { name: /review local data/i }));
    expect(onImport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /replace cloud data/i }));
    expect(within(screen.getByRole('alertdialog')).getByText(/not merged/i)).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });

  it('keeps account replacement single-flight and prevents closing its pending review', async () => {
    const user = userEvent.setup();
    let complete!: () => void;
    const onImport = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    localStorage.setItem('workout-tracker:data', JSON.stringify(createDefaultData()));
    render(<CloudDataManagement data={createDefaultData()} pendingCount={0} onSignOut={vi.fn()} onImport={onImport} onGetDeviceBackup={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Review local data' }));
    await user.click(screen.getByRole('button', { name: 'Replace cloud data' }));
    const dialog = screen.getByRole('alertdialog');
    await user.dblClick(within(dialog).getByRole('button', { name: 'Replace cloud data' }));
    expect(onImport).toHaveBeenCalledOnce();
    expect(within(dialog).getByRole('button', { name: 'Replace cloud data' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled();
    await user.keyboard('{Escape}{Tab}');
    expect(screen.getByRole('alertdialog')).toHaveFocus();
    await act(async () => complete());
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled();
  });

  it('clears a previous preview when a replacement file is invalid', async () => {
    const user = userEvent.setup();
    localStorage.setItem('workout-tracker:data', JSON.stringify(createDefaultData()));
    render(<CloudDataManagement data={createDefaultData()} pendingCount={0} onSignOut={vi.fn()} onImport={vi.fn()} onGetDeviceBackup={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Review local data' }));
    expect(screen.getByRole('button', { name: 'Replace cloud data' })).toBeInTheDocument();
    await user.upload(screen.getByLabelText('Choose JSON backup'), new File(['bad'], 'bad.json', { type: 'application/json' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replace cloud data' })).not.toBeInTheDocument();
  });
});
