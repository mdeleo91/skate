# SkateFit icon inventory — custom icon worklist

All UI icons live in one registry: `src/components/icons.jsx` (Material
Symbols paths, viewBox `0 -960 960 960`, filled with `currentColor`).
To swap one: replace its path (any single-path SVG works; I can adapt
multi-path art). No emojis remain anywhere in the app.

## Priority 1 — identity & navigation (every screen)
- [ ] roller_skating — Skate tab, Outdoor Fitness discipline, achievements, banners (15+ uses)
- [ ] home — Home tab
- [ ] fitness_center — Workouts tab, strength
- [ ] nutrition — Nutrition tab (apple)
- [ ] monitoring — Progress tab
- [ ] menu — header hamburger
- [ ] notifications — header bell

## Priority 2 — skate disciplines (Skate tab cards)
- [ ] forest (Trail) · location_city (Urban) · bolt (Speed) · skateboarding (Aggressive)
- [ ] sports_hockey (Hockey) · target (Freestyle) · backpack (Commute) · eco (Recovery)

## Priority 3 — home stats & conditions
- [ ] local_fire_department — consumed / burned / streak / programs (4 contexts)
- [ ] water_drop · timer · partly_cloudy_day

## Achievements & programs (badges)
- [ ] military_tech · rocket_launch · award_star · landscape · crown · exercise
- [ ] calendar_month · trending_down · celebration · trophy · cake · star · star_filled
- [ ] check_circle · cardiology · terrain · sports_score (also map finish flag)

## Weather set (Conditions page)
- [ ] sunny · cloud · foggy · rainy · thunderstorm · weather_snowy · ac_unit
- [ ] device_thermostat · thumb_up · help

## Live tracking & maps
- [ ] my_location · play_arrow · pause · stop · straighten · history · route · map

## Nutrition & food
- [ ] barcode_scanner · search · travel_explore · menu_book · local_bar · sports_bar
- [ ] rice_bowl · local_cafe · bakery_dining · lunch_dining · grocery · monitor_weight

## Gear
- [ ] footprint (Boots) · construction (Frames) · tire_repair (Wheels)
- [ ] settings (Bearings + Profile) · health_and_safety (Protective) · build (Gear page)

## Utility / chrome (lowest priority)
- [ ] arrow_back · arrow_forward · arrow_downward · check · edit · share · download
- [ ] more_horiz · more_vert · install_mobile · android · photo_camera

## Drawn graphics (code, not registry — ask if you want these custom)
- Calorie goal ring, sparklines/trend charts, roughness histogram, progress bars
- Hexagon badges (PRs, Next Goal) — CSS clip-path
- Map start dot + finish flag
- Brand: branding/icon.svg · branding/wordmark.svg (done)
