// Guided programs: skating + strength + recovery, structured week by week.
const week = (n, title, days) => ({ n, title, days })

export const PROGRAMS = [
  {
    id: 'first-10-miles',
    name: 'First 10 Miles',
    tagline: 'Build to a single 10-mile skate.',
    weeks: 4,
    level: 'Beginner',
    emoji: '🎯',
    focus: ['Endurance', 'Confidence'],
    summary:
      'Four weeks of gradually longer rolls. No speed work, no pressure — just time on wheels until 10 miles feels like a normal afternoon.',
    plan: [
      week(1, 'Get comfortable', ['Skate 2 mi easy', 'Strength: 20 min legs/core', 'Rest', 'Skate 3 mi easy', 'Rest', 'Skate 4 mi', 'Recovery roll 20 min']),
      week(2, 'Add time', ['Skate 3 mi', 'Strength: 25 min', 'Rest', 'Skate 4 mi', 'Recovery roll', 'Skate 6 mi', 'Rest']),
      week(3, 'Long roll', ['Skate 4 mi', 'Strength: 25 min', 'Rest', 'Skate 5 mi', 'Recovery roll', 'Skate 8 mi', 'Rest']),
      week(4, 'The 10', ['Skate 3 mi easy', 'Strength: light', 'Rest', 'Skate 4 mi', 'Rest', 'Skate 10 MILES 🎉', 'Recovery roll']),
    ],
  },
  {
    id: '30-day-habit',
    name: '30-Day Skate Habit',
    tagline: 'Show up. That is the whole program.',
    weeks: 4,
    level: 'Beginner',
    emoji: '🔥',
    focus: ['Consistency'],
    summary:
      'Every day you either skate, do a short strength session, or take an intentional recovery day. The goal is not distance. The goal is that skating becomes something you just do.',
    plan: [
      week(1, 'Anything counts', ['Skate 15 min', 'Skate 20 min', 'Strength 15 min', 'Skate 20 min', 'Recovery walk', 'Skate 30 min', 'Rest']),
      week(2, 'Slightly more', ['Skate 25 min', 'Strength 20 min', 'Skate 25 min', 'Recovery roll', 'Skate 30 min', 'Skate 35 min', 'Rest']),
      week(3, 'It is a habit now', ['Skate 30 min', 'Strength 25 min', 'Skate 30 min', 'Recovery roll', 'Skate 40 min', 'Skate 40 min', 'Rest']),
      week(4, 'Lock it in', ['Skate 35 min', 'Strength 25 min', 'Skate 35 min', 'Recovery roll', 'Skate 45 min', 'Skate 50 min', 'Celebrate']),
    ],
  },
  {
    id: 'lose-10',
    name: 'Lose 10 Pounds',
    tagline: 'A skating-first deficit you can actually live with.',
    weeks: 10,
    level: 'All levels',
    emoji: '📉',
    focus: ['Weight loss', 'Endurance'],
    summary:
      'Roughly 1 lb/week from a modest calorie deficit plus 4 skate sessions and 2 strength sessions a week. Weigh in weekly, not daily — the trend line is the truth.',
    plan: [
      week(1, 'Baseline', ['Skate 3 mi', 'Strength', 'Skate 4 mi', 'Rest', 'Skate 4 mi', 'Long skate 6 mi', 'Recovery']),
      week(2, 'Build', ['Skate 4 mi', 'Strength', 'Skate 5 mi', 'Rest', 'Skate 4 mi', 'Long skate 8 mi', 'Recovery']),
      week(3, 'Build', ['Skate 4 mi', 'Strength', 'Speed intervals', 'Rest', 'Skate 5 mi', 'Long skate 9 mi', 'Recovery']),
      week(4, 'Deload', ['Skate 3 mi', 'Strength light', 'Skate 3 mi', 'Rest', 'Recovery roll', 'Skate 6 mi', 'Rest']),
    ],
  },
  {
    id: 'lose-25',
    name: 'Lose 25 Pounds',
    tagline: 'The long game. Six months of skating you enjoy.',
    weeks: 26,
    level: 'All levels',
    emoji: '🏔️',
    focus: ['Weight loss', 'Consistency'],
    summary:
      'Built for the long haul: sustainable deficit, rising skate volume, planned deload weeks, and permission to have a bad week without quitting.',
    plan: [
      week(1, 'Foundation', ['Skate 3 mi', 'Strength', 'Skate 3 mi', 'Rest', 'Skate 4 mi', 'Long skate', 'Recovery']),
      week(2, 'Foundation', ['Skate 4 mi', 'Strength', 'Skate 4 mi', 'Rest', 'Skate 5 mi', 'Long skate', 'Recovery']),
      week(3, 'Volume', ['Skate 5 mi', 'Strength', 'Speed intervals', 'Rest', 'Skate 5 mi', 'Long skate 10 mi', 'Recovery']),
      week(4, 'Deload', ['Skate 3 mi', 'Strength light', 'Recovery roll', 'Rest', 'Skate 4 mi', 'Skate 6 mi', 'Rest']),
    ],
  },
  {
    id: 'skate-every-week',
    name: 'Skate Every Week',
    tagline: 'One skate a week, for a year.',
    weeks: 52,
    level: 'Beginner',
    emoji: '📅',
    focus: ['Consistency'],
    summary:
      'The lowest-pressure program here. Get out once a week, every week. Miss one? The week resets, not the program.',
    plan: [
      week(1, 'Any skate', ['Skate 20+ min once this week']),
      week(2, 'Any skate', ['Skate 20+ min once this week']),
      week(3, 'Any skate', ['Skate 25+ min once this week']),
      week(4, 'Any skate', ['Skate 30+ min once this week']),
    ],
  },
  {
    id: 'half-marathon',
    name: 'First Half Marathon Skate',
    tagline: '13.1 miles on wheels.',
    weeks: 8,
    level: 'Intermediate',
    emoji: '🏅',
    focus: ['Endurance', 'Pacing'],
    summary:
      'Weekly long skate progression to 13.1, plus tempo work so the second half does not fall apart. Includes fueling practice on the long days.',
    plan: [
      week(1, 'Base', ['Skate 4 mi', 'Strength', 'Tempo 3 mi', 'Rest', 'Recovery roll', 'Long 6 mi', 'Rest']),
      week(2, 'Base', ['Skate 4 mi', 'Strength', 'Tempo 4 mi', 'Rest', 'Recovery roll', 'Long 8 mi', 'Rest']),
      week(3, 'Build', ['Skate 5 mi', 'Strength', 'Intervals', 'Rest', 'Recovery roll', 'Long 10 mi', 'Rest']),
      week(4, 'Peak', ['Skate 5 mi', 'Strength', 'Tempo 5 mi', 'Rest', 'Recovery roll', 'Long 13.1 mi 🏅', 'Rest']),
    ],
  },
  {
    id: '100-mile-month',
    name: '100 Mile Month',
    tagline: '~25 miles a week. Very doable, very satisfying.',
    weeks: 4,
    level: 'Intermediate',
    emoji: '💯',
    focus: ['Volume'],
    summary:
      'Break 100 miles into four 25-mile weeks. Mix long rolls, commutes, and short evening laps — every mile counts the same.',
    plan: [
      week(1, '25 miles', ['Skate 5 mi', 'Strength', 'Skate 6 mi', 'Rest', 'Skate 6 mi', 'Long 8 mi', 'Recovery']),
      week(2, '25 miles', ['Skate 6 mi', 'Strength', 'Skate 6 mi', 'Rest', 'Skate 5 mi', 'Long 8 mi', 'Recovery']),
      week(3, '25 miles', ['Skate 6 mi', 'Strength', 'Skate 7 mi', 'Rest', 'Skate 4 mi', 'Long 8 mi', 'Recovery']),
      week(4, '25 miles', ['Skate 6 mi', 'Strength', 'Skate 6 mi', 'Rest', 'Skate 5 mi', 'Long 8 mi', '💯']),
    ],
  },
  {
    id: 'endurance-builder',
    name: 'Endurance Builder',
    tagline: 'Skate longer without falling apart.',
    weeks: 6,
    level: 'Intermediate',
    emoji: '🫀',
    focus: ['Aerobic base'],
    summary:
      'Mostly easy aerobic volume with one weekly long skate and dedicated core/hip strength — the muscles that quit first on long sessions.',
    plan: [
      week(1, 'Aerobic base', ['Easy 4 mi', 'Core + hips', 'Easy 5 mi', 'Rest', 'Easy 5 mi', 'Long 8 mi', 'Recovery']),
      week(2, 'Aerobic base', ['Easy 5 mi', 'Core + hips', 'Easy 5 mi', 'Rest', 'Easy 6 mi', 'Long 10 mi', 'Recovery']),
      week(3, 'Extend', ['Easy 5 mi', 'Core + hips', 'Easy 6 mi', 'Rest', 'Easy 6 mi', 'Long 12 mi', 'Recovery']),
      week(4, 'Deload', ['Easy 4 mi', 'Core light', 'Easy 4 mi', 'Rest', 'Recovery roll', 'Long 8 mi', 'Rest']),
    ],
  },
  {
    id: 'speed-builder',
    name: 'Speed Builder',
    tagline: 'Raise your average, raise your top end.',
    weeks: 6,
    level: 'Advanced',
    emoji: '⚡',
    focus: ['Speed', 'Power'],
    summary:
      'Two interval sessions a week (short sprints + longer tempo), plus posterior-chain strength. Recovery days are mandatory, not optional.',
    plan: [
      week(1, 'Neuromuscular', ['8x20s sprints', 'Strength: legs', 'Tempo 3 mi', 'Recovery roll', 'Rest', 'Long easy 8 mi', 'Rest']),
      week(2, 'Threshold', ['6x1 min hard', 'Strength: legs', 'Tempo 4 mi', 'Recovery roll', 'Rest', 'Long easy 9 mi', 'Rest']),
      week(3, 'VO2', ['5x3 min hard', 'Strength: legs', 'Tempo 4 mi', 'Recovery roll', 'Rest', 'Long easy 10 mi', 'Rest']),
      week(4, 'Sharpen', ['10x20s sprints', 'Strength light', 'Time trial 2 mi ⚡', 'Recovery roll', 'Rest', 'Long easy 8 mi', 'Rest']),
    ],
  },
  {
    id: 'hill-training',
    name: 'Hill Training',
    tagline: 'Climb better. Descend braver.',
    weeks: 5,
    level: 'Advanced',
    emoji: '⛰️',
    focus: ['Power', 'Control'],
    summary:
      'Repeats on a moderate grade, plus controlled descents and braking drills. Builds the leg strength that makes flat skating feel effortless.',
    plan: [
      week(1, 'Introduce', ['4x hill repeats', 'Strength: quads/glutes', 'Easy 4 mi', 'Rest', 'Braking drills', 'Long rolling 8 mi', 'Recovery']),
      week(2, 'Build', ['6x hill repeats', 'Strength', 'Easy 5 mi', 'Rest', 'Descent control', 'Long rolling 9 mi', 'Recovery']),
      week(3, 'Build', ['8x hill repeats', 'Strength', 'Easy 5 mi', 'Rest', 'Descent control', 'Long rolling 10 mi', 'Recovery']),
      week(4, 'Peak', ['10x hill repeats', 'Strength', 'Easy 4 mi', 'Rest', 'Braking drills', 'Hilly 12 mi ⛰️', 'Recovery']),
    ],
  },
]

export const getProgram = (id) => PROGRAMS.find((p) => p.id === id)
