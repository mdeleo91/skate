export const ACHIEVEMENTS = [
  // Distance
  { id: 'first-mile', cat: 'Distance', name: 'First Mile', desc: 'Skate your first mile.', icon: 'military_tech', metric: 'miles', goal: 1 },
  { id: 'miles-10', cat: 'Distance', name: '10 Miles', desc: 'Ten lifetime miles.', icon: 'roller_skating', metric: 'miles', goal: 10 },
  { id: 'miles-50', cat: 'Distance', name: '50 Miles', desc: 'Fifty lifetime miles.', icon: 'rocket_launch', metric: 'miles', goal: 50 },
  { id: 'miles-100', cat: 'Distance', name: '100 Miles', desc: 'Triple digits.', icon: 'award_star', metric: 'miles', goal: 100 },
  { id: 'miles-500', cat: 'Distance', name: '500 Miles', desc: 'Serious mileage.', icon: 'landscape', metric: 'miles', goal: 500 },
  { id: 'miles-1000', cat: 'Distance', name: '1000 Miles', desc: 'Four figures. Legend.', icon: 'crown', metric: 'miles', goal: 1000 },
  // Fitness
  { id: 'burn-10k', cat: 'Fitness', name: 'Burn 10,000 Calories', desc: 'Ten thousand calories torched.', icon: 'local_fire_department', metric: 'calories', goal: 10000 },
  { id: 'workouts-100', cat: 'Fitness', name: '100 Workouts', desc: 'One hundred sessions logged.', icon: 'fitness_center', metric: 'workouts', goal: 100 },
  { id: 'workouts-250', cat: 'Fitness', name: '250 Workouts', desc: 'Two hundred fifty sessions.', icon: 'exercise', metric: 'workouts', goal: 250 },
  { id: 'first-month', cat: 'Fitness', name: 'First Month', desc: 'Thirty days since your first skate.', icon: 'calendar_month', metric: 'daysActive', goal: 30 },
  // Weight loss
  { id: 'lose-5', cat: 'Weight Loss', name: 'Lose 5 lbs', desc: 'Down five pounds from your start.', icon: 'trending_down', metric: 'lbsLost', goal: 5 },
  { id: 'lose-10', cat: 'Weight Loss', name: 'Lose 10 lbs', desc: 'Down ten pounds.', icon: 'trending_down', metric: 'lbsLost', goal: 10 },
  { id: 'lose-25', cat: 'Weight Loss', name: 'Lose 25 lbs', desc: 'Down twenty-five pounds.', icon: 'celebration', metric: 'lbsLost', goal: 25 },
  { id: 'goal-weight', cat: 'Weight Loss', name: 'Reach Goal Weight', desc: 'Hit the number you set.', icon: 'trophy', metric: 'goalPct', goal: 100 },
  // Consistency
  { id: 'streak-7', cat: 'Consistency', name: '7-Day Streak', desc: 'A full week, every day.', icon: 'bolt', metric: 'streak', goal: 7 },
  { id: 'streak-30', cat: 'Consistency', name: '30-Day Streak', desc: 'A month without missing.', icon: 'local_fire_department', metric: 'streak', goal: 30 },
  { id: 'streak-100', cat: 'Consistency', name: '100-Day Streak', desc: 'One hundred straight days.', icon: 'star', metric: 'streak', goal: 100 },
  { id: 'year-active', cat: 'Consistency', name: 'One Year Active', desc: '365 days since day one.', icon: 'cake', metric: 'daysActive', goal: 365 },
]

export const ACHIEVEMENT_CATS = ['Distance', 'Fitness', 'Weight Loss', 'Consistency']

export const WEEKLY_CHALLENGES = [
  { id: 'w-15mi', name: 'Skate 15 Miles', desc: 'Any discipline. Miles are miles.', icon: 'roller_skating', metric: 'weekMiles', goal: 15, unit: 'mi' },
  { id: 'w-2500cal', name: 'Burn 2,500 Calories', desc: 'Across all activity this week.', icon: 'local_fire_department', metric: 'weekCalories', goal: 2500, unit: 'cal' },
  { id: 'w-3strength', name: '3 Strength Workouts', desc: 'Legs, core, hips — the skater trio.', icon: 'fitness_center', metric: 'weekStrength', goal: 3, unit: 'sessions' },
  { id: 'w-water', name: 'Drink Water Daily', desc: 'Hit your water goal every day this week.', icon: 'water_drop', metric: 'weekWaterDays', goal: 7, unit: 'days' },
]

export const MONTHLY_CHALLENGES = [
  { id: 'm-100mi', name: 'Skate 100 Miles', desc: 'The classic monthly grind.', icon: 'award_star', metric: 'monthMiles', goal: 100, unit: 'mi' },
  { id: 'm-every-workout', name: 'Complete Every Workout', desc: 'Finish every session your program prescribes.', icon: 'check_circle', metric: 'monthProgramPct', goal: 100, unit: '%' },
  { id: 'm-streak30', name: '30-Day Streak', desc: 'Move every single day this month.', icon: 'bolt', metric: 'streak', goal: 30, unit: 'days' },
  { id: 'm-finish-program', name: 'Finish a Program', desc: 'Complete any guided program.', icon: 'sports_score', metric: 'programsCompleted', goal: 1, unit: 'program' },
]
