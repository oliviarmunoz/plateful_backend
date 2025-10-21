---
timestamp: 'Tue Oct 21 2025 00:46:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_004646.b29c670b.md]]'
content_id: 9b80b9fbbdaf8a554d85261d58a51491806bae9d8cba1bb5f8b40d4ad3f3b004
---

# file: src/concepts/RestaurantMenu/RestaurantMenuConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

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
  tastePreferences: Record<string, number>;
}

export default class RestaurantMenuConcept {
  menuItems: Collection<MenuItemDocument>;
  users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
    // --- FIX START ---
    // Assuming the UserTastePreferencesConcept stores its users in a collection named "UserTastePreferences.users"
    // You must verify this exact collection name in your MongoDB instance.
    this.users = this.db.collection("UserTastePreferences.users");
    // If it's just "Users" without the prefix, then the initial code was correct and the user data isn't being inserted into that collection.
    // If it's a different prefix, adjust accordingly (e.g., "UserConcept.users" or "Authentication.users")
    // --- FIX END ---
  }

  /**
   * Add a new menu item for a restaurant.
   * Automatically creates the restaurant entry if it doesn't exist.
   */
  async addMenuItem(
    { restaurant, name, description, price }: {
      restaurant: string;
      name: string;
      description: string;
      price: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    try {
      console.log(
        `[RestaurantMenu] Adding menu item: ${name} for restaurant: ${restaurant}`,
      );

      // Check for duplicate items
      const existingMenuItem = await this.menuItems.findOne({
        restaurant,
        name,
      });
      if (existingMenuItem) {
        return {
          error:
            `Menu item '${name}' already exists for restaurant '${restaurant}'.`,
        };
      }

      // Use freshID() to create a new string-based ID as per instructions
      const newId = freshID();

      const newMenuItem: MenuItemDocument = {
        _id: newId,
        restaurant,
        name,
        description,
        price,
      };

      const result = await this.menuItems.insertOne(newMenuItem);

      if (!result.acknowledged) {
        console.error(
          "[RestaurantMenu] Insert failed: Mongo did not acknowledge insert.",
        );
        return { error: "Failed to add menu item. Please try again." };
      }

      console.log(
        `[RestaurantMenu] Successfully added menu item: ${name} (ID: ${newId})`,
      );
      return { menuItem: newMenuItem._id };
    } catch (err) {
      console.error("[RestaurantMenu.addMenuItem] Error:", err);
      return {
        error: (err as Error).message || "An unexpected error occurred.",
      };
    }
  }

  /**
   * Update Menu Item
   */
  async updateMenuItem(
    { menuItem, newDescription, newPrice }: {
      menuItem: MenuItem;
      newDescription?: string;
      newPrice?: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    const update: {
      $set: Partial<Omit<MenuItemDocument, "_id" | "restaurant" | "name">>;
    } = { $set: {} };

    if (newDescription !== undefined) update.$set.description = newDescription;
    if (newPrice !== undefined) update.$set.price = newPrice;

    if (Object.keys(update.$set).length === 0) {
      const existing = await this.menuItems.findOne({ _id: menuItem });
      if (!existing) {
        return { error: `No menu item found with ID '${menuItem}' to update.` };
      }
      return { menuItem: existing._id };
    }

    // Query using the string ID directly
    const result = await this.menuItems.findOneAndUpdate(
      { _id: menuItem },
      update,
      { returnDocument: "after" },
    );

    if (!result?.value) {
      return { error: `No menu item found with ID '${menuItem}' to update.` };
    }

    return { menuItem: result.value._id };
  }

  /**
   * Remove Menu Item
   */
  async removeMenuItem(
    { menuItem }: { menuItem: MenuItem },
  ): Promise<{ success: boolean } | { error: string }> {
    // Query using the string ID directly
    const result = await this.menuItems.deleteOne({ _id: menuItem });
    if (result.deletedCount === 0) {
      return { error: `No menu item found with ID '${menuItem}' to delete.` };
    }
    return { success: true };
  }

  /**
   * Get all menu items for a restaurant (by name)
   */
  async _getMenuItems(
    { restaurant }: { restaurant: string },
  ): Promise<
    Array<
      { menuItem: string; name: string; description: string; price: number }
    >
  > {
    const items = await this.menuItems
      .find({ restaurant })
      .project({ _id: 1, name: 1, description: 1, price: 1 })
      .toArray();

    return items.map((item) => ({
      menuItem: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
    }));
  }

  /**
   * Get details for one menu item
   */
  async _getMenuItemDetails(
    { menuItem }: { menuItem: string },
  ): Promise<Array<{ name: string; description: string; price: number }>> {
    const item = await this.menuItems.findOne({ _id: menuItem as MenuItem });
    if (!item) return [];
    return [{
      name: item.name,
      description: item.description,
      price: item.price,
    }];
  }

  /**
   * Get a dish recommendation for a user at a specific restaurant
   */
  async _getRecommendation(
    { restaurant, user }: { restaurant: string; user: ID },
  ): Promise<{ recommendation: string }[] | [{ error: string }]> {
    try {
      // --- FIX START ---
      // Runtime validation for the 'restaurant' argument
      if (typeof restaurant !== "string") {
        console.error(
          `[RestaurantMenu._getRecommendation] Invalid 'restaurant' argument: Expected string, got ${typeof restaurant}. Value:`,
          restaurant,
        );
        return [{ error: "Invalid input: 'restaurant' must be a string." }];
      }
      // --- FIX END ---

      // Step 1: Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      console.log(menu);

      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // Step 2: Fetch the user
      const userId: ID = user;
      console.log(
        `[RestaurantMenu._getRecommendation] Attempting to fetch user with ID: ${userId}`,
      ); // Added logging
      const userData = await this.users.findOne(
        { _id: userId },
        { projection: { tastePreferences: 1 } },
      );
      console.log(
        `[RestaurantMenu._getRecommendation] User data fetched:`,
        userData,
      ); // Added logging

      if (!userData) {
        // This error message is now more specific given the context of the fix
        return [{
          error:
            `User with ID '${user}' not found in the UserTastePreferences collection.`,
        }];
      }

      const preferences = userData.tastePreferences;
      if (!preferences || Object.keys(preferences).length === 0) {
        return [{ error: `User '${user}' has no defined taste preferences.` }];
      }

      // Step 3: Construct prompt
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

      // Step 4: Call Gemini
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

      // Step 5: Verify dish is on menu
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
}

```
