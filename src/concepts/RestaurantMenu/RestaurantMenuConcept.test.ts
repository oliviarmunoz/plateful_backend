import {
  assertEquals,
  assertNotEquals,
  assertObjectMatch,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import RestaurantMenuConcept from "./RestaurantMenuConcept.ts";

Deno.test("Principle Test: Up-to-date and accurate menu", async () => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  const restaurantA: ID = "restaurant:TheGourmet" as ID;

  // 1. Initial menu creation by restaurant owner
  console.log("Adding initial menu items for Restaurant...");
  const addResult1 = await concept.addMenuItem({
    restaurant: restaurantA,
    name: "Truffle Pasta",
    description: "Handmade pasta with black truffle sauce",
    price: 28.50,
  });
  assertEquals(
    "menuItem" in addResult1,
    true,
    "Should successfully add Truffle Pasta",
  );
  const menuItemTrufflePasta = (addResult1 as { menuItem: ID }).menuItem;

  const addResult2 = await concept.addMenuItem({
    restaurant: restaurantA,
    name: "Seafood Risotto",
    description: "Creamy risotto with fresh seafood",
    price: 32.00,
  });
  assertEquals(
    "menuItem" in addResult2,
    true,
    "Should successfully add Seafood Risotto",
  );
  const menuItemSeafoodRisotto = (addResult2 as { menuItem: ID }).menuItem;
  console.log(`Successfully added menu items.`);

  console.log("Viewing menu items...");
  let menuItems = await concept._getMenuItems({ restaurant: restaurantA });
  assertEquals(
    menuItems.length,
    2,
    "Should retrieve 2 menu items for Restaurant A",
  );
  assertEquals(
    menuItems.some((item) => item.menuItem === menuItemTrufflePasta),
    true,
    "Truffle Pasta should be in the menu",
  );
  assertEquals(
    menuItems.some((item) => item.menuItem === menuItemSeafoodRisotto),
    true,
    "Seafood Risotto should be in the menu",
  );
  console.log("Menu viewed successfully.");

  // 2. Restaurant owner adds a new dish
  console.log("Adding a new menu item...");
  const addResult3 = await concept.addMenuItem({
    restaurant: restaurantA,
    name: "Winter Salad",
    description: "Seasonal greens with roasted nuts and cranberries",
    price: 18.00,
  });
  assertEquals(
    "menuItem" in addResult3,
    true,
    "Should successfully add Winter Salad",
  );
  const menuItemWinterSalad = (addResult3 as { menuItem: ID }).menuItem;
  console.log("Successfully added new menu item.");

  // 3. Restaurant owner removes an unavailable item
  console.log("Removing menu item...");
  const removeResult = await concept.removeMenuItem({
    menuItem: menuItemSeafoodRisotto,
  });
  assertEquals(
    "success" in removeResult,
    true,
    "Should successfully remove Seafood Risotto",
  );
  assertEquals((removeResult as { success: boolean }).success, true);
  console.log(`Successfully removed menu item. `);

  // 4. Customer views the updated menu
  console.log("Viewing updated menu...");
  menuItems = await concept._getMenuItems({ restaurant: restaurantA });
  assertEquals(
    menuItems.length,
    2,
    "Should now retrieve 2 menu items (Truffle Pasta, Winter Salad)",
  );
  assertEquals(
    menuItems.some((item) => item.menuItem === menuItemTrufflePasta),
    true,
    "Truffle Pasta should still be in the menu",
  );
  assertEquals(
    menuItems.some((item) => item.menuItem === menuItemWinterSalad),
    true,
    "Winter Salad should be in the menu",
  );
  assertEquals(
    menuItems.some((item) => item.menuItem === menuItemSeafoodRisotto),
    false,
    "Seafood Risotto should no longer be in the menu",
  );
  console.log("Successfully viewed (correct) menu.");
  await client.close();
});

