import type { FoodDefinition } from '../../domain/models';
import catalog from './commonFoods.json';

export const commonFoods = catalog as FoodDefinition[];
