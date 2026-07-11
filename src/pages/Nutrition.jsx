import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Bar, Modal, Ring } from '../components/ui'
import Icon from '../components/icons'
import { FOODS, RESTAURANTS, MEAL_SLOTS } from '../lib/foods'
import { todayISO } from '../lib/calc'

const TABS = ['Today', 'Search', 'Restaurants', 'Recipes', 'Saved', 'History']

export default function Nutrition() {
  const data = useData()
  const [tab, setTab] = useState('Today')
  const [scanner, setScanner] = useState(false)
  if (!data) return null

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="h-title">Fuel</h1>
          <p className="text-sm text-slate-500 mt-1">Eat like someone training for a long skate, not someone on a diet.</p>
        </div>
        <button onClick={() => setScanner(true)} className="btn-ghost !px-3 shrink-0"><Icon name="barcode_scanner" size={17} /> Scan</button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`chip whitespace-nowrap !px-3 !py-1.5 ${tab === t ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Today' && <TodayTab />}
      {tab === 'Search' && <SearchTab />}
      {tab === 'Restaurants' && <RestaurantTab />}
      {tab === 'Recipes' && <RecipeTab />}
      {tab === 'Saved' && <SavedTab />}
      {tab === 'History' && <HistoryTab />}

      <Modal open={scanner} onClose={() => setScanner(false)} title={<><Icon name="barcode_scanner" size={19} className="mr-1.5 text-volt-400" />Barcode Scanner</>}>
        <div className="space-y-4">
          <div className="relative grid place-items-center h-48 rounded-xl bg-ink-900 border border-white/10 overflow-hidden">
            <div className="absolute inset-x-8 h-0.5 bg-ember-500 shadow-[0_0_12px_2px_rgba(242,87,27,0.6)] live-dot" />
            <div className="absolute inset-6 border-2 border-white/20 rounded-lg" />
            <span className="opacity-30"><Icon name="barcode_scanner" size={40} /></span>
          </div>
          <p className="text-sm text-slate-400">
            Camera scanning is stubbed in this build — it needs a barcode-decoding library and a
            hosted product database (Open Food Facts or similar). The UI and the flow are here; the
            lookup is not wired up yet.
          </p>
          <button onClick={() => setScanner(false)} className="btn-ghost w-full">Close</button>
        </div>
      </Modal>
    </div>
  )
}

function TodayTab() {
  const { d, meals, deleteMeal, addWater, profile } = useData()
  const today = todayISO()
  const todays = meals.filter((m) => m.date === today)
  const M = d.macrosToday
  const T = d.macros

  return (
    <div className="space-y-4">
      {!d.hasMeals && (
        <Card className="border-volt-500/30 bg-volt-500/[0.04] text-center py-7">
          <div className="mb-2.5 text-volt-400"><Icon name="nutrition" size={40} /></div>
          <div className="font-display font-bold text-white text-lg">Log your first meal</div>
          <div className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Search a food, pick a restaurant dish, or build a recipe. Skate does the macro math and
            adds back the calories you burn skating — because you earned those.
          </div>
          <div className="text-xs text-slate-500 mt-3">
            Your daily target is {d.budget.target.toLocaleString()} cal, based on your Profile.
          </div>
        </Card>
      )}

      <Card className="flex flex-col sm:flex-row items-center gap-5">
        <Ring value={d.consumed} goal={d.budget.target} label={d.consumed.toLocaleString()} sub={`of ${d.budget.target.toLocaleString()} cal`} />
        <div className="flex-1 w-full grid grid-cols-3 gap-3">
          <MacroBar label="Protein" v={M.protein} g={T.protein} color="bg-volt-500" />
          <MacroBar label="Carbs" v={M.carbs} g={T.carbs} color="bg-surge-500" />
          <MacroBar label="Fat" v={M.fat} g={T.fat} color="bg-ember-500" />
          <MacroBar label="Fiber" v={M.fiber} g={T.fiber} color="bg-volt-600" />
          <MacroBar label="Sugar" v={M.sugar} g={T.sugar} color="bg-ember-400" invert />
          <MacroBar label="Sodium" v={M.sodium} g={T.sodium} color="bg-slate-500" invert unit="mg" />
        </div>
      </Card>

      <Card>
        <SectionTitle><Icon name="water_drop" size={15} className="mr-1.5 text-surge-400" />Water Intake</SectionTitle>
        <div className="flex items-center gap-4">
          <div className="font-display text-3xl font-bold text-surge-400 tabular-nums">{d.waterToday}<span className="text-base text-slate-500 ml-1">oz</span></div>
          <div className="flex-1">
            <Bar value={d.waterToday} goal={profile.waterGoalOz} color="bg-surge-500" />
            <div className="text-xs text-slate-500 mt-1">Goal {profile.waterGoalOz} oz</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[8, 12, 16, 24].map((oz) => (
            <button key={oz} onClick={() => addWater(oz)} className="btn-ghost !py-1.5 text-xs">+{oz}oz</button>
          ))}
        </div>
      </Card>

      {MEAL_SLOTS.map((slot) => {
        const items = todays.filter((m) => m.slot === slot)
        const cal = items.reduce((a, m) => a + m.calories, 0)
        return (
          <Card key={slot}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-white">{slot}</h3>
              <span className="text-sm tabular-nums text-slate-400">{cal} cal</span>
            </div>
            {items.length === 0 ? (
              <div className="text-sm text-slate-500">Nothing logged yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-100 truncate">{m.name}</div>
                      <div className="text-xs text-slate-500">
                        {m.serving} · P{Math.round(m.protein)} C{Math.round(m.carbs)} F{Math.round(m.fat)}
                      </div>
                    </div>
                    <span className="text-sm tabular-nums text-slate-300">{m.calories}</span>
                    <button onClick={() => deleteMeal(m.id)} className="text-slate-600 hover:text-ember-400 text-lg leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function MacroBar({ label, v, g, color, invert, unit = 'g' }) {
  const over = invert && v > g
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`tabular-nums ${over ? 'text-ember-400' : 'text-slate-300'}`}>{v}/{g}{unit}</span>
      </div>
      <Bar value={v} goal={g} color={over ? 'bg-ember-500' : color} />
    </div>
  )
}

function AddFoodModal({ food, onClose }) {
  const { addMeal, favorites, toggleFavorite } = useData()
  const [slot, setSlot] = useState('Breakfast')
  const [qty, setQty] = useState(1)
  if (!food) return null
  const scale = (n) => Math.round((n || 0) * qty)
  return (
    <Modal open onClose={onClose} title={food.name}>
      <div className="space-y-3">
        <div className="text-sm text-slate-400">{food.brand ? `${food.brand} · ` : ''}{food.serving}</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Meal</label>
            <select className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>
              {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Servings</label>
            <input type="number" step="0.5" min="0.5" className="input" value={qty} onChange={(e) => setQty(+e.target.value || 1)} />
          </div>
        </div>
        <div className="card-tight grid grid-cols-4 gap-2 text-center">
          {[['Cal', scale(food.calories)], ['P', scale(food.protein)], ['C', scale(food.carbs)], ['F', scale(food.fat)]].map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] uppercase text-slate-500">{k}</div>
              <div className="font-display font-bold tabular-nums text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !px-3" onClick={() => toggleFavorite(food.id)}>
            <Icon name={favorites.includes(food.id) ? 'star_filled' : 'star'} size={18} className={favorites.includes(food.id) ? 'text-volt-400' : ''} />
          </button>
          <button
            className="btn-primary flex-1"
            onClick={() => {
              addMeal({
                slot, name: food.name, serving: `${qty} × ${food.serving}`,
                calories: scale(food.calories), protein: scale(food.protein), carbs: scale(food.carbs),
                fat: scale(food.fat), fiber: scale(food.fiber), sugar: scale(food.sugar), sodium: scale(food.sodium),
              })
              onClose()
            }}
          >
            Add to {slot}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function SearchTab() {
  const { favorites } = useData()
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(null)
  const results = useMemo(
    () => FOODS.filter((f) => (f.name + f.brand + f.cat).toLowerCase().includes(q.toLowerCase())),
    [q]
  )
  const favs = FOODS.filter((f) => favorites.includes(f.id))

  return (
    <div className="space-y-4">
      <input className="input" placeholder="Search foods…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!q && favs.length > 0 && (
        <Card>
          <SectionTitle><Icon name="star_filled" size={15} className="mr-1.5 text-volt-400" />Favorite Foods</SectionTitle>
          <FoodList foods={favs} onPick={setPick} />
        </Card>
      )}
      <Card>
        <SectionTitle>{q ? `${results.length} results` : 'Food Database'}</SectionTitle>
        <FoodList foods={results} onPick={setPick} />
      </Card>
      <AddFoodModal food={pick} onClose={() => setPick(null)} />
    </div>
  )
}

function FoodList({ foods, onPick }) {
  if (!foods.length) return <div className="text-sm text-slate-500">No matches.</div>
  return (
    <div className="divide-y divide-white/5">
      {foods.map((f) => (
        <button key={f.id} onClick={() => onPick(f)} className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-white/[0.03] rounded-lg px-1 -mx-1">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-100 truncate">{f.name}</div>
            <div className="text-xs text-slate-500">{f.brand} · {f.serving}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-semibold tabular-nums text-slate-200">{f.calories}</div>
            <div className="text-[10px] text-slate-500">P{f.protein} C{f.carbs} F{f.fat}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

function RestaurantTab() {
  const [pick, setPick] = useState(null)
  return (
    <div className="space-y-3">
      {RESTAURANTS.map((r) => (
        <Card key={r.id}>
          <SectionTitle><Icon name={r.icon} size={15} className="mr-1.5" />{r.name}</SectionTitle>
          <FoodList foods={r.items.map((i) => ({ ...i, brand: r.name }))} onPick={setPick} />
        </Card>
      ))}
      <AddFoodModal food={pick} onClose={() => setPick(null)} />
    </div>
  )
}

function RecipeTab() {
  const { saveMeal, addMeal } = useData()
  const [name, setName] = useState('')
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const results = FOODS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
  const total = items.reduce((a, i) => ({
    calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs,
    fat: a.fat + i.fat, fiber: a.fiber + i.fiber, sugar: a.sugar + i.sugar, sodium: a.sodium + i.sodium,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 })

  return (
    <Card>
      <SectionTitle><Icon name="menu_book" size={15} className="mr-1.5" />Recipe Builder</SectionTitle>
      <div className="space-y-3">
        <input className="input" placeholder="Recipe name (e.g. Post-skate bowl)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Add an ingredient…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && (
          <div className="card-tight divide-y divide-white/5">
            {results.map((f) => (
              <button key={f.id} onClick={() => { setItems((it) => [...it, f]); setQ('') }} className="w-full flex justify-between py-2 text-sm text-left">
                <span className="text-slate-200">{f.name}</span>
                <span className="text-slate-400 tabular-nums">{f.calories}</span>
              </button>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className="card-tight">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between items-center py-1.5 text-sm">
                <span className="text-slate-200">{i.name}</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-slate-400">{i.calories}</span>
                  <button onClick={() => setItems((it) => it.filter((_, j) => j !== idx))} className="text-slate-600 hover:text-ember-400">×</button>
                </div>
              </div>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-semibold">
              <span className="text-slate-300">Total</span>
              <span className="tabular-nums text-volt-400">{Math.round(total.calories)} cal</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!name || !items.length}
            onClick={() => { saveMeal(name, items); setName(''); setItems([]) }}
            className="btn-ghost"
          >
            Save recipe
          </button>
          <button
            disabled={!items.length}
            onClick={() => {
              addMeal({ slot: 'Dinner', name: name || 'Recipe', serving: `${items.length} ingredients`, ...roundAll(total) })
              setName(''); setItems([])
            }}
            className="btn-primary"
          >
            Log it now
          </button>
        </div>
      </div>
    </Card>
  )
}

const roundAll = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]))

function SavedTab() {
  const { savedMeals, addMeal } = useData()
  if (!savedMeals.length) {
    return <Card><div className="text-sm text-slate-400">No saved meals yet. Build one in the Recipes tab — a meal you eat every week shouldn't cost you five taps every time.</div></Card>
  }
  return (
    <div className="space-y-3">
      {savedMeals.map((m) => {
        const total = m.items.reduce((a, i) => ({
          calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs,
          fat: a.fat + i.fat, fiber: a.fiber + i.fiber, sugar: a.sugar + i.sugar, sodium: a.sodium + i.sodium,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 })
        return (
          <Card key={m.id} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold text-slate-100">{m.name}</div>
              <div className="text-xs text-slate-500">{m.items.length} items · {Math.round(total.calories)} cal</div>
            </div>
            <button onClick={() => addMeal({ slot: 'Lunch', name: m.name, serving: 'saved meal', ...roundAll(total) })} className="btn-ghost !py-1.5 !px-3 text-xs">Log</button>
          </Card>
        )
      })}
    </div>
  )
}

function HistoryTab() {
  const { meals } = useData()
  const byDate = useMemo(() => {
    const g = {}
    for (const m of meals) (g[m.date] ||= []).push(m)
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]))
  }, [meals])

  if (!byDate.length) return <Card><div className="text-sm text-slate-400">No meal history yet.</div></Card>
  return (
    <div className="space-y-3">
      {byDate.map(([date, items]) => (
        <Card key={date}>
          <div className="flex justify-between mb-2">
            <span className="font-display font-bold text-white">{date}</span>
            <span className="text-sm tabular-nums text-volt-400">{items.reduce((a, m) => a + m.calories, 0)} cal</span>
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            {items.map((m) => <div key={m.id}>{m.slot} — {m.name} <span className="tabular-nums text-slate-500">({m.calories})</span></div>)}
          </div>
        </Card>
      ))}
    </div>
  )
}
