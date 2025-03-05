import axios from 'axios';

const API_URL = 'http://localhost:5000/api/nutrition';

// Basic nutrition values per 100g for common ingredients - used as fallback
const basicNutritionData = {
  // Proteins
  'chicken': { calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0 },
  'beef': { calories: 250, protein: 26, carbs: 0, fats: 17, fiber: 0 },
  'fish': { calories: 105, protein: 22, carbs: 0, fats: 2, fiber: 0 },
  'eggs': { calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0 },
  'tofu': { calories: 76, protein: 8, carbs: 2, fats: 4.5, fiber: 0.3 },
  // Grains
  'rice': { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4 },
  'pasta': { calories: 158, protein: 5.8, carbs: 31, fats: 0.9, fiber: 1.8 },
  'bread': { calories: 265, protein: 9, carbs: 49, fats: 3, fiber: 2.7 },
  'flour': { calories: 364, protein: 10, carbs: 76, fats: 1, fiber: 2.7 },
  // Vegetables
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2 },
  'potato': { calories: 77, protein: 2, carbs: 17, fats: 0.1, fiber: 2.2 },
  'onion': { calories: 40, protein: 1.1, carbs: 9.3, fats: 0.1, fiber: 1.7 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fats: 0.5, fiber: 2.1 },
  'carrot': { calories: 41, protein: 0.9, carbs: 9.6, fats: 0.2, fiber: 2.8 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4, fiber: 2.6 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2 },
  'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2, fiber: 1.3 },
  'cucumber': { calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, fiber: 0.5 },
  // Fruits
  'apple': { calories: 52, protein: 0.3, carbs: 13.8, fats: 0.2, fiber: 2.4 },
  'banana': { calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3, fiber: 2.6 },
  'orange': { calories: 47, protein: 0.9, carbs: 11.8, fats: 0.1, fiber: 2.4 },
  'strawberry': { calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, fiber: 2 },
  'blueberry': { calories: 57, protein: 0.7, carbs: 14.5, fats: 0.3, fiber: 2.4 },
  // Dairy
  'milk': { calories: 42, protein: 3.4, carbs: 5, fats: 1, fiber: 0 },
  'cheese': { calories: 402, protein: 25, carbs: 1.3, fats: 33, fiber: 0 },
  'yogurt': { calories: 59, protein: 3.5, carbs: 5, fats: 3.3, fiber: 0 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fats: 81, fiber: 0 },
  // Nuts & Seeds
  'almonds': { calories: 579, protein: 21, carbs: 22, fats: 49, fiber: 12.5 },
  'walnuts': { calories: 654, protein: 15, carbs: 14, fats: 65, fiber: 6.7 },
  'peanuts': { calories: 567, protein: 26, carbs: 16, fats: 49, fiber: 8.5 },
  'chia seeds': { calories: 486, protein: 17, carbs: 42, fats: 31, fiber: 34 },
  // Oils
  'olive oil': { calories: 884, protein: 0, carbs: 0, fats: 100, fiber: 0 },
  'coconut oil': { calories: 862, protein: 0, carbs: 0, fats: 100, fiber: 0 },
  // Sweeteners
  'sugar': { calories: 387, protein: 0, carbs: 100, fats: 0, fiber: 0 },
  'honey': { calories: 304, protein: 0.3, carbs: 82, fats: 0, fiber: 0.2 },
  // Herbs & Spices
  'basil': { calories: 23, protein: 3.2, carbs: 2.7, fats: 0.6, fiber: 1.6 },
  'cinnamon': { calories: 247, protein: 4, carbs: 81, fats: 1.2, fiber: 53 },
  'pepper': { calories: 40, protein: 2, carbs: 10, fats: 0.4, fiber: 3.3 },
  'salt': { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
};

// Calculate nutrition from ingredients
export const calculateNutrition = async (ingredients) => {
  try {
    // First try the API
    const response = await axios.post(`${API_URL}/calculate`, {
      ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim())
    });
    return response.data.data;
  } catch (error) {
    console.warn('API nutrition calculation failed, using fallback method', error);
    // If API fails, use fallback calculation
    return calculateNutritionFallback(ingredients);
  }
};

// Fallback calculation method
export const calculateNutritionFallback = (ingredients) => {
  const ingredientsList = Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(i => i.trim());
  
  // Initialize nutrition values
  const nutrition = {
    calories: { value: 0, unit: 'kcal' },
    protein: { value: 0, unit: 'g' },
    carbs: { value: 0, unit: 'g' },
    fats: { value: 0, unit: 'g' },
    fiber: { value: 0, unit: 'g' }
  };
  
  // Process each ingredient
  ingredientsList.forEach(ingredient => {
    // Check for amount information in the ingredient
    const amountMatch = ingredient.match(/^([\d./]+)\s*(\w+)?\s+(.+)$/);
    let amount = 1; // Default amount
    let unit = null;
    let ingredientName = ingredient.toLowerCase();
    
    if (amountMatch) {
      // Parse amount if present
      amount = parseFloat(amountMatch[1]) || 1;
      unit = amountMatch[2];
      ingredientName = amountMatch[3].toLowerCase();
    }
    
    // Find matching ingredient in our basic data
    let match = null;
    Object.keys(basicNutritionData).forEach(key => {
      if (ingredientName.includes(key)) {
        match = key;
      }
    });
    
    if (match) {
      // Apply quantity modifier
      let modifier = 1;
      
      // Adjust based on units
      if (unit) {
        if (unit === 'cup' || unit === 'cups') {
          modifier = 2.5; // Roughly 250g
        } else if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') {
          modifier = 0.15; // About 15g
        } else if (unit === 'tsp' || unit === 'teaspoon' || unit === 'teaspoons') {
          modifier = 0.05; // About 5g
        } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
          modifier = 0.01; // Convert to 100g basis
        } else if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') {
          modifier = 0.28; // Convert to 100g basis (1 oz = 28g)
        } else if (unit === 'lb' || unit === 'pound' || unit === 'pounds') {
          modifier = 4.5; // Convert to 100g basis (1 lb = 450g)
        }
      }
      
      // Calculate nutrition
      const data = basicNutritionData[match];
      nutrition.calories.value += data.calories * amount * modifier;
      nutrition.protein.value += data.protein * amount * modifier;
      nutrition.carbs.value += data.carbs * amount * modifier;
      nutrition.fats.value += data.fats * amount * modifier;
      nutrition.fiber.value += data.fiber * amount * modifier;
    } else {
      // If no match, make a minimal estimation
      // Each ingredient contributes a small amount to ensure some value
      nutrition.calories.value += 30 * amount;
      nutrition.protein.value += 1 * amount;
      nutrition.carbs.value += 5 * amount;
      nutrition.fats.value += 1 * amount;
      nutrition.fiber.value += 0.5 * amount;
    }
  });
  
  // Round values to 1 decimal place
  nutrition.calories.value = Math.round(nutrition.calories.value);
  nutrition.protein.value = Math.round(nutrition.protein.value * 10) / 10;
  nutrition.carbs.value = Math.round(nutrition.carbs.value * 10) / 10;
  nutrition.fats.value = Math.round(nutrition.fats.value * 10) / 10;
  nutrition.fiber.value = Math.round(nutrition.fiber.value * 10) / 10;
  
  return nutrition;
};

// Get nutrition data for common ingredients
export const getNutritionData = async () => {
  try {
    const response = await axios.get(`${API_URL}/ingredients`);
    return response.data.data;
  } catch (error) {
    console.warn('Failed to fetch nutrition data, using basic data', error);
    return basicNutritionData;
  }
};