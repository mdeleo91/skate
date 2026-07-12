// Drinks library: classic cocktails, beer, wine, spirits and canned drinks.
// Calories follow published USDA / NIAAA standard-recipe values; a bartender's
// heavy pour will run higher. Searchable alongside FOODS from the Fuel page.
const d = (id, name, serving, calories, carbs, sugar, cat) => ({
  id, name, brand: 'Standard recipe', serving, calories,
  protein: 0, carbs, fat: 0, fiber: 0, sugar, sodium: 0, cat,
})

export const DRINKS = [
  // Cocktails — classics
  d('c1', 'Margarita', '1 cocktail', 200, 13, 10, 'Cocktails'),
  d('c2', 'Old Fashioned', '1 cocktail', 155, 4, 3, 'Cocktails'),
  d('c3', 'Manhattan', '1 cocktail', 165, 4, 3, 'Cocktails'),
  d('c4', 'Martini (gin, dry)', '1 cocktail', 175, 0, 0, 'Cocktails'),
  d('c5', 'Vodka Martini', '1 cocktail', 170, 0, 0, 'Cocktails'),
  d('c6', 'Espresso Martini', '1 cocktail', 220, 15, 13, 'Cocktails'),
  d('c7', 'Negroni', '1 cocktail', 190, 12, 9, 'Cocktails'),
  d('c8', 'Mojito', '1 cocktail', 165, 15, 13, 'Cocktails'),
  d('c9', 'Daiquiri (classic)', '1 cocktail', 190, 12, 11, 'Cocktails'),
  d('c10', 'Cosmopolitan', '1 cocktail', 150, 11, 10, 'Cocktails'),
  d('c11', 'Moscow Mule', '1 cocktail', 180, 16, 14, 'Cocktails'),
  d('c12', 'Gin & Tonic', '1 highball', 170, 14, 13, 'Cocktails'),
  d('c13', 'Vodka Soda', '1 highball', 100, 0, 0, 'Cocktails'),
  d('c14', 'Vodka Tonic', '1 highball', 175, 14, 13, 'Cocktails'),
  d('c15', 'Rum & Coke', '1 highball', 185, 20, 20, 'Cocktails'),
  d('c16', 'Whiskey Sour', '1 cocktail', 160, 14, 12, 'Cocktails'),
  d('c17', 'Amaretto Sour', '1 cocktail', 250, 28, 25, 'Cocktails'),
  d('c18', 'Tom Collins', '1 highball', 180, 15, 13, 'Cocktails'),
  d('c19', 'Gimlet', '1 cocktail', 180, 12, 11, 'Cocktails'),
  d('c20', 'Paloma', '1 highball', 165, 15, 14, 'Cocktails'),
  d('c21', 'Dark & Stormy', '1 highball', 185, 17, 15, 'Cocktails'),
  d('c22', 'Mai Tai', '1 cocktail', 260, 22, 18, 'Cocktails'),
  d('c23', 'Piña Colada', '1 cocktail', 490, 57, 54, 'Cocktails'),
  d('c24', 'Long Island Iced Tea', '1 highball', 275, 26, 24, 'Cocktails'),
  d('c25', 'Aperol Spritz', '1 spritz', 125, 12, 11, 'Cocktails'),
  d('c26', 'Mimosa', '1 flute', 75, 6, 5, 'Cocktails'),
  d('c27', 'Bellini', '1 flute', 120, 12, 11, 'Cocktails'),
  d('c28', 'Bloody Mary', '1 cocktail', 120, 9, 6, 'Cocktails'),
  d('c29', 'Michelada', '1 pint', 145, 13, 5, 'Cocktails'),
  d('c30', 'White Russian', '1 cocktail', 290, 17, 15, 'Cocktails'),
  d('c31', 'Irish Coffee', '1 mug', 210, 12, 11, 'Cocktails'),
  d('c32', 'Hot Toddy', '1 mug', 160, 16, 15, 'Cocktails'),
  d('c33', 'Sangria', '1 glass', 175, 20, 17, 'Cocktails'),
  d('c34', 'Mint Julep', '1 cocktail', 165, 10, 9, 'Cocktails'),
  d('c35', 'Sazerac', '1 cocktail', 150, 5, 4, 'Cocktails'),
  d('c36', 'Boulevardier', '1 cocktail', 210, 10, 8, 'Cocktails'),
  d('c37', 'Sidecar', '1 cocktail', 200, 12, 11, 'Cocktails'),
  d('c38', 'French 75', '1 flute', 140, 9, 8, 'Cocktails'),
  d('c39', 'Caipirinha', '1 cocktail', 200, 16, 15, 'Cocktails'),
  d('c40', 'Tequila Sunrise', '1 highball', 200, 24, 22, 'Cocktails'),
  d('c41', 'Sex on the Beach', '1 highball', 230, 26, 24, 'Cocktails'),
  d('c42', 'Lemon Drop', '1 cocktail', 190, 16, 15, 'Cocktails'),
  d('c43', 'Gin Fizz', '1 highball', 170, 11, 10, 'Cocktails'),
  d('c44', 'Bramble', '1 cocktail', 180, 14, 12, 'Cocktails'),
  d('c45', 'Penicillin', '1 cocktail', 185, 13, 12, 'Cocktails'),
  d('c46', 'Paper Plane', '1 cocktail', 185, 14, 12, 'Cocktails'),
  d('c47', 'Last Word', '1 cocktail', 200, 14, 13, 'Cocktails'),
  d('c48', 'Frozen Margarita', '1 glass', 275, 32, 28, 'Cocktails'),
  d('c49', 'Hurricane', '1 cocktail', 320, 38, 35, 'Cocktails'),
  d('c50', 'Screwdriver', '1 highball', 175, 16, 14, 'Cocktails'),

  // Beer & cider
  d('b1', 'Beer, lager', '12 fl oz', 150, 13, 0, 'Beer'),
  d('b2', 'Beer, light', '12 fl oz', 100, 5, 0, 'Beer'),
  d('b3', 'IPA', '12 fl oz', 200, 18, 0, 'Beer'),
  d('b4', 'Double / Hazy IPA', '12 fl oz', 250, 22, 0, 'Beer'),
  d('b5', 'Stout', '12 fl oz', 210, 18, 0, 'Beer'),
  d('b6', 'Wheat Beer / Hefeweizen', '12 fl oz', 170, 15, 0, 'Beer'),
  d('b7', 'Pilsner', '12 fl oz', 150, 12, 0, 'Beer'),
  d('b8', 'Non-Alcoholic Beer', '12 fl oz', 60, 13, 3, 'Beer'),
  d('b9', 'Hard Cider', '12 fl oz', 200, 21, 20, 'Beer'),

  // Wine & bubbles
  d('w1', 'Red Wine', '5 fl oz', 125, 4, 1, 'Wine'),
  d('w2', 'White Wine', '5 fl oz', 120, 4, 1, 'Wine'),
  d('w3', 'Rosé', '5 fl oz', 125, 4, 1, 'Wine'),
  d('w4', 'Prosecco', '5 fl oz', 90, 3, 1, 'Wine'),
  d('w5', 'Champagne (brut)', '5 fl oz', 95, 2, 1, 'Wine'),
  d('w6', 'Port', '3 fl oz', 165, 12, 10, 'Wine'),
  d('w7', 'Sake', '5 fl oz', 195, 7, 0, 'Wine'),

  // Spirits & seltzers
  d('s1', 'Vodka (shot)', '1.5 fl oz', 96, 0, 0, 'Spirits'),
  d('s2', 'Whiskey / Bourbon (shot)', '1.5 fl oz', 105, 0, 0, 'Spirits'),
  d('s3', 'Tequila (shot)', '1.5 fl oz', 96, 0, 0, 'Spirits'),
  d('s4', 'Rum (shot)', '1.5 fl oz', 96, 0, 0, 'Spirits'),
  d('s5', 'Gin (shot)', '1.5 fl oz', 110, 0, 0, 'Spirits'),
  d('s6', 'Baileys Irish Cream', '1.5 fl oz', 147, 11, 9, 'Spirits'),
  d('s7', 'Hard Seltzer', '12 fl oz', 100, 2, 2, 'Spirits'),
  d('s8', 'Hard Kombucha', '12 fl oz', 120, 7, 4, 'Spirits'),
  d('s9', 'Hard Lemonade', '12 fl oz', 220, 30, 28, 'Spirits'),
]

export const searchDrinks = (q) => {
  const s = q.toLowerCase()
  return DRINKS.filter((x) => (x.name + ' ' + x.cat).toLowerCase().includes(s))
}
