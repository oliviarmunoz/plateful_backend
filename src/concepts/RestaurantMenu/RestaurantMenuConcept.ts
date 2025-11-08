import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

/**
  concept RestaurantMenu [Restaurant, User]

  purpose allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes to inform their choices and receive personalized recommendations

  principle when a restaurant owner adds new dishes or removes unavailable ones, customers can always view an up-to-date menu to get a dish recommendation tailored to their preferences.

  state
  a set of MenuItems with
    a restaurant Restaurant
    a name String
    a description String
    a price Number

  actions
    addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
      requires: menu item with the given name does not already exist for this restaurant
      effects: returns a newly created menu item with this restaurant, name, description, and price

    updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (menuItem: MenuItem)
      requires: a menu item with the given ID exists
      effects: updates the description and/or price of the existing menu item and returns the updated menu item

    removeMenuItem (menuItem: MenuItem): (success: Boolean)
      requires: menu item with the given ID exists
      effects: returns true and deletes the menu item

    /getRecommendation (restaurant: Restaurant, user: User): (recommendation: String)
      requires: a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
      effects: returns the name of a menu item from the specified restaurant that is recommended for the user via an LLM,
      based on their taste preferences and the current menu items. If no specific preferences are found, a generic recommendation is provided.

    /_getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
      requires: true
      effects: returns a set of all menu items associated with the given restaurant, including their name, description, and price

    /_getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
      requires: menuItem with the given ID exists
      effects: returns the name, description, and price of the specified menu item

    /_getMenuItemByName (name: String): (menuItem: MenuItem)
      requires: menu item with the given name exists
      effects: returns the menu item with the given name

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
  likedDishes?: string[];
  dislikedDishes?: string[];
}

export default class RestaurantMenuConcept {
  menuItems: Collection<MenuItemDocument>;
  users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
    this.users = this.db.collection("UserTastePreferences.users");
  }

  /**
   * Action: Add a new menu item for a restaurant
   * @requires menu item with the given name does not already exist for this restaurant
   * @effects returns a newly created menu item with this restaurant, name, description, and price
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
        return { error: "Failed to add menu item. Please try again." };
      }
      return { menuItem: newMenuItem._id };
    } catch (err) {
      return {
        error: (err as Error).message || "An unexpected error occurred.",
      };
    }
  }

  /**
   * Action: Update Menu Item
   * @requires a menu item with the given ID exists
   * @effects updates the description and/or price of the existing menu item and returns the updated menu item
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

    if (!result) {
      return { error: `No menu item found with ID '${menuItem}' to update.` };
    }

    return { menuItem: result._id };
  }

  /**
   * Action: Remove Menu Item
   * @requires menu item with the given ID exists
   * @effects returns true and deletes the menu item
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
   * Get a dish recommendation for a user at a specific restaurant
   * @requires a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
   * @effects returns the name of a menu item from the specified restaurant that is recommended for the user
   *          via an LLM, based on their taste preferences and the current menu items.
   *          If no specific preferences are found, a generic recommendation may be provided.
   */
  async getRecommendation(
    { restaurant, userLikedDishes, userDislikedDishes }: {
      restaurant: ID;
      userLikedDishes: string[];
      userDislikedDishes: string[];
    },
  ): Promise<{ recommendation: string } | { error: string }> {
    try {
      // get the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      if (!menu.length) {
        return {
          error: `No menu items found for restaurant '${restaurant}'.`,
        };
      }

      // construct prompt with user preferences
      const likedText = userLikedDishes.map((dish) => `Likes: ${dish}`).join(
        "\n",
      );
      const dislikedText = userDislikedDishes.map((dish) => `Dislikes: ${dish}`)
        .join("\n");
      const preferencesText = [likedText, dislikedText].join("\n");

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
        return { error: "Missing GEMINI_API_KEY environment variable." };
      }

      const llm = new GeminiLLM({ apiKey });
      const llmResponse = await llm.executeLLM(prompt);

      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { error: "Failed to parse LLM response as JSON." };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendation = parsed?.recommendation?.trim();

      if (!recommendation) {
        return { error: "LLM did not return a valid recommendation." };
      }

      // VALIDATION
      // Verify dish is on menu
      const match = menu.find(
        (dish) => dish.name.toLowerCase() === recommendation.toLowerCase(),
      );

      if (!match) {
        return {
          error: `The recommended dish '${recommendation}' is not on the menu.`,
        };
      }
      return { recommendation: match.name };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  /**
   * Query: Get all menu items for a restaurant (by name)
   * @requires
   * @effects returns a set of all menu items associated with the given restaurant, including their name, description, and price
   */
  async _getMenuItems(
    { restaurant }: { restaurant: ID },
  ): Promise<
    Array<
      { menuItem: MenuItem; name: string; description: string; price: number }
    >
  > {
    const items = await this.menuItems.find({ restaurant }).toArray();
    return items.map((item) => ({
      menuItem: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
    }));
  }

  /**
   * Query: Get details for one menu item
   * @requires menuItem with the given ID exists
   * @effects returns the name, description, and price of the specified menu item
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
   * @requires menu item with the given name exists
   * @effects returns the menu item with the given name
   * @returns
   */
  async _getMenuItemByName(
    { name }: { name: string },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    const item = await this.menuItems.findOne({ name });
    if (!item) return { error: `No menu item found with name '${name}'.` };
    return { menuItem: item._id };
  }
}
