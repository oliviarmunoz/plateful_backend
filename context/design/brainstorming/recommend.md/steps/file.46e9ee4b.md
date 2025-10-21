---
timestamp: 'Mon Oct 20 2025 19:34:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_193418.4fe56c18.md]]'
content_id: 46e9ee4b59d7bffb67f65ea4ca64782126928b261798cce5c60c581325223632
---

# file: src/concepts/RestaurantMenu/RestaurantMenuConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

import { Recommend } from "../../utils/recommend.ts";
import { GeminiLLM } from "../../utils/gemini-llm.ts";

/**
  concept RestaurantMenu [Restaurant]

  purpose allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices to inform their choices

  principle when a restaurant owner adds new seasonal dishes or removes unavailable items, customers can always view an up-to-date and accurate menu to inform their ordering choices

  state
   a set of MenuItems with
   a restaurant Restaurant
   a name String
   a description String
   a price Number

  actions
    addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
      requires: menu item does not exist
      effects: returns a newly created menu item with this restaurant, name, description, and price

    updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (menuItem: MenuItem)
      requires: a menu item exists
      effects: updates the description and/or price of the existing menu item and returns the updated menu item

    removeMenuItem (menuItem: menuItem): (success: Boolean)
      requires: menu item exists
      effects: returns true and deletes the menu item

    /_getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
      requires: true
      effects: returns a set of all menu items associated with the given restaurant

    /_getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
      requires: menuItem exists
      effects: returns the name, description, and price of the specified menu item

*/

// Collection prefix to ensure namespace separation
const PREFIX = "RestaurantMenu" + ".";

// Generic types
type Restaurant = ID;
type MenuItem = ID;

/**
 * state
 *   a set of MenuItems with
 *     a restaurant Restaurant
 *     a name String
 *     a description String
 *     a price Number
 */
interface MenuItemDocument {
  _id: MenuItem;
  restaurant: Restaurant;
  name: string;
  description: string;
  price: number;
}

