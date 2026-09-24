import { readFile, writeFile, mkdir } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('./usda-food-manifest.json', import.meta.url), 'utf8'));
const nutrientIds = { caloriesKcal: 1008, proteinG: 1003, carbsG: 1005, fatG: 1004, fiberG: 1079, sodiumMg: 1093 };
const round = (value) => Math.round(value * 10) / 10;

function nutrientValue(food, id) {
  const nutrient = food.foodNutrients?.find((item) => item.nutrientId === id);
  return nutrient?.value == null ? null : round(Number(nutrient.value));
}

function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value); value = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const [headers, ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function findBulkSource(item, bulkFoods, nutrientsByFood) {
  const tokens = item.query.toLowerCase().split(/\s+/).filter((token) => token.length > 2);
  const ranked = bulkFoods.map((food) => {
    const description = food.description.toLowerCase();
    return { food, score: tokens.reduce((total, token) => total + (description.includes(token) ? 1 : 0), 0) };
  }).sort((a, b) => b.score - a.score || a.food.description.length - b.food.description.length);
  const match = ranked[0]?.food;
  if (!match) throw new Error(`No USDA bulk match found for ${item.id}.`);
  return { fdcId: match.fdc_id, foodNutrients: nutrientsByFood.get(match.fdc_id) ?? [] };
}

const bulkFlag = process.argv.indexOf('--bulk-dir');
let bulkFoods = null;
let nutrientsByFood = null;
if (bulkFlag >= 0) {
  const directory = process.argv[bulkFlag + 1];
  if (!directory) throw new Error('--bulk-dir requires the extracted USDA CSV directory.');
  bulkFoods = parseCsv(await readFile(`${directory}/food.csv`, 'utf8'));
  nutrientsByFood = new Map();
  for (const nutrient of parseCsv(await readFile(`${directory}/food_nutrient.csv`, 'utf8'))) {
    if (!Object.values(nutrientIds).includes(Number(nutrient.nutrient_id))) continue;
    const list = nutrientsByFood.get(nutrient.fdc_id) ?? [];
    list.push({ nutrientId: Number(nutrient.nutrient_id), value: Number(nutrient.amount) });
    nutrientsByFood.set(nutrient.fdc_id, list);
  }
} else if (!process.env.USDA_FDC_API_KEY) {
  throw new Error('USDA_FDC_API_KEY is required, or pass --bulk-dir with an extracted USDA CSV download.');
}

const foods = [];
for (const item of manifest) {
  let source;
  if (bulkFoods && nutrientsByFood) source = findBulkSource(item, bulkFoods, nutrientsByFood);
  else {
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(process.env.USDA_FDC_API_KEY)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: item.query, pageSize: 10, dataType: ['Foundation', 'SR Legacy'] }),
    });
    if (!response.ok) throw new Error(`USDA request failed for ${item.id}: ${response.status} ${response.statusText}`);
    const payload = await response.json();
    source = payload.foods?.[0];
  }
  if (!source) throw new Error(`No USDA match found for ${item.id} (${item.query}).`);
  foods.push({
    id: item.id,
    name: item.name,
    brand: null,
    category: item.category,
    preparation: item.preparation,
    source: 'usda',
    sourceId: String(source.fdcId),
    dataVersion: bulkFoods ? 'USDA SR Legacy 2018-04' : `FDC imported ${new Date().toISOString().slice(0, 10)}`,
    nutrientsPer100g: {
      caloriesKcal: nutrientValue(source, nutrientIds.caloriesKcal) ?? 0,
      proteinG: nutrientValue(source, nutrientIds.proteinG) ?? 0,
      carbsG: nutrientValue(source, nutrientIds.carbsG) ?? 0,
      fatG: nutrientValue(source, nutrientIds.fatG) ?? 0,
      fiberG: nutrientValue(source, nutrientIds.fiberG),
      sodiumMg: nutrientValue(source, nutrientIds.sodiumMg),
    },
    servings: item.servings,
  });
  process.stdout.write(`Imported ${item.name}\n`);
}

const outputUrl = new URL('../src/data/foods/commonFoods.json', import.meta.url);
await mkdir(new URL('../src/data/foods/', import.meta.url), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify(foods, null, 2)}\n`, 'utf8');
process.stdout.write(`Wrote ${foods.length} foods to ${outputUrl.pathname}\n`);
