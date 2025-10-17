---
timestamp: 'Thu Oct 16 2025 21:21:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_212152.7c4f8047.md]]'
content_id: a025485607834ea1b058a2b03b90cdd1d36064af34d559c684aba5cef07025a7
---

# response:

To implement the `RestaurantMenu` concept using TypeScript, we'll create a class that manages the state (the collection of menu items) and provides methods corresponding to the specified actions and queries.

We will define:

* **Type Aliases**: For `Restaurant` and `MenuItem` to represent opaque identifiers, as suggested by the concept design.
* **Internal Data Structure**: To hold the details of each menu item.
* **`RestaurantMenu` Class**: This class will encapsulate the concept's state and provide its behaviors (actions and queries).

```typescript
// --- 1. Define Opaque Type Parameters ---
// As per concept design, Restaurant and MenuItem are generic type parameters,
// treated polymorphically as identities (references). We use strings for this.
type RestaurantId = string;
type MenuItemId = string;

// --- 2. Internal State Representation for MenuItem ---
// This interface defines the structure of a menu item stored internally by the concept.
interface MenuItemData {
  id: MenuItemId;           // Unique identifier for the menu item
  restaurantId: RestaurantId; // The restaurant this item belongs to
  name: string;             // Name of the dish
  description: string;      // Description of the dish
  price: number;            // Price of the dish
}

// --- 3. The RestaurantMenu Concept Implementation ---
class RestaurantMenu {
  // The concept's state: a Map to store MenuItemData, keyed by MenuItemId for efficient lookup.
  private menuItems: Map<MenuItemId, MenuItemData> = new Map();

  // Helper to generate unique IDs for new menu items.
  // In a real backend, this would typically be a UUID or database-generated ID.
  private generateId(): MenuItemId {
    return `menuitem-${Math.random().toString(36).substring(2, 15)}`;
  }

  // Helper to find a menu item by its restaurant and name, for uniqueness checks.
  private findMenuItemByName(restaurantId: RestaurantId, name: string): MenuItemData | undefined {
    for (const item of this.menuItems.values()) {
      if (item.restaurantId === restaurantId && item.name === name) {
        return item;
      }
    }
    return undefined;
  }

  // --- Concept Actions ---

  /**
   * Action: addMenuItem
   * Purpose: Adds a new menu item to a restaurant's menu.
   *
   * @param restaurantId The ID of the restaurant.
   * @param name The name of the menu item.
   * @param description The description of the menu item.
   * @param price The price of the menu item.
   * @returns An object with `menuItem: MenuItemId` on success, or `error: string` if the item already exists.
   */
  addMenuItem(
    restaurantId: RestaurantId,
    name: string,
    description: string,
    price: number
  ): { menuItem: MenuItemId } | { error: string } {
    // Requires: menu item does not exist (uniqueness by restaurantId and name)
    if (this.findMenuItemByName(restaurantId, name)) {
      return { error: `Menu item '${name}' already exists for restaurant '${restaurantId}'.` };
    }

    const newItemId = this.generateId();
    const newItem: MenuItemData = {
      id: newItemId,
      restaurantId,
      name,
      description,
      price,
    };
    this.menuItems.set(newItemId, newItem);

    // Effects: returns a newly created menu item ID.
    // The successful return is a non-empty dictionary as per concept design rules for overloaded actions.
    return { menuItem: newItemId };
  }

  /**
   * Action: updateMenuItem
   * Purpose: Updates the description and/or price of an existing menu item.
   *
   * @param menuItemId The ID of the menu item to update.
   * @param newDescription The new description (optional, if undefined, keeps current).
   * @param newPrice The new price (optional, if undefined, keeps current).
   * @returns An object with `menuItem: MenuItemId` on success, or `error: string` if the item does not exist.
   */
  updateMenuItem(
    menuItemId: MenuItemId,
    newDescription?: string, // Make optional
    newPrice?: number        // Make optional
  ): { menuItem: MenuItemId } | { error: string } {
    const existingItem = this.menuItems.get(menuItemId);

    // Requires: a menu item exists
    if (!existingItem) {
      return { error: `No menu item found with ID '${menuItemId}' to update.` };
    }

    // Effects: updates the description and/or price
    if (newDescription !== undefined) {
      existingItem.description = newDescription;
    }
    if (newPrice !== undefined) {
      existingItem.price = newPrice;
    }
    // No need to explicitly 'set' back into the Map for object references.

    // Returns the ID of the updated menu item.
    return { menuItem: menuItemId };
  }

  /**
   * Action: removeMenuItem
   * Purpose: Deletes a menu item from the menu.
   *
   * @param menuItemId The ID of the menu item to remove.
   * @returns An object with `success: boolean` on success, or `error: string` if the item does not exist.
   */
  removeMenuItem(menuItemId: MenuItemId): { success: boolean } | { error: string } {
    // Requires: menu item exists
    if (!this.menuItems.has(menuItemId)) {
      return { error: `No menu item found with ID '${menuItemId}' to delete.` };
    }

    // Effects: returns true and deletes the menu item
    this.menuItems.delete(menuItemId);
    return { success: true }; // Non-empty dictionary
  }

  // --- Concept Queries ---

  /**
   * Query: _getMenuItems
   * Purpose: Retrieves all menu item IDs for a specific restaurant.
   *
   * @param restaurantId The ID of the restaurant.
   * @returns An object with `menuItems: MenuItemId[]` containing IDs of all items for the restaurant.
   */
  _getMenuItems(restaurantId: RestaurantId): { menuItems: MenuItemId[] } {
    // Requires: true (always callable)
    const items: MenuItemId[] = [];
    for (const item of this.menuItems.values()) {
      if (item.restaurantId === restaurantId) {
        items.push(item.id);
      }
    }
    // Effects: returns a set of all menu item IDs associated with the given restaurant
    return { menuItems: items };
  }

  /**
   * Query: _getMenuItemDetails
   * Purpose: Retrieves the name, description, and price of a specific menu item.
   *
   * @param menuItemId The ID of the menu item.
   * @returns An object with `name`, `description`, and `price` on success, or `error: string` if not found.
   */
  _getMenuItemDetails(
    menuItemId: MenuItemId
  ): { name: string; description: string; price: number } | { error: string } {
    const item = this.menuItems.get(menuItemId);

    // Requires: menuItem exists
    if (!item) {
      return { error: `Menu item with ID '${menuItemId}' not found.` };
    }

    // Effects: returns the name, description, and price
    return { name: item.name, description: item.description, price: item.price };
  }
}

// --- Example Usage and Demonstration ---
console.log("--- Initializing RestaurantMenu Concept ---");
const restaurantMenu = new RestaurantMenu();

const restaurantA_id: RestaurantId = "restaurant-ABC";
const restaurantB_id: RestaurantId = "restaurant-XYZ";

console.log("\n--- Adding Menu Items ---");
const burgerResult = restaurantMenu.addMenuItem(restaurantA_id, "Classic Burger", "A juicy beef patty with lettuce and tomato", 12.50);
console.log("Added 'Classic Burger':", burgerResult);

const stirFryResult = restaurantMenu.addMenuItem(restaurantA_id, "Veggie Stir-Fry", "Fresh seasonal vegetables wok-fried with tofu", 15.00);
console.log("Added 'Veggie Stir-Fry':", stirFryResult);

const pizzaResult = restaurantMenu.addMenuItem(restaurantB_id, "Margherita Pizza", "Classic Neapolitan pizza with tomato and mozzarella", 18.00);
console.log("Added 'Margherita Pizza' for Restaurant B:", pizzaResult);

const duplicateBurgerResult = restaurantMenu.addMenuItem(restaurantA_id, "Classic Burger", "Another description", 13.00);
console.log("Attempted to add duplicate 'Classic Burger':", duplicateBurgerResult); // Expected: error

let classicBurgerId: MenuItemId | undefined;
if ('menuItem' in burgerResult) {
  classicBurgerId = burgerResult.menuItem;
}

console.log("\n--- Querying Menu Items for Restaurant A ---");
if (classicBurgerId) {
  const itemsForA = restaurantMenu._getMenuItems(restaurantA_id);
  console.log(`Menu Items for ${restaurantA_id}:`, itemsForA);

  const burgerDetails = restaurantMenu._getMenuItemDetails(classicBurgerId);
  console.log(`Details for '${classicBurgerId}':`, burgerDetails);
}

console.log("\n--- Updating a Menu Item ---");
if (classicBurgerId) {
  const updateResult = restaurantMenu.updateMenuItem(classicBurgerId, "A mouth-watering beef patty with fresh toppings", 13.99);
  console.log("Updated 'Classic Burger':", updateResult);

  const updatedBurgerDetails = restaurantMenu._getMenuItemDetails(classicBurgerId);
  console.log("Updated 'Classic Burger' Details:", updatedBurgerDetails);
}

const nonExistentUpdateResult = restaurantMenu.updateMenuItem("non-existent-item-id", "new desc", 99.99);
console.log("Attempted to update non-existent item:", nonExistentUpdateResult); // Expected: error

console.log("\n--- Removing a Menu Item ---");
if (classicBurgerId) {
  const removeResult = restaurantMenu.removeMenuItem(classicBurgerId);
  console.log("Removed 'Classic Burger':", removeResult);

  const checkRemoved = restaurantMenu._getMenuItemDetails(classicBurgerId);
  console.log("Checked removed 'Classic Burger':", checkRemoved); // Expected: error
}

const removeNonExistentResult = restaurantMenu.removeMenuItem("another-non-existent-id");
console.log("Attempted to remove non-existent item:", removeNonExistentResult); // Expected: error

console.log("\n--- Querying Menu Items for Restaurant A After Removal ---");
const itemsForAAfterRemoval = restaurantMenu._getMenuItems(restaurantA_id);
console.log(`Menu Items for ${restaurantA_id} (after removal):`, itemsForAAfterRemoval); // Expected: only 'Veggie Stir-Fry' remaining
```
