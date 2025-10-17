import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

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
}
