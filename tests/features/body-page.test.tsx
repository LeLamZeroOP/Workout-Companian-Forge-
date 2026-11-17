import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BodyPage } from '../../src/features/body/BodyPage';
import type { BodyMeasurement, BodyProfile } from '../../src/domain/models';

const measurement: BodyMeasurement = { id: 'measure-1', recordedAt: '2026-09-24T08:00:00.000Z', weightKg: 80, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
const profile: BodyProfile = { birthDate: '1996-01-01', heightCm: 180, equationSex: 'male', activityLevel: 'moderate', goal: 'maintain', targetMode: 'calculated', estimateEligibilityConfirmed: true };

function BodyHarness({ initialProfile = null, initialMeasurements = [] }: { initialProfile?: BodyProfile | null; initialMeasurements?: BodyMeasurement[] }) {
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [measurements, setMeasurements] = useState(initialMeasurements);
  return <BodyPage profile={savedProfile} measurements={measurements} onSaveProfile={setSavedProfile} onSaveMeasurement={(entry) => setMeasurements((current) => current.some((item) => item.id === entry.id) ? current.map((item) => item.id === entry.id ? entry : item) : [...current, entry])} onDeleteMeasurement={(id) => setMeasurements((current) => current.filter((item) => item.id !== id))} now={new Date('2026-09-24T12:00:00.000Z')} />;
}

describe('Body page', () => {
  it('logs 80, 50, then 100 on the same date and shows the latest save', async () => {
    render(<BodyHarness />);
    for (const weight of ['80', '50', '100']) {
      await userEvent.click(screen.getByRole('button', { name: weight === '80' ? /log weight/i : /^log measurement$/i }));
      await userEvent.type(screen.getByLabelText(/weight in kilograms/i), weight);
      await userEvent.click(screen.getByRole('button', { name: /save measurement/i }));
    }
    expect(screen.getByRole('heading', { name: '100 kg' })).toBeInTheDocument();
    expect(screen.getByText('+50.0 kg from previous entry')).toBeInTheDocument();
  });
  it('guides first use and saves a quick weight entry', async () => {
    render(<BodyHarness />);
    expect(screen.getByText(/start with today's weight/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /log weight/i }));
    await userEvent.type(screen.getByLabelText(/weight in kilograms/i), '80');
    await userEvent.click(screen.getByRole('button', { name: /save measurement/i }));
    expect(screen.getAllByText('80 kg').length).toBeGreaterThan(0);
    expect(screen.getByRole('table', { name: /weight trend data/i })).toBeInTheDocument();
  });

  it('validates and saves a body profile before showing an estimate', async () => {
    render(<BodyHarness initialMeasurements={[measurement]} />);
    await userEvent.click(screen.getByRole('button', { name: /set up profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /save profile/i }));
    expect(screen.getByText(/enter your birth date/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/birth date/i), '1996-01-01');
    await userEvent.type(screen.getByLabelText(/height in centimeters/i), '180');
    await userEvent.click(screen.getByRole('button', { name: /equation sex/i }));
    await userEvent.click(screen.getByRole('option', { name: 'Male equation' }));
    await userEvent.click(screen.getByRole('button', { name: /activity level/i }));
    await userEvent.click(screen.getByRole('option', { name: 'Moderately active' }));
    await userEvent.click(screen.getByLabelText(/eligible adult/i));
    await userEvent.click(screen.getByRole('button', { name: /save profile/i }));
    expect(screen.getByText(/estimated daily target/i)).toBeInTheDocument();
    expect(screen.getByText(/2,500.*3,050 kcal/i)).toBeInTheDocument();
  });

  it('edits and deletes an existing measurement with confirmation', async () => {
    render(<BodyHarness initialProfile={profile} initialMeasurements={[measurement]} />);
    await userEvent.click(screen.getByRole('button', { name: /edit measurement/i }));
    const weight = screen.getByLabelText(/weight in kilograms/i);
    await userEvent.clear(weight);
    await userEvent.type(weight, '79.5');
    await userEvent.click(screen.getByRole('button', { name: /save measurement/i }));
    expect(screen.getAllByText('79.5 kg').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: /delete measurement/i }));
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText(/start with today's weight/i)).toBeInTheDocument();
  });
});

it('requires renewed eligibility for legacy profiles instead of assuming consent', () => {
  render(<BodyHarness initialProfile={{ ...profile, estimateEligibilityConfirmed: undefined }} initialMeasurements={[measurement]} />);
  expect(screen.getByText(/confirm eligibility to see an optional estimate/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Use this target' })).not.toBeInTheDocument();
});
