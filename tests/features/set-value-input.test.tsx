import { fireEvent, render, screen } from '@testing-library/react';
import { SetValueInput } from '../../src/features/workout/SetValueInput';

it('keeps typed text when focus moves before the saved value catches up', () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  render(<SetValueInput label="Weight in kilograms" field="weightKg" value={null} onChange={onChange} onBlur={onBlur} />);
  const input = screen.getByLabelText('Weight in kilograms');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: '70' } });
  fireEvent.blur(input);
  expect(input).toHaveValue('70');
  expect(onChange).toHaveBeenCalledWith('weightKg', '70');
  expect(onBlur).toHaveBeenCalledOnce();
});
