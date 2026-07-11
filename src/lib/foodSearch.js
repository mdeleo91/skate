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
