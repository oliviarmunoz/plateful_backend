---
timestamp: 'Thu Oct 16 2025 21:23:48 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_212348.f5e20169.md]]'
content_id: ae05a7584984b9af74274873df5d7a7d07c7ceb72bcbd9c95d4eeadc9920aa39
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
 * concept RestaurantMenu [Restaurant]
 *
 * purpose allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes,
 * descriptions, and prices to inform their choices
 *
 * principle when a restaurant owner adds new seasonal dishes or removes unavailable items,
 * customers can always view an up-to-date and accurate menu to inform their ordering choices
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
   * addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
   * addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (error: String)
   *
   * **requires** menu item does not exist (identified by restaurant and name)
   *
   * **effects** returns a newly created menu item with this restaurant, name, description, and price;
   *             or returns an error message indicating that the menu item already exists.
   */
  async addMenuItem(
    { restaurant, name, description, price }: {
      restaurant: Restaurant;
      name: string;
      description: string;
      price: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    // Check if a menu item with the same restaurant and name already exists
    const existingMenuItem = await this.menuItems.findOne({ restaurant, name });

    if (existingMenuItem) {
      return {
        error: `Menu item '${name}' already exists for restaurant '${restaurant}'.`,
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
   * updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (menuItem: MenuItem)
   * updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (error: String)
   *
   * **requires** a menu item exists with the given menuItem ID
   *
   * **effects** updates the description and/or price of the existing menu item and returns the updated menu item;
   *             or returns an error message indicating that no menu item exists to update.
   */
  async updateMenuItem(
    { menuItem, newDescription, newPrice }: {
      menuItem: MenuItem;
      newDescription?: string;
      newPrice?: number;
    },
  ): Promise<{ menuItem: MenuItem } | { error: string }> {
    const filter = { _id: menuItem };
    const update: { $set: Partial<Omit<MenuItemDocument, "_id" | "restaurant" | "name">> } = { $set: {} };

    if (newDescription !== undefined) {
      update.$set.description = newDescription;
    }
    if (newPrice !== undefined) {
      update.$set.price = newPrice;
    }

    if (Object.keys(update.$set).length === 0) {
      // No updates specified, return the existing item if it exists
      const existing = await this.menuItems.findOne(filter);
      if (!existing) {
        return { error: `No menu item found with ID '${menuItem}' to update.` };
      }
      return { menuItem: existing._id };
    }

    const result = await this.menuItems.findOneAndUpdate(
      filter,
      update,
      { returnDocument: "after" }, // Return the updated document
    );

    if (!result) {
      return { error: `No menu item found with ID '${menuItem}' to update.` };
    }

    return { menuItem: result._id };
  }

  /**
   * removeMenuItem (menuItem: menuItem): (success: Boolean)
   * removeMenuItem (menuItem: menuItem): (error: String)
   *
   * **requires** menu item exists with the given menuItem ID
   *
   * **effects** returns true and deletes the menu item;
   *             or returns an error message indicating that no menu item exists to delete.
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
   * _getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
   *
   * **requires** true
   *
   * **effects** returns a set of all menu items associated with the given restaurant (just their IDs)
   */
  async _getMenuItems(
    { restaurant }: { restaurant: Restaurant },
  ): Promise<Array<{ menuItem: MenuItem }>> {
    const items = await this.menuItems.find({ restaurant }).project({ _id: 1 }).toArray();
    return items.map((item) => ({ menuItem: item._id }));
  }

  /**
   * _getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
   *
   * **requires** menuItem exists
   *
   * **effects** returns the name, description, and price of the specified menu item,
   *             or an empty array if not found.
   */
  async _getMenuItemDetails(
    { menuItem }: { menuItem: MenuItem },
  ): Promise<Array<{ name: string; description: string; price: number }>> {
    const item = await this.menuItems.findOne({ _id: menuItem });
    if (!item) {
      return []; // Return empty array if not found, as per query return spec
    }
    return [{ name: item.name, description: item.description, price: item.price }];
  }
}
```