export default class RestaurantMenuConcept {
  menuItems: Collection<MenuItemDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
  }

  /**
   * Action: Add an item to the menu
   *
   * @requires menu item does not exist
   *
   * @effects returns a newly created menu item with this restaurant, name, description, and price;
   *             or returns an error message indicating that the menu item already exists
   */
  async addMenuItem(
    { restaurant, name, description, price }: {
      restaurant: Restaurant;
      name: string;
      description: string;
      price: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    // Check if a menu item already exists
    const existingMenuItem = await this.menuItems.findOne({ restaurant, name });

    if (existingMenuItem) {
      return {
        error:
          `Menu item '${name}' already exists for restaurant '${restaurant}'.`,
      };
    }

    const newMenuItem: MenuItemDocument = {
      _id: freshID(),
      restaurant,
      name,
      description,
      price,
    };

    await this.menuItems.insertOne(newMenuItem);
    return { menuItem: newMenuItem._id };
  }

  /**
   * Action: Update an item on the menu
   *
   * @requires menu item exists
   *
   * @effects updates the description and/or price of the existing menu item and returns the updated menu item;
   *             or returns an error message indicating that no menu item exists to update
   */
  async updateMenuItem(
    { menuItem, newDescription, newPrice }: {
      menuItem: MenuItem;
      newDescription?: string;
      newPrice?: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    const filter = { _id: menuItem };
    const update: {
      $set: Partial<Omit<MenuItemDocument, "_id" | "restaurant" | "name">>;
    } = { $set: {} };

    if (newDescription !== undefined) {
      update.$set.description = newDescription;
    }
    if (newPrice !== undefined) {
      update.$set.price = newPrice;
    }

    if (Object.keys(update.$set).length === 0) {
      // No updates specified
      const existing = await this.menuItems.findOne(filter);
      if (!existing) {
        return { error: `No menu item found with ID '${menuItem}' to update.` };
      }
      return { menuItem: existing._id };
    }

    const result = await this.menuItems.findOneAndUpdate(
      filter,
      update,
      { returnDocument: "after" },
    );

    if (!result) {
      return { error: `No menu item found with ID '${menuItem}' to update.` };
    }

    return { menuItem: result._id };
  }

  /**
   * Action: Remove an item from the menu
   *
   * @requires menu item exists
   *
   * @effects returns true and deletes the menu item;
   *          or returns an error message indicating that no menu item exists to delete.
   */
  async removeMenuItem(
    { menuItem }: { menuItem: MenuItem },
  ): Promise<{ success: boolean } | { error: string }> {
    const result = await this.menuItems.deleteOne({ _id: menuItem });

    if (result.deletedCount === 0) {
      return { error: `No menu item found with ID '${menuItem}' to delete.` };
    }

    return { success: true };
  }

  /**
   * Query: get menu items
   *
   * @requires restaurant exists
   * @effects returns a set of all menu items associated with the given restaurant
   */
  async _getMenuItems(
    { restaurant }: { restaurant: Restaurant },
  ): Promise<Array<{ menuItem: MenuItem }>> {
    const items = await this.menuItems.find({ restaurant }).project({ _id: 1 })
      .toArray();
    return items.map((item) => ({ menuItem: item._id }));
  }

  /**
   * Query: get menu item details
   *
   * @requires menu Item exists
   *
   * @effects returns the name, description, and price of the specified menu item,
   *          or an empty array if not found
   */
  async _getMenuItemDetails(
    { menuItem }: { menuItem: MenuItem },
  ): Promise<Array<{ name: string; description: string; price: number }>> {
    const item = await this.menuItems.findOne({ _id: menuItem });
    if (!item) {
      return []; // Return empty array if not found
    }
    return [{
      name: item.name,
      description: item.description,
      price: item.price,
    }];
  }

  /**
   * Query: _getRecommendation (restaurant: Restaurant, user: User): (recommendation: Dish)
   *
   * @requires restaurant exists
   * @requires user exists
   *
   * @effects returns one recommended dish from the restaurant menu based on user's preferences
   */
  async _getRecommendation(
    { restaurant, user }: { restaurant: string; user: string },
  ): Promise<
    | { recommendation: string }[]
    | [{ error: string }]
  > {
    try {
      // 1️⃣ Get restaurant menu (use this.menuItems not this.menu)
      const menu = await this.menuItems.find(
        { restaurant },
        { projection: { name: 1 } },
      ).toArray();

      if (!menu.length) {
        return [{
          error: `No menu items found for restaurant '${restaurant}'.`,
        }];
      }

      // 2️⃣ Get user preferences (assuming you have a users collection)
      const usersCollection = this.db.collection("Users");
      const userData = await usersCollection.findOne(
        { _id: user },
        { projection: { tastePreferences: 1 } },
      );

      if (!userData || !userData.tastePreferences) {
        return [{ error: `User with ID '${user}' has no preferences.` }];
      }

      const preferences = userData.tastePreferences;
      // Example: { 'pasta': 5, 'salad': 2, 'spicy': 4 }

      // 3️⃣ Initialize Gemini and Recommend class
      const llm = new GeminiLLM(Deno.env.get("GEMINI_API_KEY")!);
      const recommender = new Recommend();

      // 4️⃣ Add preferences (policy)
      Object.entries(preferences).forEach(([food, rating]) =>
        recommender.addPolicy(food, rating as number)
      );

      // 5️⃣ Add menu candidates
      menu.forEach((dish: any) => recommender.addCandidate(dish.name));

      // 6️⃣ Ask Gemini for a recommendation
      const recommendedDish = await recommender.recommend(
        llm,
        "You are a helpful restaurant recommendation assistant.\n",
      );

      // 7️⃣ Return the recommendation
      return [{ recommendation: recommendedDish.name }];
    } catch (error) {
      console.error(
        "❌ Error in _getRecommendation:",
        (error as Error).message,
      );
      return [{ error: (error as Error).message }];
    }
  }
}

```
