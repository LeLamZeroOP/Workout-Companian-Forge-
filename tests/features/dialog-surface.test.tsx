import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogSurface } from '../../src/components/DialogSurface';
import { SelectControl } from '../../src/components/SelectControl';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

function Editor() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Edit</button>{open && <DialogSurface title="Editor" onClose={() => setOpen(false)}><label>Name<input defaultValue="Saved" /></label><SelectControl label="Choice" value="a" onChange={vi.fn()} options={[{ value: 'a', label: 'Alpha' }]} /><button>Save</button></DialogSurface>}</>;
}

it('locks background scrolling, traps focus and restores the trigger on dismissal', async () => {
  const user = userEvent.setup(); document.body.style.overflow = 'auto';
  render(<Editor />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  expect(document.body.style.overflow).toBe('hidden');
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  screen.getByRole('button', { name: 'Save' }).focus();
  await user.tab(); expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  await user.tab({ shift: true }); expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
  expect(document.body.style.overflow).toBe('auto'); document.body.style.overflow = '';
});

it('dismisses the nested selection before its editor', async () => {
  const user = userEvent.setup(); render(<Editor />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByRole('button', { name: 'Choice' }));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: 'Editor' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Choice' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('blocks dismissal and traps focus while a confirmation is busy', async () => {
  const user = userEvent.setup(); const cancel = vi.fn();
  render(<ConfirmDialog title="Replace data" message="Review this operation." confirmLabel="Replace" onConfirm={vi.fn()} onCancel={cancel} busy />);
  expect(screen.getByRole('alertdialog')).toHaveFocus();
  await user.keyboard('{Escape}{Tab}');
  expect(cancel).not.toHaveBeenCalled();
  expect(screen.getByRole('alertdialog')).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Close confirmation' })).toBeDisabled();
});
