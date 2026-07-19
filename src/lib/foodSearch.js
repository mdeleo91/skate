// Online ingredient lookup via Open Food Facts — a free, open, CORS-enabled
// food database (openfoodfacts.org). No API key required; the request runs in
// the user's browser, same pattern as the open-meteo weather integration.
const OFF_API = 'https://world.openfoodfacts.org/cgi/search.pl'

export async function searchOpenFoodFacts(query, { signal } = {}) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    fields: 'code,product_name,brands,nutriments',
  })
  const res = await fetch(`${OFF_API}?${params}`, { signal })
  if (!res.ok) throw new Error('Food search is unavailable right now.')
  const data = await res.json()
  const seen = new Set()
  return (data.products || [])
    .map(mapProduct)
    .filter((f) => {
      if (!f) return false
      const key = `${f.name.toLowerCase()}|${f.brand.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

// Look up a single product by barcode (EAN/UPC). Returns null when the code
// isn't in the database — that's a normal outcome, not an error.
export async function lookupBarcode(code, { signal } = {}) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,brands,nutriments`
  const res = await fetch(url, { signal })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Barcode lookup is unavailable right now.')
  const data = await res.json()
  if (!data.product) return null
  return mapProduct(data.product)
}

// ---- USDA FoodData Central: whole DISHES, not ingredients -----------------
// The FNDDS "Survey Foods" dataset is meals as actually eaten — "Spaghetti
// with meat sauce", "Chicken parmigiana" — with nutrition per 100 g and real
// household portions ("1 cup"). Free API; DEMO_KEY works with modest limits,
// a personal key (fdc.nal.usda.gov/api-key-signup) raises them.
const USDA_API = 'https://api.nal.usda.gov/fdc/v1'
const USDA_KEY = import.meta.env.VITE_USDA_KEY || 'DEMO_KEY'

const USDA_NUTRIENTS = {
  208: 'calories', 203: 'protein', 205: 'carbs', 204: 'fat',
  291: 'fiber', 269: 'sugar', 307: 'sodium',
}

export async function searchUsdaDishes(query, { signal } = {}) {
  const params = new URLSearchParams({
    api_key: USDA_KEY,
    query,
    dataType: 'Survey (FNDDS)',
    pageSize: '10',
  })
  const res = await fetch(`${USDA_API}/foods/search?${params}`, { signal })
  if (!res.ok) throw new Error('Dish search is unavailable right now.')
  const data = await res.json()
  return (data.foods || []).map((f) => {
    const out = {
      id: `usda-${f.fdcId}`,
      fdcId: f.fdcId,
      name: titleCase(f.description),
      brand: 'USDA dish',
      serving: '100 g',
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0,
      cat: 'Dish',
    }
    for (const n of f.foodNutrients || []) {
      const key = USDA_NUTRIENTS[+n.nutrientNumber]
      if (key) out[key] = Math.round(n.value || 0)
    }
    return out
  }).filter((f) => f.calories > 0)
}

// Household portions for one dish ("1 cup" → 250 g). One extra request, made
// only when the user actually taps a dish.
export async function fetchUsdaPortions(fdcId, { signal } = {}) {
  const res = await fetch(`${USDA_API}/food/${fdcId}?api_key=${USDA_KEY}`, { signal })
  if (!res.ok) throw new Error('portions unavailable')
  const data = await res.json()
  const portions = (data.foodPortions || [])
    .filter((p) => p.gramWeight > 0)
    .slice(0, 6)
    .map((p) => ({
      label: (p.portionDescription || p.modifier || `${p.amount ?? 1} portion`).trim(),
      grams: p.gramWeight,
    }))
  portions.push({ label: '100 g', grams: 100 })
  return portions
}

function titleCase(s) {
  const lower = s.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// Normalize an Open Food Facts product into the app's food shape.
// All values are per 100 g, so the servings multiplier stays meaningful.
function mapProduct(p) {
  const n = p.nutriments || {}
  let kcal = n['energy-kcal_100g']
  if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184 // kJ → kcal
  if (!p.product_name || kcal == null || kcal < 0 || kcal > 900) return null
  return {
    id: `off-${p.code}`,
    name: p.product_name,
    brand: p.brands ? p.brands.split(',')[0].trim() : 'Open Food Facts',
    serving: '100 g',
    calories: Math.round(kcal),
    protein: Math.round(n.proteins_100g || 0),
    carbs: Math.round(n.carbohydrates_100g || 0),
    fat: Math.round(n.fat_100g || 0),
    fiber: Math.round(n.fiber_100g || 0),
    sugar: Math.round(n.sugars_100g || 0),
    sodium: Math.round((n.sodium_100g || 0) * 1000), // g → mg
    cat: 'Online',
  }
}
