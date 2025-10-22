---
timestamp: 'Tue Oct 21 2025 20:06:17 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_200617.c12ddc7a.md]]'
content_id: db95f3756719693053ffec57312b70dafca113a9b210478e70a034ced3d7dea2
---

# response:

Okay, I understand. The current `_getRecommendation` method assumes `tastePreferences` is a `Record<string, number>` (e.g., `spicy: 4`, `sweet: 3`), but you want to base recommendations on **liked and disliked dishes** directly.

This means we need to adjust how user preferences are stored and retrieved.

Let's break down the necessary changes:

1. **Update `UserDocument` interface:** Reflect the new structure for liked/disliked dishes.
2. **Adjust `_getRecommendation`:**
   * Fetch the new `likedDishes` and `dislikedDishes` fields.
   * Modify the LLM prompt to include this new information.
   * Handle cases where a user might not have liked/disliked dishes yet.

***

### Proposed Changes

#### 1. Update `UserDocument` Interface

We'll change `tastePreferences: Record<string, number>` to include `likedDishes` and `dislikedDishes` (assuming these are arrays of dish names or IDs). If `UserTastePreferencesConcept` is a separate concept, it *must* store this information in the `users` collection as defined here.

```typescript
// file: src/concepts/RestaurantMenu/RestaurantMenuConcept.ts

// ... (existing imports)

/**
  concept RestaurantMenu [Restaurant]

  purpose allow users to view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices

  principle when a restaurant adds or removes items, customers can always see the accurate, current menu

  state
   - a set of MenuItems with
     - a restaurantName String
     - an itemName String
     - a description String
     - a price number
*/

const PREFIX = "RestaurantMenu" + ".";

export type MenuItem = ID;

interface MenuItemDocument {
  _id: MenuItem;
  restaurant: string;
  name: string;
  description: string;
  price: number;
}

interface UserDocument {
  _id: ID;
  // Existing generic taste preferences (e.g., "spicy: 4", "sweet: 3")
  tastePreferences?: Record<string, number>; // Make optional if not always present or if we prefer liked/disliked dishes
  // NEW: Store liked and disliked dishes explicitly
  likedDishes?: string[]; // Array of dish names (or IDs, if you prefer)
  dislikedDishes?: string[]; // Array of dish names (or IDs, if you prefer)
}

export default class RestaurantMenuConcept {
  // ... (rest of the class remains the same for now)
}
```

#### 2. Modify `_getRecommendation` Method

This is where most of the logic changes will occur. We'll fetch the `likedDishes` and `dislikedDishes` and incorporate them into the prompt.

```typescript
// file: src/concepts/RestaurantMenu/RestaurantMenuConcept.ts

// ... (existing code up to the _getRecommendation method)

  /**
   * Get a dish recommendation for a user at a specific restaurant
   */
  async _getRecommendation(
    { restaurant, user }: { restaurant: string; user: ID },
  ): Promise<{ recommendation: string }[] | [{ error: string }]> {
    try {
      // Runtime validation for the 'restaurant' argument
      if (typeof restaurant !== "string") {
        console.error(
          `[RestaurantMenu._getRecommendation] Invalid 'restaurant' argument: Expected string, got ${typeof restaurant}. Value:`,
          restaurant,
        );
        return [{ error: "Invalid input: 'restaurant' must be a string." }];
      }

      // Step 1: Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      console.log(
        `[RestaurantMenu._getRecommendation] Menu for '${restaurant}':`,
        menu.map((item) => item.name),
      );

      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Step 2: Fetch the user's taste preferences, including liked/disliked dishes
      const userId: ID = user;
      console.log(
        `[RestaurantMenu._getRecommendation] Attempting to fetch user with ID: ${userId}`,
      );
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { tastePreferences: 1, likedDishes: 1, dislikedDishes: 1 } }, // IMPORTANT: Add likedDishes and dislikedDishes here
      );
      console.log(
        `[RestaurantMenu._getRecommendation] User data fetched:`,
        userData,
      );

      if (!userData) {
        return [{
          error:
            `User with ID '${user}' not found in the UserTastePreferences collection.`,
        }];
      }

      // Extract new preferences
      const preferences = userData.tastePreferences || {};
      const likedDishes = userData.likedDishes || [];
      const dislikedDishes = userData.dislikedDishes || [];

      // --- NEW LOGIC FOR NO PREFERENCES ---
      // If user has no preferences (generic or liked/disliked), return a generic recommendation
      if (
        Object.keys(preferences).length === 0 &&
        likedDishes.length === 0 &&
        dislikedDishes.length === 0
      ) {
        console.log(
          `[RestaurantMenu._getRecommendation] User '${user}' has no defined taste preferences, liked, or disliked dishes. Returning first menu item as generic recommendation.`,
        );
        return [{ recommendation: menu[0].name }];
      }
      // --- END NEW LOGIC ---

      // Step 3: Construct prompt with user preferences and liked/disliked dishes
      let preferencesText = "";
      if (Object.keys(preferences).length > 0) {
        preferencesText = "USER GENERAL PREFERENCES:\n" +
          Object.entries(preferences)
            .map(([trait, score]) => `- ${trait}: ${score}/5`)
            .join("\n");
      }

      let likedDishesText = "";
      if (likedDishes.length > 0) {
        likedDishesText = "USER LIKED DISHES (recommend similar):\n" +
          likedDishes.map((dish) => `- ${dish}`).join("\n");
      }

      let dislikedDishesText = "";
      if (dislikedDishes.length > 0) {
        dislikedDishesText = "USER DISLIKED DISHES (do NOT recommend these or similar):\n" +
          dislikedDishes.map((dish) => `- ${dish}`).join("\n");
      }

      const menuText = "AVAILABLE MENU ITEMS:\n" + menu
        .map((dish) => `- ${dish.name}: ${dish.description}`)
        .join("\n");

      // Combine all parts of the prompt
      const prompt = `
