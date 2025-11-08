import { GeminiLLM } from "@utils/gemini-llm.ts";
import { ID } from "@utils/types.ts";

/**
   * Query: Get a dish recommendation for a user at a specific restaurant
   * @requires a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
   * @effects returns the name of a menu item from the specified restaurant that is recommended for the user
   *          via an LLM, based on their taste preferences and the current menu items.
   *          If no specific preferences are found, a generic recommendation may be provided.
   */
  const getRecommendation(
    { restaurant, user }: { restaurant: string; user: ID },
  ): Promise<{ recommendation: string }[] | [{ error: string }]> {
    try {
      // Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Fetch the user's taste preferences
      const userId: ID = user;
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { likedDishes: 1, dislikedDishes: 1 } },
      );

      if (!userData) {
        return [{
          error:
            `User with ID '${user}' not found in the UserTastePreferences collection.`,
        }];
      }

      // Constructing preferences from likedDishes and dislikedDishes (for the LLM prompt)
      const preferences: Record<string, number> = {};
      if (userData.likedDishes) {
        userData.likedDishes.forEach((dish) => {
          preferences[`Likes: ${dish}`] = 5;
        });
      }
      if (userData.dislikedDishes) {
        userData.dislikedDishes.forEach((dish) => {
          preferences[`Dislikes: ${dish}`] = 1;
        });
      }

      if (Object.keys(preferences).length === 0) {
        // return first menu item if no preferences
        return [{ recommendation: menu[0].name }];
      }

      // Construct prompt with user preferences
      const preferencesText = Object.entries(preferences)
        .map(([trait, score]) => `${trait}: ${score}/5`)
        .join("\n");

      const menuText = menu
        .map((dish) => `- ${dish.name}: ${dish.description}`)
        .join("\n");

      const prompt = `
You are a restaurant recommendation assistant.

USER PREFERENCES:
${preferencesText}

MENU ITEMS:
${menuText}

From the above menu, choose ONE dish that best matches the user's preferences.
Respond only in JSON format:
{"recommendation": "<exact dish name>"}
`.trim();
      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) {
        return [{ error: "Missing GEMINI_API_KEY environment variable." }];
      }

      const llm = new GeminiLLM({ apiKey });
      const llmResponse = await llm.executeLLM(prompt);

      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [{ error: "Failed to parse LLM response as JSON." }];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendation = parsed?.recommendation?.trim();

      if (!recommendation) {
        return [{ error: "LLM did not return a valid recommendation." }];
      }

      // VALIDATION

      // Verify dish is on menu
      const match = menu.find(
        (dish) => dish.name.toLowerCase() === recommendation.toLowerCase(),
      );

      if (!match) {
        return [{
          error: `The recommended dish '${recommendation}' is not on the menu.`,
        }];
      }
      return [{ recommendation: match.name }];
    } catch (err) {
      console.error("[RestaurantMenu._getRecommendation] Error:", err);
      return [{ error: (err as Error).message }];
    }
  }
