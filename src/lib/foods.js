// Sample food database. In production this would be a hosted nutrition API.
export const FOODS = [
  { id: 'f1', name: 'Oatmeal, cooked', brand: 'Generic', serving: '1 cup', calories: 154, protein: 6, carbs: 27, fat: 3, fiber: 4, sugar: 1, sodium: 9, cat: 'Breakfast' },
  { id: 'f2', name: 'Greek Yogurt, plain nonfat', brand: 'Generic', serving: '1 cup', calories: 130, protein: 22, carbs: 9, fat: 0, fiber: 0, sugar: 7, sodium: 65, cat: 'Breakfast' },
  { id: 'f3', name: 'Banana', brand: 'Generic', serving: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, sugar: 14, sodium: 1, cat: 'Fruit' },
  { id: 'f4', name: 'Chicken Breast, grilled', brand: 'Generic', serving: '6 oz', calories: 281, protein: 53, carbs: 0, fat: 6, fiber: 0, sugar: 0, sodium: 126, cat: 'Protein' },
  { id: 'f5', name: 'Brown Rice, cooked', brand: 'Generic', serving: '1 cup', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 4, sugar: 1, sodium: 10, cat: 'Grains' },
  { id: 'f6', name: 'Salmon, baked', brand: 'Generic', serving: '6 oz', calories: 367, protein: 40, carbs: 0, fat: 22, fiber: 0, sugar: 0, sodium: 116, cat: 'Protein' },
  { id: 'f7', name: 'Whole Wheat Bread', brand: 'Generic', serving: '2 slices', calories: 160, protein: 8, carbs: 28, fat: 2, fiber: 4, sugar: 4, sodium: 260, cat: 'Grains' },
  { id: 'f8', name: 'Peanut Butter', brand: 'Generic', serving: '2 tbsp', calories: 190, protein: 8, carbs: 7, fat: 16, fiber: 2, sugar: 3, sodium: 140, cat: 'Fats' },
  { id: 'f9', name: 'Egg, large', brand: 'Generic', serving: '1 egg', calories: 72, protein: 6, carbs: 0, fat: 5, fiber: 0, sugar: 0, sodium: 71, cat: 'Protein' },
  { id: 'f10', name: 'Almonds', brand: 'Generic', serving: '1 oz (23)', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 4, sugar: 1, sodium: 0, cat: 'Snacks' },
  { id: 'f11', name: 'Protein Shake, whey', brand: 'Generic', serving: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0, sugar: 2, sodium: 50, cat: 'Protein' },
  { id: 'f12', name: 'Avocado', brand: 'Generic', serving: '1/2 medium', calories: 161, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 1, sodium: 7, cat: 'Fats' },
  { id: 'f13', name: 'Sweet Potato, baked', brand: 'Generic', serving: '1 medium', calories: 103, protein: 2, carbs: 24, fat: 0, fiber: 4, sugar: 7, sodium: 41, cat: 'Vegetables' },
  { id: 'f14', name: 'Broccoli, steamed', brand: 'Generic', serving: '1 cup', calories: 55, protein: 4, carbs: 11, fat: 1, fiber: 5, sugar: 2, sodium: 64, cat: 'Vegetables' },
  { id: 'f15', name: 'Ground Turkey 93%', brand: 'Generic', serving: '4 oz', calories: 170, protein: 22, carbs: 0, fat: 9, fiber: 0, sugar: 0, sodium: 80, cat: 'Protein' },
  { id: 'f16', name: 'Olive Oil', brand: 'Generic', serving: '1 tbsp', calories: 119, protein: 0, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 0, cat: 'Fats' },
  { id: 'f17', name: 'Apple', brand: 'Generic', serving: '1 medium', calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, sugar: 19, sodium: 2, cat: 'Fruit' },
  { id: 'f18', name: 'Cottage Cheese, 2%', brand: 'Generic', serving: '1 cup', calories: 183, protein: 24, carbs: 11, fat: 5, fiber: 0, sugar: 9, sodium: 746, cat: 'Protein' },
  { id: 'f19', name: 'Energy Bar', brand: 'CLIF', serving: '1 bar', calories: 250, protein: 9, carbs: 45, fat: 5, fiber: 5, sugar: 21, sodium: 150, cat: 'Snacks' },
  { id: 'f20', name: 'Sports Drink', brand: 'Gatorade', serving: '20 fl oz', calories: 140, protein: 0, carbs: 36, fat: 0, fiber: 0, sugar: 34, sodium: 270, cat: 'Drinks' },
  { id: 'f21', name: 'Black Coffee', brand: 'Generic', serving: '12 fl oz', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5, cat: 'Drinks' },
  { id: 'f22', name: 'Quinoa, cooked', brand: 'Generic', serving: '1 cup', calories: 222, protein: 8, carbs: 39, fat: 4, fiber: 5, sugar: 2, sodium: 13, cat: 'Grains' },
  { id: 'f23', name: 'Spinach, raw', brand: 'Generic', serving: '2 cups', calories: 14, protein: 2, carbs: 2, fat: 0, fiber: 1, sugar: 0, sodium: 48, cat: 'Vegetables' },
  { id: 'f24', name: 'Blueberries', brand: 'Generic', serving: '1 cup', calories: 84, protein: 1, carbs: 21, fat: 0, fiber: 4, sugar: 15, sodium: 1, cat: 'Fruit' },
]