You are a restaurant recommendation assistant.

${preferencesText ? preferencesText + "\n\n" : ""}
${likedDishesText ? likedDishesText + "\n\n" : ""}
${dislikedDishesText ? dislikedDishesText + "\n\n" : ""}
${menuText}

Based on the user's preferences, liked dishes, and disliked dishes, choose ONE dish from the AVAILABLE MENU ITEMS that best matches the user's taste.
It is CRUCIAL that you DO NOT recommend any dish that is similar to the user's DISLIKED DISHES.
Respond only in JSON format:
{"recommendation": "<exact dish name from the menu>"}
`.trim();

      // Step 4: Call Gemini
      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) {
        return [{ error: "Missing GEMINI_API_KEY environment variable." }];
      }

      const llm = new GeminiLLM({ apiKey });
      console.log(
        `[RestaurantMenu._getRecommendation] Calling LLM with prompt for user '${user}'...`,
      );
      const llmResponse = await llm.executeLLM(prompt);
      console.log(
        `[RestaurantMenu._getRecommendation] LLM raw response: ${
          llmResponse.substring(0, 100)
        }...`,
      );

      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [{ error: "Failed to parse LLM response as JSON." }];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendation = parsed?.recommendation?.trim();

      if (!recommendation) {
        return [{ error: "LLM did not return a valid recommendation." }];
      }

      // Step 5: Verify dish is on menu
      const match = menu.find(
        (dish) => dish.name.toLowerCase() === recommendation.toLowerCase(),
      );

      if (!match) {
        // Log the full menu for debugging if the LLM recommends an invalid dish
        console.error(
          `[RestaurantMenu._getRecommendation] LLM recommended an unknown dish: '${recommendation}'. Menu items: ${
            menu.map((item) => item.name).join(", ")
          }`,
        );
        return [{
          error: `The recommended dish '${recommendation}' is not on the menu.`,
        }];
      }

      console.log(
        `[RestaurantMenu._getRecommendation] Recommended dish for user '${user}': ${match.name}`,
      );
      return [{ recommendation: match.name }];
    } catch (err) {
      console.error("[RestaurantMenu._getRecommendation] Error:", err);
      return [{ error: (err as Error).message }];
    }
  }
}
```

***

### Explanation of Changes:

1. **`UserDocument` Interface:**
   * Added `likedDishes?: string[]` and `dislikedDishes?: string[]`. I've made `tastePreferences` optional as well, as you might primarily use liked/disliked moving forward.
   * **Crucially:** The `UserTastePreferencesConcept` (which owns the `users` collection) must be updated to store this `likedDishes` and `dislikedDishes` information in the user documents. If it's not, then even with these changes, the data won't be retrieved.

2. **`_getRecommendation` Method:**
   * **Projection in `findOne`:** Modified the `this.users.findOne` call to explicitly project `likedDishes` and `dislikedDishes` in addition to `tastePreferences`.
   * **Extraction:** Extracted `likedDishes` and `dislikedDishes` from `userData`, providing empty arrays as defaults if they don't exist.
   * **Combined No Preferences Check:** The `if (!preferences || Object.keys(preferences).length === 0)` condition was expanded to also check if `likedDishes` and `dislikedDishes` are empty, providing a more robust fallback for users with no recorded preferences.
   * **Dynamic Prompt Construction:**
     * Separate `preferencesText`, `likedDishesText`, and `dislikedDishesText` variables are created.
     * These are only included in the final `prompt` string if they actually contain data, making the prompt cleaner when a user has only some types of preferences.
     * The prompt explicitly instructs the LLM to recommend similar dishes to liked ones and *not* to recommend disliked ones or similar dishes. This is key for the LLM to use the new information effectively.

These changes will allow the `RestaurantMenuConcept` to fetch and utilize explicit liked and disliked dish information when generating recommendations via the LLM. Remember to ensure that the `UserTastePreferencesConcept` (or wherever `users` data is managed) actually stores this new `likedDishes` and `dislikedDishes` data in the `UserTastePreferences.users` collection for these changes to have an effect.