Deno.test("Action: addMenuItem - Success and Failure", async () => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  const restaurantB: ID = "restaurant:PizzaPlace" as ID;

  // Test 1: Add a new menu item successfully
  console.log("Adding menu item...");
  const result1 = await concept.addMenuItem({
    restaurant: restaurantB,
    name: "Margherita Pizza",
    description: "Classic tomato and mozzarella pizza",
    price: 15.00,
  });
  assertEquals(
    "menuItem" in result1,
    true,
    "addMenuItem should return a menuItem ID on success",
  );
  assertNotEquals(
    (result1 as { menuItem: ID }).menuItem,
    undefined,
    "menuItem ID should not be undefined",
  );
  const margheritaPizzaId = (result1 as { menuItem: ID }).menuItem;
  console.log(`Successfully added: ${margheritaPizzaId}`);

  // Verify state change
  console.log("Viewing new menu...");
  const addedItem = await concept._getMenuItemDetails({
    menuItem: margheritaPizzaId,
  });
  assertEquals(addedItem.length, 1, "Should find the added menu item");
  assertObjectMatch(addedItem[0], {
    name: "Margherita Pizza",
    description: "Classic tomato and mozzarella pizza",
    price: 15.00,
  }, "Added item details should match");
  console.log("Successfully viewed (correct) menu.");

  // Test 2: Fail to add an existing menu item
  console.log("Adding the same menu item...");
  const result2 = await concept.addMenuItem({
    restaurant: restaurantB,
    name: "Margherita Pizza",
    description: "Another description",
    price: 16.00,
  });
  assertEquals(
    "error" in result2,
    true,
    "addMenuItem should return an error if item already exists",
  );
  assertEquals(
    (result2 as { error: string }).error,
    `Menu item 'Margherita Pizza' already exists for restaurant '${restaurantB}'.`,
    "Error message should indicate existing item",
  );
  console.log(`Successfully threw error message.`);
  await client.close();
});

Deno.test("Action: updateMenuItem - Success and Failure", async () => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  const restaurantB: ID = "restaurant:PizzaPlace" as ID;

  // Add an item to update
  console.log("Adding menu item...");
  const addResult = await concept.addMenuItem({
    restaurant: restaurantB,
    name: "Pepperoni Pizza",
    description: "Pepperoni and cheese",
    price: 18.00,
  });
  const pepperoniPizzaId = (addResult as { menuItem: ID }).menuItem;
  console.log(
    `Added Pepperoni Pizza for update testing: ${pepperoniPizzaId}`,
  );

  // Test 1: Update description and price
  console.log("Updating menu item...");
  const updateResult1 = await concept.updateMenuItem({
    menuItem: pepperoniPizzaId,
    newDescription: "Spicy pepperoni and extra cheese",
    newPrice: 19.50,
  });
  assertEquals(
    "menuItem" in updateResult1,
    true,
    "updateMenuItem should return menuItem ID on success",
  );
  assertEquals(
    (updateResult1 as { menuItem: ID }).menuItem,
    pepperoniPizzaId,
    "Returned ID should match the updated item",
  );
  console.log("Successfully updated menu item.");

  // Verify state change
  console.log("Viewing menu item...");
  const updatedItem = await concept._getMenuItemDetails({
    menuItem: pepperoniPizzaId,
  });
  assertEquals(updatedItem.length, 1, "Should find the updated menu item");
  assertObjectMatch(updatedItem[0], {
    name: "Pepperoni Pizza",
    description: "Spicy pepperoni and extra cheese",
    price: 19.50,
  }, "Updated item details should match");
  console.log("Successfully viewed (correct) menu.");

  // Test 2: Fail to update a non-existent menu item
  console.log("Adding menu item...");
  const nonExistentId: ID = "menuItem:nonexistent" as ID;
  console.log(
    `Attempting to update non-existent menu item '${nonExistentId}'...`,
  );
  const updateResult3 = await concept.updateMenuItem({
    menuItem: nonExistentId,
    newDescription: "Fake description",
  });
  assertEquals(
    "error" in updateResult3,
    true,
    "updateMenuItem should return an error if item does not exist",
  );
  assertEquals(
    (updateResult3 as { error: string }).error,
    `No menu item found with ID '${nonExistentId}' to update.`,
    "Error message should indicate non-existent item",
  );
  console.log(`Successfully returned menu item.`);
  await client.close();
});