export const RESTAURANTS = [
  {
    id: 'r1', name: 'Chipotle', icon: 'rice_bowl',
    items: [
      { id: 'r1a', name: 'Chicken Burrito Bowl', serving: '1 bowl', calories: 625, protein: 45, carbs: 62, fat: 21, fiber: 12, sugar: 6, sodium: 1370 },
      { id: 'r1b', name: 'Steak Salad', serving: '1 salad', calories: 480, protein: 34, carbs: 28, fat: 26, fiber: 10, sugar: 5, sodium: 1210 },
      { id: 'r1c', name: 'Chips & Guacamole', serving: '1 order', calories: 770, protein: 10, carbs: 78, fat: 47, fiber: 14, sugar: 3, sodium: 570 },
    ],
  },
  {
    id: 'r2', name: 'Sweetgreen', icon: 'grocery',
    items: [
      { id: 'r2a', name: 'Harvest Bowl', serving: '1 bowl', calories: 705, protein: 29, carbs: 68, fat: 36, fiber: 9, sugar: 16, sodium: 1000 },
      { id: 'r2b', name: 'Guacamole Greens', serving: '1 salad', calories: 570, protein: 24, carbs: 35, fat: 38, fiber: 12, sugar: 6, sodium: 830 },
    ],
  },
  {
    id: 'r3', name: 'Starbucks', icon: 'local_cafe',
    items: [
      { id: 'r3a', name: 'Grande Latte, 2%', serving: '16 fl oz', calories: 190, protein: 13, carbs: 19, fat: 7, fiber: 0, sugar: 18, sodium: 150 },
      { id: 'r3b', name: 'Egg White & Pepper Wrap', serving: '1 wrap', calories: 290, protein: 20, carbs: 34, fat: 8, fiber: 3, sugar: 5, sodium: 840 },
      { id: 'r3c', name: 'Cold Brew, black', serving: '16 fl oz', calories: 5, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 15 },
    ],
  },
  {
    id: 'r4', name: 'Panera', icon: 'bakery_dining',
    items: [
      { id: 'r4a', name: 'Turkey Sandwich', serving: '1 whole', calories: 470, protein: 30, carbs: 55, fat: 14, fiber: 5, sugar: 8, sodium: 1490 },
      { id: 'r4b', name: 'Ten Vegetable Soup', serving: '1 cup', calories: 60, protein: 2, carbs: 12, fat: 1, fiber: 3, sugar: 6, sodium: 750 },
    ],
  },
  {
    id: 'r5', name: 'Shake Shack', icon: 'lunch_dining',
    items: [
      { id: 'r5a', name: 'ShackBurger', serving: '1 burger', calories: 550, protein: 31, carbs: 26, fat: 34, fiber: 1, sugar: 8, sodium: 1120 },
      { id: 'r5b', name: 'Crinkle Cut Fries', serving: '1 order', calories: 470, protein: 6, carbs: 55, fat: 25, fiber: 5, sugar: 1, sodium: 570 },
    ],
  },
]

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
