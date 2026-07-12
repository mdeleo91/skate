import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Card, SectionTitle, Bar, Modal, Ring } from '../components/ui'
import Icon from '../components/icons'
import { FOODS, MEAL_SLOTS } from '../lib/foods'
import { DRINKS } from '../lib/drinks'
import { searchOpenFoodFacts } from '../lib/foodSearch'
import { searchCocktails } from '../lib/cocktailSearch'
import BarcodeScanner from '../components/BarcodeScanner'
import WeighInModal from '../components/WeighInModal'
import { todayISO } from '../lib/calc'

const TABS = ['Today', 'History']

export default function Nutrition() {
  const data = useData()
  const [tab, setTab] = useState('Today')
  const [q, setQ] = useState('')
  const [submitSignal, setSubmitSignal] = useState(0)
  const [scanner, setScanner] = useState(false)
  const [scanned, setScanned] = useState(null)
  if (!data) return null

  const searching = q.trim().length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="h-title">Fuel</h1>
          <p className="text-sm text-slate-500 mt-1">Eat like someone training for a long skate, not someone on a diet.</p>
        </div>
        <button onClick={() => setScanner(true)} className="btn-ghost !px-3 shrink-0"><Icon name="barcode_scanner" size={17} /> Scan</button>
      </div>

      <div className="relative">
        <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          className="input !pl-10 !pr-10"
          placeholder="Search any food or drink — pasta, tofu, margarita…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSubmitSignal((s) => s + 1) }}
        />
        {searching && (
          <button
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-lg leading-none text-slate-500 hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {searching ? (
        <SearchResults q={q} submitSignal={submitSignal} />
      ) : (
        <>
          <div className="flex gap-1.5">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`chip !px-3 !py-1.5 ${tab === t ? 'bg-volt-500 text-ink-900' : 'bg-ink-700 text-slate-400 hover:text-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>
          {tab === 'Today' && <TodayTab />}
          {tab === 'History' && <HistoryTab />}
        </>
      )}

      <BarcodeScanner
        open={scanner}
        onClose={() => setScanner(false)}
        onFound={(food) => { setScanner(false); setScanned(food) }}
      />
      <AddFoodModal food={scanned} onClose={() => setScanned(null)} />
    </div>
  )
}

function TodayTab() {
  const { d, meals, deleteMeal, addWater, profile, favorites, weights } = useData()
  const [pick, setPick] = useState(null)
  const [weighIn, setWeighIn] = useState(false)
  const today = todayISO()
  const todays = meals.filter((m) => m.date === today)
  const M = d.macrosToday
  const T = d.macros
  const favs = [...FOODS, ...DRINKS].filter((f) => favorites.includes(f.id))

  return (
    <div className="space-y-4">
      {!d.hasMeals && (
        <Card className="border-volt-500/30 bg-volt-500/[0.04] text-center py-7">
          <div className="mb-2.5 text-volt-400"><Icon name="nutrition" size={40} /></div>
          <div className="font-display font-bold text-white text-lg">Log your first meal</div>
          <div className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Type what you ate in the search bar above, or scan a barcode. Skate does the macro math
            and adds back the calories you burn skating — because you earned those.
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

      <Card>
        <SectionTitle
          action={d.hasWeights ? <Link to="/weight" className="text-xs text-volt-400 font-semibold">Details</Link> : null}
        >
          <Icon name="monitor_weight" size={15} className="mr-1.5 text-volt-400" />Weigh-In
        </SectionTitle>
        <div className="flex items-center justify-between gap-4">
          <div>
            {d.hasWeights ? (
              <>
                <div className="font-display text-3xl font-bold text-white tabular-nums">
                  {d.currentWeight.toFixed(1)}<span className="text-base text-slate-500 ml-1">lb</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  last weigh-in {weights[weights.length - 1].date}
                  {d.lbsLost > 0 && <span className="text-volt-400"> · {d.lbsLost.toFixed(1)} lb down</span>}
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-400">
                No weigh-ins yet. One number, whenever you're ready.
              </div>
            )}
          </div>
          <button onClick={() => setWeighIn(true)} className="btn-primary !px-4 shrink-0">+ Weigh in</button>
        </div>
      </Card>

      {favs.length > 0 && (
        <Card>
          <SectionTitle><Icon name="star_filled" size={15} className="mr-1.5 text-volt-400" />Favorite Foods</SectionTitle>
          <FoodList foods={favs} onPick={setPick} />
        </Card>
      )}

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

      <AddFoodModal food={pick} onClose={() => setPick(null)} />
      <WeighInModal open={weighIn} onClose={() => setWeighIn(false)} />
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

function SearchResults({ q, submitSignal }) {
  const [pick, setPick] = useState(null)
  const [quickAdd, setQuickAdd] = useState(false)
  const [online, setOnline] = useState({ status: 'idle', query: '', items: [], cocktails: [] })
  const needle = q.trim().toLowerCase()
  const results = useMemo(
    () => [...FOODS, ...DRINKS].filter((f) => (f.name + f.brand + f.cat).toLowerCase().includes(needle)),
    [needle]
  )

  async function searchOnline() {
    const query = q.trim()
    if (query.length < 2) return
    setOnline({ status: 'loading', query, items: [], cocktails: [] })
    // Two sources in parallel: packaged foods (Open Food Facts) and cocktail
    // recipes (TheCocktailDB, calories estimated from the ingredients).
    const [foods, cocktails] = await Promise.allSettled([
      searchOpenFoodFacts(query),
      searchCocktails(query),
    ])
    if (foods.status === 'rejected' && cocktails.status === 'rejected') {
      setOnline({ status: 'error', query, items: [], cocktails: [] })
      return
    }
    setOnline({
      status: 'done',
      query,
      items: foods.status === 'fulfilled' ? foods.value : [],
      cocktails: cocktails.status === 'fulfilled' ? cocktails.value : [],
    })
  }

  // Enter in the search bar above fires the online search from here.
  useEffect(() => {
    if (submitSignal > 0) searchOnline()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitSignal])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{results.length} in library</SectionTitle>
        <FoodList foods={results} onPick={setPick} />
      </Card>

      {q.trim().length >= 2 && (
        <Card>
          <SectionTitle action={online.status === 'done' ? <span className="text-xs text-slate-500">via Open Food Facts</span> : null}>
            Online Search
          </SectionTitle>
          {online.status === 'idle' && (
            <div>
              <p className="text-sm text-slate-400 mb-3">
                Not in the library? Search Open Food Facts — a free database of over 3 million foods.
              </p>
              <button onClick={searchOnline} className="btn-ghost w-full">
                <Icon name="travel_explore" size={17} /> Search online for “{q.trim()}”
              </button>
            </div>
          )}
          {online.status === 'loading' && <div className="text-sm text-slate-400 py-2">Searching Open Food Facts…</div>}
          {online.status === 'error' && (
            <div className="text-sm text-slate-400">
              Couldn't reach the food database — you might be offline.
              <div className="flex gap-2 mt-3">
                <button onClick={searchOnline} className="btn-ghost flex-1 !py-1.5 text-xs">Try again</button>
                <button onClick={() => setQuickAdd(true)} className="btn-ghost flex-1 !py-1.5 text-xs">Enter it by hand</button>
              </div>
            </div>
          )}
          {online.status === 'done' && (
            online.items.length
              ? (
                <>
                  <p className="text-xs text-slate-500 mb-2">Values are per 100 g — adjust servings when you log.</p>
                  <FoodList foods={online.items} onPick={setPick} />
                  {online.query !== q.trim() && (
                    <button onClick={searchOnline} className="btn-ghost w-full mt-3 !py-1.5 text-xs">
                      Search online for “{q.trim()}” instead
                    </button>
                  )}
                </>
              )
              : <div className="text-sm text-slate-500">No packaged-food matches for “{online.query}”.</div>
          )}
        </Card>
      )}

      {online.status === 'done' && online.cocktails.length > 0 && (
        <Card>
          <SectionTitle action={<span className="text-xs text-slate-500">via TheCocktailDB</span>}>
            <Icon name="local_bar" size={15} className="mr-1.5 text-surge-400" />Cocktails
          </SectionTitle>
          <p className="text-xs text-slate-500 mb-2">
            Calories estimated from each recipe's actual ingredients — a heavy pour runs higher.
          </p>
          <FoodList foods={online.cocktails} onPick={setPick} />
        </Card>
      )}

      <Card>
        <SectionTitle>Can't find it?</SectionTitle>
        <p className="text-sm text-slate-400 mb-3">
          Log anything with your own numbers — straight off the package label.
        </p>
        <button onClick={() => setQuickAdd(true)} className="btn-ghost w-full">
          <Icon name="edit" size={16} /> Quick add a custom food
        </button>
      </Card>

      <AddFoodModal food={pick} onClose={() => setPick(null)} />
      <QuickAddModal open={quickAdd} initialName={q.trim()} onClose={() => setQuickAdd(false)} />
    </div>
  )
}

function QuickAddModal({ open, initialName, onClose }) {
  const { addMeal } = useData()
  if (!open) return null
  return <QuickAddForm key={initialName} initialName={initialName} addMeal={addMeal} onClose={onClose} />
}

function QuickAddForm({ initialName, addMeal, onClose }) {
  const [f, setF] = useState({
    name: initialName || '', slot: 'Snacks', calories: '', protein: '', carbs: '', fat: '',
  })
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const valid = f.name.trim() && f.calories !== '' && +f.calories >= 0
  return (
    <Modal open onClose={onClose} title="Quick add">
      <div className="space-y-3">
        <div><label className="label">Food name</label><input className="input" placeholder="Pasta with butter" value={f.name} onChange={set('name')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Meal</label>
            <select className="input" value={f.slot} onChange={set('slot')}>
              {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Calories</label><input type="number" min="0" className="input" placeholder="250" value={f.calories} onChange={set('calories')} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Protein g</label><input type="number" min="0" className="input" value={f.protein} onChange={set('protein')} /></div>
          <div><label className="label">Carbs g</label><input type="number" min="0" className="input" value={f.carbs} onChange={set('carbs')} /></div>
          <div><label className="label">Fat g</label><input type="number" min="0" className="input" value={f.fat} onChange={set('fat')} /></div>
        </div>
        <button
          className="btn-primary w-full"
          disabled={!valid}
          onClick={() => {
            addMeal({
              slot: f.slot, name: f.name.trim(), serving: 'custom entry',
              calories: Math.round(+f.calories), protein: Math.round(+f.protein || 0),
              carbs: Math.round(+f.carbs || 0), fat: Math.round(+f.fat || 0),
              fiber: 0, sugar: 0, sodium: 0,
            })
            onClose()
          }}
        >
          Add to {f.slot}
        </button>
        <p className="text-xs text-slate-500 text-center">Macros are optional — calories alone still count toward your day.</p>
      </div>
    </Modal>
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
