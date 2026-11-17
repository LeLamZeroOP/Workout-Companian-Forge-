import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { OverlayPresence } from '../../src/components/OverlayPresence';
import { DialogSurface } from '../../src/components/DialogSurface';

function Editor() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Edit</button><OverlayPresence>{open && <DialogSurface title="Editor" onClose={() => setOpen(false)}><label>Name<input defaultValue="Saved" /></label></DialogSurface>}</OverlayPresence></>;
}

function SwitchingEditor() {
  const [panel, setPanel] = useState<'options' | 'edit' | null>(null);
  return <><button data-edit-trigger onClick={() => setPanel('options')}>Options</button>
    <OverlayPresence>{panel === 'edit' && <DialogSurface title="Details" restoreFocusSelector="[data-edit-trigger]" onClose={() => setPanel(null)}><input aria-label="Details" /></DialogSurface>}</OverlayPresence>
    <OverlayPresence>{panel === 'options' && <DialogSurface title="Options" onClose={() => setPanel(null)}><button onClick={() => setPanel('edit')}>Edit details</button></DialogSurface>}</OverlayPresence>
  </>;
}

afterEach(() => { delete document.documentElement.dataset.input; document.body.style.overflow = ''; vi.useRealTimers(); vi.unstubAllGlobals(); });

it('releases focus and scrolling immediately, retaining only an inert visual exit', () => {
  vi.useFakeTimers(); document.documentElement.dataset.input = 'pointer';
  document.body.style.overflow = 'auto'; render(<Editor />);
  const trigger = screen.getByRole('button', { name: 'Edit' });
  trigger.focus();
  fireEvent.click(trigger); expect(document.body.style.overflow).toBe('hidden');
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.querySelector('.dialog-backdrop')).toHaveAttribute('inert');
  expect(trigger).toHaveFocus(); expect(document.body.style.overflow).toBe('auto');
  act(() => vi.advanceTimersByTime(150));
  expect(document.querySelector('.dialog-backdrop')).not.toBeInTheDocument();
  document.body.style.overflow = '';
});

it('can reopen during exit with a fresh editor and no delayed removal', () => {
  vi.useFakeTimers(); document.documentElement.dataset.input = 'pointer'; render(<Editor />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Unsaved' } });
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  act(() => vi.advanceTimersByTime(200));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('Saved');
  expect(screen.getByRole('textbox')).toHaveFocus();
  expect(document.querySelectorAll('.dialog-backdrop')).toHaveLength(1);
});

it('returns focus to the original trigger when a replacement editor closes during its predecessor’s exit', () => {
  vi.useFakeTimers(); document.documentElement.dataset.input = 'pointer'; render(<SwitchingEditor />);
  const trigger = screen.getByRole('button', { name: 'Options' }); trigger.focus(); fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
  expect(screen.getByRole('textbox', { name: 'Details' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(trigger).toHaveFocus(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(200)); expect(document.querySelector('.dialog-backdrop')).not.toBeInTheDocument();
});

it.each(['keyboard', 'reduced motion'])('dismisses immediately with %s', mode => {
  document.documentElement.dataset.input = mode === 'keyboard' ? 'keyboard' : 'pointer';
  if (mode === 'reduced motion') vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(<Editor />); screen.getByRole('button', { name: 'Edit' }).focus(); fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(document.querySelector('.dialog-backdrop')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
});
