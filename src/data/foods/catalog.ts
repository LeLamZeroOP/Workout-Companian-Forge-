import type { FoodDefinition } from '../../domain/models';
import catalog from './commonFoods.json';

export const commonFoods = catalog as Array<FoodDefinition & { nutrientsPer100g: NonNullable<FoodDefinition['nutrientsPer100g']> }>;
