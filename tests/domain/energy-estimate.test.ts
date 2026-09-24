import { activityFactors, calculateMacroGrams, estimateNutritionTarget } from '../../src/domain/energyEstimate';

const valid = { age: 30, weightKg: 80, heightCm: 180, equationSex: 'male' as const, activityLevel: 'moderate' as const, goal: 'maintain' as const, eligibleAdult: true };

describe('energy and macro estimates', () => {
  it('returns manual-only for minors, ineligible people, and invalid inputs', () => {
    expect(estimateNutritionTarget({ ...valid, age: 17 })).toEqual({ status: 'manual-only', reason: 'adult-only' });
    expect(estimateNutritionTarget({ ...valid, eligibleAdult: false })).toEqual({ status: 'manual-only', reason: 'ineligible' });
    expect(estimateNutritionTarget({ ...valid, weightKg: 0 })).toEqual({ status: 'manual-only', reason: 'invalid-input' });
  });

  it('calculates Mifflin-St Jeor maintenance and a rounded estimate range', () => {
    const result = estimateNutritionTarget(valid);
    expect(activityFactors.moderate).toBe(1.55);
    expect(result).toEqual({
      status: 'estimated', reeKcal: 1780, maintenanceKcal: 2759, targetLowKcal: 2500, targetHighKcal: 3050, midpointKcal: 2750, formulaVersion: 'mifflin-st-jeor-1990-v1',
    });
  });

  it('applies conservative loss and gain goal factors', () => {
    const loss = estimateNutritionTarget({ ...valid, goal: 'lose' });
    const gain = estimateNutritionTarget({ ...valid, goal: 'gain' });
    expect(loss.status === 'estimated' && loss.midpointKcal).toBe(2500);
    expect(gain.status === 'estimated' && gain.midpointKcal).toBe(3050);
  });

  it('converts balanced percentages to macro grams and rejects invalid splits', () => {
    expect(calculateMacroGrams(2400, { protein: 25, carbs: 45, fat: 30 })).toEqual({ proteinG: 150, carbsG: 270, fatG: 80 });
    expect(() => calculateMacroGrams(2400, { protein: 40, carbs: 30, fat: 30 })).toThrow(/ranges/i);
  });
});
