---
timestamp: 'Thu Oct 16 2025 21:33:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_213358.b3bdef56.md]]'
content_id: a100a2727476c5fb058e157a1fdffb57a688eee65cfa21d6f618d5191223b8e2
---

# response:

```typescript
// file: src/RestaurantMenu/RestaurantMenuConcept.test.ts

import { Collection, Db } from "npm:mongodb";
import { assertEquals, assertNotEquals, assertObjectMatch } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import RestaurantMenuConcept from "./RestaurantMenuConcept.ts"; // Adjust import path as needed

Deno.test("RestaurantMenu Concept Tests", async (test) => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  // Define some test IDs
  const restaurantA: ID = "restaurant:TheGourmet" as ID;
  const restaurantB: ID = "restaurant:PizzaPlace" as ID;

  await test.step("Principle: Up-to-date and accurate menu", async () => {
    console.log("\n--- Testing Principle: Up-to-date and accurate menu ---");

    // 1. Initial menu creation by restaurant owner
    console.log("Adding initial menu item for Restaurant A...");
    const addResult1 = await concept.addMenuItem({
      restaurant: restaurantA,
      name: "Truffle Pasta",
      description: "Handmade pasta with black truffle sauce",
      price: 28.50,
    });
    assertEquals("menuItem" in addResult1, true, "Should successfully add Truffle Pasta");
    const menuItemTrufflePasta = (addResult1 as { menuItem: ID }).menuItem;
    console.log(`Added Truffle Pasta: ${menuItemTrufflePasta}`);

    const addResult2 = await concept.addMenuItem({
      restaurant: restaurantA,
      name: "Seafood Risotto",
      description: "Creamy risotto with fresh seafood",
      price: 32.00,
    });
    assertEquals("menuItem" in addResult2, true, "Should successfully add Seafood Risotto");
    const menuItemSeafoodRisotto = (addResult2 as { menuItem: ID }).menuItem;
    console.log(`Added Seafood Risotto: ${menuItemSeafoodRisotto}`);

    console.log("Customer views initial menu for Restaurant A...");
    let menuItems = await concept._getMenuItems({ restaurant: restaurantA });
    assertEquals(menuItems.length, 2, "Should retrieve 2 menu items for Restaurant A");
    assertEquals(menuItems.some(item => item.menuItem === menuItemTrufflePasta), true, "Truffle Pasta should be in the menu");
    assertEquals(menuItems.some(item => item.menuItem === menuItemSeafoodRisotto), true, "Seafood Risotto should be in the menu");
    console.log("Customer sees initial menu correctly.");

    // 2. Restaurant owner adds a new seasonal dish
    console.log("Restaurant owner adds a new seasonal dish (Winter Salad)...");
    const addResult3 = await concept.addMenuItem({
      restaurant: restaurantA,
      name: "Winter Salad",
      description: "Seasonal greens with roasted nuts and cranberries",
      price: 18.00,
    });
    assertEquals("menuItem" in addResult3, true, "Should successfully add Winter Salad");
    const menuItemWinterSalad = (addResult3 as { menuItem: ID }).menuItem;
    console.log(`Added Winter Salad: ${menuItemWinterSalad}`);

    // 3. Restaurant owner removes an unavailable item
    console.log("Restaurant owner removes an unavailable item (Seafood Risotto)...");
    const removeResult = await concept.removeMenuItem({ menuItem: menuItemSeafoodRisotto });
    assertEquals("success" in removeResult, true, "Should successfully remove Seafood Risotto");
    assertEquals((removeResult as { success: boolean }).success, true);
    console.log(`Removed Seafood Risotto.`);

    // 4. Customer views the updated menu
    console.log("Customer views updated menu for Restaurant A...");
    menuItems = await concept._getMenuItems({ restaurant: restaurantA });
    assertEquals(menuItems.length, 2, "Should now retrieve 2 menu items (Truffle Pasta, Winter Salad)");
    assertEquals(menuItems.some(item => item.menuItem === menuItemTrufflePasta), true, "Truffle Pasta should still be in the menu");
    assertEquals(menuItems.some(item => item.menuItem === menuItemWinterSalad), true, "Winter Salad should be in the menu");
    assertEquals(menuItems.some(item => item.menuItem === menuItemSeafoodRisotto), false, "Seafood Risotto should no longer be in the menu");
    console.log("Customer sees the up-to-date menu correctly after additions and removals.");

    console.log("Principle test completed successfully: Menu is up-to-date and accurate.");
  });

  await test.step("Action: addMenuItem - Success and Failure", async () => {
    console.log("\n--- Testing addMenuItem ---");

    // Test 1: Add a new menu item successfully
    console.log("Attempting to add 'Margherita Pizza' for Restaurant B...");
    const result1 = await concept.addMenuItem({
      restaurant: restaurantB,
      name: "Margherita Pizza",
      description: "Classic tomato and mozzarella pizza",
      price: 15.00,
    });
    assertEquals("menuItem" in result1, true, "addMenuItem should return a menuItem ID on success");
    assertNotEquals((result1 as { menuItem: ID }).menuItem, undefined, "menuItem ID should not be undefined");
    const margheritaPizzaId = (result1 as { menuItem: ID }).menuItem;
    console.log(`Successfully added: ${margheritaPizzaId}`);

    // Verify state change
    const addedItem = await concept._getMenuItemDetails({ menuItem: margheritaPizzaId });
    assertEquals(addedItem.length, 1, "Should find the added menu item");
    assertObjectMatch(addedItem[0], {
      name: "Margherita Pizza",
      description: "Classic tomato and mozzarella pizza",
      price: 15.00,
    }, "Added item details should match");
    console.log("State verified: Menu item details are correct.");

    // Test 2: Fail to add an existing menu item
    console.log("Attempting to add 'Margherita Pizza' again for Restaurant B...");
    const result2 = await concept.addMenuItem({
      restaurant: restaurantB,
      name: "Margherita Pizza",
      description: "Another description",
      price: 16.00,
    });
    assertEquals("error" in result2, true, "addMenuItem should return an error if item already exists");
    assertEquals(
      (result2 as { error: string }).error,
      `Menu item 'Margherita Pizza' already exists for restaurant '${restaurantB}'.`,
      "Error message should indicate existing item",
    );
    console.log(`Correctly failed to add duplicate item: "${(result2 as { error: string }).error}"`);
  });

  await test.step("Action: updateMenuItem - Success and Failure", async () => {
    console.log("\n--- Testing updateMenuItem ---");

    // Add an item to update
    const addResult = await concept.addMenuItem({
      restaurant: restaurantB,
      name: "Pepperoni Pizza",
      description: "Pepperoni and cheese",
      price: 18.00,
    });
    const pepperoniPizzaId = (addResult as { menuItem: ID }).menuItem;
    console.log(`Added Pepperoni Pizza for update testing: ${pepperoniPizzaId}`);

    // Test 1: Update description and price
    console.log("Updating description and price of Pepperoni Pizza...");
    const updateResult1 = await concept.updateMenuItem({
      menuItem: pepperoniPizzaId,
      newDescription: "Spicy pepperoni and extra cheese",
      newPrice: 19.50,
    });
    assertEquals("menuItem" in updateResult1, true, "updateMenuItem should return menuItem ID on success");
    assertEquals((updateResult1 as { menuItem: ID }).menuItem, pepperoniPizzaId, "Returned ID should match the updated item");
    console.log("Successfully updated description and price.");

    // Verify state change
    let updatedItem = await concept._getMenuItemDetails({ menuItem: pepperoniPizzaId });
    assertEquals(updatedItem.length, 1, "Should find the updated menu item");
    assertObjectMatch(updatedItem[0], {
      name: "Pepperoni Pizza",
      description: "Spicy pepperoni and extra cheese",
      price: 19.50,
    }, "Updated item details should match");
    console.log("State verified: Item description and price are correct.");

    // Test 2: Update only description
    console.log("Updating only description of Pepperoni Pizza...");
    const updateResult2 = await concept.updateMenuItem({
      menuItem: pepperoniPizzaId,
      newDescription: "Super spicy pepperoni pizza",
    });
    assertEquals("menuItem" in updateResult2, true);
    console.log("Successfully updated only description.");

    updatedItem = await concept._getMenuItemDetails({ menuItem: pepperoniPizzaId });
    assertEquals(updatedItem.length, 1);
    assertObjectMatch(updatedItem[0], {
      name: "Pepperoni Pizza",
      description: "Super spicy pepperoni pizza",
      price: 19.50, // Price should remain unchanged
    });
    console.log("State verified: Only description updated.");

    // Test 3: Fail to update a non-existent menu item
    const nonExistentId: ID = "menuItem:nonexistent" as ID;
    console.log(`Attempting to update non-existent menu item '${nonExistentId}'...`);
    const updateResult3 = await concept.updateMenuItem({
      menuItem: nonExistentId,
      newDescription: "Fake description",
    });
    assertEquals("error" in updateResult3, true, "updateMenuItem should return an error if item does not exist");
    assertEquals(
      (updateResult3 as { error: string }).error,
      `No menu item found with ID '${nonExistentId}' to update.`,
      "Error message should indicate non-existent item",
    );
    console.log(`Correctly failed to update non-existent item: "${(updateResult3 as { error: string }).error}"`);
  });

  await test.step("Action: removeMenuItem - Success and Failure", async () => {
    console.log("\n--- Testing removeMenuItem ---");

    // Add an item to remove
    const addResult = await concept.addMenuItem({
      restaurant: restaurantB,
      name: "Veggie Pizza",
      description: "Fresh vegetables on a crispy crust",
      price: 17.00,
    });
    const veggiePizzaId = (addResult as { menuItem: ID }).menuItem;
    console.log(`Added Veggie Pizza for removal testing: ${veggiePizzaId}`);

    // Test 1: Remove an existing menu item successfully
    console.log("Attempting to remove Veggie Pizza...");
    const removeResult1 = await concept.removeMenuItem({ menuItem: veggiePizzaId });
    assertEquals("success" in removeResult1, true, "removeMenuItem should return success on success");
    assertEquals((removeResult1 as { success: boolean }).success, true, "Success should be true");
    console.log("Successfully removed Veggie Pizza.");

    // Verify state change
    const removedItem = await concept._getMenuItemDetails({ menuItem: veggiePizzaId });
    assertEquals(removedItem.length, 0, "Should not find the removed menu item");
    console.log("State verified: Menu item no longer exists.");

    // Test 2: Fail to remove a non-existent menu item
    const nonExistentId: ID = "menuItem:nonexistent2" as ID;
    console.log(`Attempting to remove non-existent menu item '${nonExistentId}'...`);
    const removeResult2 = await concept.removeMenuItem({ menuItem: nonExistentId });
    assertEquals("error" in removeResult2, true, "removeMenuItem should return an error if item does not exist");
    assertEquals(
      (removeResult2 as { error: string }).error,
      `No menu item found with ID '${nonExistentId}' to delete.`,
      "Error message should indicate non-existent item",
    );
    console.log(`Correctly failed to remove non-existent item: "${(removeResult2 as { error: string }).error}"`);
  });

  await test.step("Query: _getMenuItems", async () => {
    console.log("\n--- Testing _getMenuItems query ---");

    // Clear items for restaurant B for this test's clean state
    await concept.menuItems.deleteMany({ restaurant: restaurantB });

    // Add multiple items for Restaurant B
    const item1Result = await concept.addMenuItem({
      restaurant: restaurantB,
      name: "Pasta Carbonara",
      description: "Classic creamy pasta",
      price: 20.00,
    });
    const item1Id = (item1Result as { menuItem: ID }).menuItem;

    const item2Result = await concept.addMenuItem({
      restaurant: restaurantB,
      name: "Tiramisu",
      description: "Italian dessert",
      price: 9.00,
    });
    const item2Id = (item2Result as { menuItem: ID }).menuItem;

    console.log(`Added items for Restaurant B: ${item1Id}, ${item2Id}`);

    // Test 1: Retrieve all menu items for Restaurant B
    console.log(`Retrieving menu items for Restaurant B (${restaurantB})...`);
    const itemsB = await concept._getMenuItems({ restaurant: restaurantB });
    assertEquals(itemsB.length, 2, "Should return 2 menu items for Restaurant B");
    assertEquals(
      itemsB.some((item) => item.menuItem === item1Id),
      true,
      "Carbonara should be in the list",
    );
    assertEquals(
      itemsB.some((item) => item.menuItem === item2Id),
      true,
      "Tiramisu should be in the list",
    );
    console.log("Successfully retrieved all menu items for Restaurant B.");

    // Test 2: Retrieve menu items for a restaurant with no menu
    const nonExistentRestaurant: ID = "restaurant:Imaginary" as ID;
    console.log(`Retrieving menu items for non-existent restaurant '${nonExistentRestaurant}'...`);
    const itemsNonExistent = await concept._getMenuItems({
      restaurant: nonExistentRestaurant,
    });
    assertEquals(
      itemsNonExistent.length,
      0,
      "Should return an empty array for a restaurant with no menu items",
    );
    console.log("Successfully handled request for non-existent restaurant.");
  });

  await test.step("Query: _getMenuItemDetails", async () => {
    console.log("\n--- Testing _getMenuItemDetails query ---");

    // Add an item for detailed query
    const addResult = await concept.addMenuItem({
      restaurant: restaurantA,
      name: "Caesar Salad",
      description: "Crisp romaine, croutons, parmesan, Caesar dressing",
      price: 14.00,
    });
    const caesarSaladId = (addResult as { menuItem: ID }).menuItem;
    console.log(`Added Caesar Salad for details testing: ${caesarSaladId}`);

    // Test 1: Retrieve details for an existing menu item
    console.log(`Retrieving details for Caesar Salad (${caesarSaladId})...`);
    const details1 = await concept._getMenuItemDetails({ menuItem: caesarSaladId });
    assertEquals(details1.length, 1, "Should return one detail object");
    assertObjectMatch(details1[0], {
      name: "Caesar Salad",
      description: "Crisp romaine, croutons, parmesan, Caesar dressing",
      price: 14.00,
    }, "Details should match the added item");
    console.log("Successfully retrieved details for existing menu item.");

    // Test 2: Retrieve details for a non-existent menu item
    const nonExistentId: ID = "menuItem:fakeSalad" as ID;
    console.log(`Retrieving details for non-existent menu item '${nonExistentId}'...`);
    const details2 = await concept._getMenuItemDetails({ menuItem: nonExistentId });
    assertEquals(details2.length, 0, "Should return an empty array for a non-existent menu item");
    console.log("Successfully handled request for non-existent menu item.");
  });

  await client.close();
});
```