Deno.test("Action: removeMenuItem - Success and Failure", async () => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  const restaurantB: ID = "restaurant:PizzaPlace" as ID;

  // Add an item to remove
  console.log("Adding menu item...");
  const addResult = await concept.addMenuItem({
    restaurant: restaurantB,
    name: "Veggie Pizza",
    description: "Fresh vegetables on a crispy crust",
    price: 17.00,
  });
  const veggiePizzaId = (addResult as { menuItem: ID }).menuItem;
  console.log(`Added Veggie Pizza for removal testing: ${veggiePizzaId}`);

  // Test 1: Remove an existing menu item successfully
  console.log("Removing menu item...");
  const removeResult1 = await concept.removeMenuItem({
    menuItem: veggiePizzaId,
  });
  assertEquals(
    "success" in removeResult1,
    true,
    "removeMenuItem should return success on success",
  );
  assertEquals(
    (removeResult1 as { success: boolean }).success,
    true,
    "Success should be true",
  );

  // Verify state change
  const removedItem = await concept._getMenuItemDetails({
    menuItem: veggiePizzaId,
  });
  assertEquals(
    removedItem.length,
    0,
    "Should not find the removed menu item",
  );
  console.log("Successfully removed menu item.");

  // Test 2: Fail to remove a non-existent menu item
  console.log("Adding menu item...");
  const nonExistentId: ID = "menuItem:nonexistent2" as ID;
  console.log(
    `Attempting to remove non-existent menu item '${nonExistentId}'...`,
  );
  const removeResult2 = await concept.removeMenuItem({
    menuItem: nonExistentId,
  });
  assertEquals(
    "error" in removeResult2,
    true,
    "removeMenuItem should return an error if item does not exist",
  );
  assertEquals(
    (removeResult2 as { error: string }).error,
    `No menu item found with ID '${nonExistentId}' to delete.`,
    "Error message should indicate non-existent item",
  );
  console.log(`Successfully threw error.`);
  await client.close();
});

Deno.test("Query: _getMenuItems", async () => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  const restaurantB: ID = "restaurant:PizzaPlace" as ID;

  // Add multiple items for Restaurant B
  console.log("Adding menu items...");
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

  console.log(`Successfully added menu items.`);

  // Test 1: Retrieve all menu items for Restaurant B
  console.log("Getting menu items...");
  const itemsB = await concept._getMenuItems({ restaurant: restaurantB });
  assertEquals(
    itemsB.length,
    2,
    "Should return 2 menu items for Restaurant B",
  );
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
  console.log("Successfully retrieved all menu items.");

  // Test 2: Retrieve menu items for a restaurant with no menu
  console.log("Getting menu items...");
  const nonExistentRestaurant: ID = "restaurant:Imaginary" as ID;
  console.log(
    `Retrieving menu items for non-existent restaurant '${nonExistentRestaurant}'...`,
  );
  const itemsNonExistent = await concept._getMenuItems({
    restaurant: nonExistentRestaurant,
  });
  assertEquals(
    itemsNonExistent.length,
    0,
    "Should return an empty array for a restaurant with no menu items",
  );
  console.log("Successfully threw error.");
  await client.close();
});

Deno.test("Query: _getMenuItemDetails", async () => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  const restaurantA: ID = "restaurant:TheGourmet" as ID;

  // Add an item for detailed query
  console.log("Adding menu item...");
  const addResult = await concept.addMenuItem({
    restaurant: restaurantA,
    name: "Caesar Salad",
    description: "Crisp romaine, croutons, parmesan, Caesar dressing",
    price: 14.00,
  });
  const caesarSaladId = (addResult as { menuItem: ID }).menuItem;

  // Test 1: Retrieve details for an existing menu item
  console.log("Getting menu item details...");
  const details1 = await concept._getMenuItemDetails({
    menuItem: caesarSaladId,
  });
  assertEquals(details1.length, 1, "Should return one detail object");
  assertObjectMatch(details1[0], {
    name: "Caesar Salad",
    description: "Crisp romaine, croutons, parmesan, Caesar dressing",
    price: 14.00,
  }, "Details should match the added item");
  console.log("Successfully returned details for the menu item.");

  // Test 2: Retrieve details for a non-existent menu item
  console.log("Getting menu item details...");
  const nonExistentId: ID = "menuItem:fakeSalad" as ID;
  console.log(
    `Retrieving details for non-existent menu item '${nonExistentId}'...`,
  );
  const details2 = await concept._getMenuItemDetails({
    menuItem: nonExistentId,
  });
  assertEquals(
    details2.length,
    0,
    "Should return an empty array for a non-existent menu item",
  );
  console.log("Successfully threw error.");
  await client.close();
});
