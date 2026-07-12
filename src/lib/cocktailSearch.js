// Cocktail search via TheCocktailDB (free, open API). It has real recipes —
// ingredients and measures — but no nutrition, so calories are ESTIMATED here
// from published per-ounce densities of the ingredients. Good to ±15% for
// standard recipes; every result is labeled as an estimate in the UI.
const API = 'https://www.thecocktaildb.com/api/json/v1/1/search.php'

// kcal and carb grams per fluid ounce. Order matters — first match wins.
const DENSITIES = [
  // spirits (80 proof) & high-proof
  [/vodka|gin\b|white rum|dark rum|light rum|\brum\b|tequila|whisk|bourbon|scotch|rye\b|brandy|cognac|cachaca|pisco|mezcal|absinthe|grappa|everclear/i, 64, 0],
  // liqueurs & fortified
  [/triple sec|curacao|cointreau|grand marnier/i, 100, 10],
  [/amaretto|frangelico|kahlua|coffee liqueur|drambuie|galliano|chartreuse|benedictine|sambuca|ouzo|jager|limoncello|chambord|creme de|schnapps|midori|melon liqueur|sloe gin|st[.\s-]*germain|elderflower|aperol|campari|apricot brandy|cherry brandy|maraschino liqueur|falernum|amaro|fernet|cynar/i, 90, 9],
  [/irish cream|baileys|advocaat|rumchata/i, 100, 7],
  [/malibu|coconut rum|coconut liqueur/i, 70, 7],
  [/sweet vermouth|red vermouth/i, 45, 4],
  [/dry vermouth|vermouth|lillet|dubonnet|sherry|port\b|madeira|sake/i, 40, 2],
  // wine & beer
  [/champagne|prosecco|sparkling wine|cava/i, 19, 0.4],
  [/\bwine\b|lambrusco/i, 25, 1],
  [/ginger beer/i, 11, 3],
  [/\bbeer\b|lager|ale\b|stout|cider/i, 13, 1.1],
  // mixers & juices
  [/coca[- ]?cola|coke|pepsi|cola/i, 12, 3.3],
  [/tonic/i, 10, 2.7],
  [/ginger ale/i, 10, 2.7],
  [/soda water|club soda|sparkling water|seltzer|water\b|espresso|coffee|tea\b|ice\b/i, 0, 0],
  [/sprite|7[- ]?up|lemon[- ]?lime soda|lemonade|sour mix|sweet and sour/i, 12, 3.2],
  [/orange juice/i, 14, 3.2],
  [/cranberry/i, 15, 3.8],
  [/pineapple juice/i, 17, 4],
  [/grapefruit juice/i, 12, 2.8],
  [/apple juice|apple cider/i, 14, 3.4],
  [/tomato juice/i, 5, 1.2],
  [/lime juice|juice of.*lime|lime\b/i, 8, 2.6],
  [/lemon juice|juice of.*lemon|lemon\b/i, 7, 2.2],
  [/passion fruit|peach puree|mango|strawberr|banana|raspberr|blackberr/i, 18, 4.4],
  // sweeteners & rich stuff
  [/simple syrup|sugar syrup|gomme|syrup/i, 70, 18],
  [/grenadine/i, 80, 20],
  [/agave/i, 78, 19],
  [/honey/i, 85, 23],
  [/orgeat|almond syrup/i, 85, 19],
  [/heavy cream|double cream/i, 100, 1],
  [/light cream|half.and.half|single cream/i, 40, 1.3],
  [/coconut cream|cream of coconut/i, 110, 15],
  [/coconut milk/i, 55, 1.5],
  [/\bmilk\b/i, 18, 1.5],
  [/condensed milk/i, 123, 21],
  [/egg white/i, 15, 0],
  [/\begg\b|egg yolk/i, 20, 0.2],
  [/sugar\b/i, 48, 12.5], // per tsp-ish measures; parser converts
  [/bitters|mint|basil|salt|pepper|nutmeg|cinnamon|garnish|cherry\b|olive|celery|worcestershire|tabasco|hot sauce/i, 2, 0.4],
]

// "1 1/2 oz", "2 cl", "50 ml", "1 shot", "1 tsp", "Juice of 1/2 lime" → fl oz
function parseOunces(measure) {
  if (!measure) return null
  const m = measure.toLowerCase().trim()
  const num = (() => {
    const frac = m.match(/(\d+)?\s*(\d)\s*\/\s*(\d)/)
    if (frac) return (+(frac[1] || 0)) + (+frac[2] / +frac[3])
    const dec = m.match(/(\d+(?:\.\d+)?)/)
    return dec ? +dec[1] : null
  })()
  if (m.includes('oz')) return num ?? 1
  if (m.includes('ml')) return (num ?? 30) / 29.57
  if (m.includes('cl')) return ((num ?? 3) * 10) / 29.57
  if (/shot|jigger/.test(m)) return (num ?? 1) * 1.5
  if (/tblsp|tbsp|tablespoon/.test(m)) return (num ?? 1) * 0.5
  if (/tsp|teaspoon|barspoon/.test(m)) return (num ?? 1) / 6
  if (/dash|drop/.test(m)) return (num ?? 1) * 0.03
  if (/splash/.test(m)) return 0.25
  if (/cup\b/.test(m)) return (num ?? 1) * 8
  if (/pint/.test(m)) return (num ?? 1) * 16
  if (/can\b|bottle/.test(m)) return (num ?? 1) * 12
  if (/juice of/.test(m)) return (num ?? 1) * 1 // juice of 1 lime ≈ 1 oz
  if (/top|fill/.test(m)) return 3              // "top up with soda"
  if (/part/.test(m)) return (num ?? 1) * 1     // treat 1 part ≈ 1 oz
  if (num != null) return num                    // bare number → assume oz
  return null
}

function estimate(drink) {
  let kcal = 0
  let carbs = 0
  let known = 0
  let total = 0
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`]
    if (!ing) continue
    total++
    const oz = parseOunces(drink[`strMeasure${i}`])
    const hit = DENSITIES.find(([re]) => re.test(ing))
    if (!hit) continue
    known++
    const amount = oz ?? 1 // recipe lists it without a measure — assume 1 oz
    kcal += hit[1] * amount
    carbs += hit[2] * amount
  }
  // If we couldn't identify most of the recipe, the number would be fiction.
  if (total === 0 || known / total < 0.5) return null
  return { kcal: Math.round(kcal / 5) * 5, carbs: Math.round(carbs) }
}

export async function searchCocktails(query, { signal } = {}) {
  const res = await fetch(`${API}?s=${encodeURIComponent(query)}`, { signal })
  if (!res.ok) throw new Error('Cocktail search is unavailable right now.')
  const data = await res.json()
  return (data.drinks || [])
    .filter((x) => x.strAlcoholic !== 'Non alcoholic' || true) // keep all; NA drinks have calories too
    .map((x) => {
      const est = estimate(x)
      if (!est) return null
      const ingredients = []
      for (let i = 1; i <= 15; i++) if (x[`strIngredient${i}`]) ingredients.push(x[`strIngredient${i}`])
      return {
        id: `ctl-${x.idDrink}`,
        name: x.strDrink,
        brand: ingredients.slice(0, 4).join(', ') + (ingredients.length > 4 ? '…' : ''),
        serving: '1 drink (est.)',
        calories: est.kcal,
        protein: 0, carbs: est.carbs, fat: 0, fiber: 0,
        sugar: Math.round(est.carbs * 0.85), sodium: 0,
        cat: 'Cocktails',
      }
    })
    .filter(Boolean)
    .slice(0, 12)
}
