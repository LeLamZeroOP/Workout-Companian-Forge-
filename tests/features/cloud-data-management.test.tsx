import { fireEvent, render, screen, within } from '@testing-library/react';
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
});
