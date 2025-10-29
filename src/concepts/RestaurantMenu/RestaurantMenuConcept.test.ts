import {
  assert,
  assertEquals,
  assertFalse,
  assertNotEquals,
  assertObjectMatch,
} from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
import RestaurantMenuConcept from "./RestaurantMenuConcept.ts";
import { ID } from "@utils/types.ts";
import { Collection } from "npm:mongodb";
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

    /_getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
      requires: true
      effects: returns a set of all menu items associated with the given restaurant, including their name, description, and price

    /_getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
      requires: menuItem with the given ID exists
      effects: returns the name, description, and price of the specified menu item

    /_getRecommendation (restaurant: Restaurant, user: User): (recommendation: String)
      requires: a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
      effects: returns the name of a menu item from the specified restaurant that is recommended for the user via an LLM, based on their taste preferences and the current menu items. If no specific preferences are found, a generic recommendation may be provided.
*/

function withEnv(
  key: string,
  value: string | undefined,
  fn: () => Promise<void>,
) {
  const originalValue = Deno.env.get(key);
  if (value === undefined) {
    Deno.env.delete(key);
  } else {
    Deno.env.set(key, value);
  }
  try {
    return fn();
  } finally {
    if (originalValue === undefined) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, originalValue);
    }
  }
}

const mockGeminiLLMResponse = (response: string) => {
  const originalExecuteLLM = GeminiLLM.prototype.executeLLM;
  GeminiLLM.prototype.executeLLM = async (_prompt: string) => response;
  return () => {
    GeminiLLM.prototype.executeLLM = originalExecuteLLM;
  };
};

interface UserTastePreferenceDocument {
  _id: ID;
  likedDishes?: string[];
  dislikedDishes?: string[];
}

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

Deno.test(
  "Query _getRecommendation: Fallback to first item when no user preferences",
  async () => {
    const [db, client] = await testDb();
    const concept = new RestaurantMenuConcept(db);

    const restaurantId = freshID() as ID;
    const userId = freshID() as ID;

    console.log(`Setting up restaurant ${restaurantId} with menu items.`);
    const item1Result = await concept.addMenuItem({
      restaurant: restaurantId,
      name: "Pasta Primavera",
      description: "Fresh vegetables with pasta",
      price: 15.99,
    });
    if ("error" in item1Result) throw new Error(item1Result.error);
    const item2Result = await concept.addMenuItem({
      restaurant: restaurantId,
      name: "Chicken Stir-fry",
      description: "Wok-fried chicken and veggies",
      price: 18.50,
    });
    if ("error" in item2Result) throw new Error(item2Result.error);

    console.log(`Setting up user ${userId} without preferences.`);
    const userTasteCollection: Collection<UserTastePreferenceDocument> = db
      .collection(
        "UserTastePreferences.users",
      );
    await userTasteCollection.insertOne({ _id: userId }); // User exists, but no liked/disliked dishes

    console.log(
      "Querying recommendation for user with no preferences (should return first item)...",
    );
    const recommendationResult = await concept._getRecommendation({
      restaurant: restaurantId,
      user: userId,
    });

    console.log("Recommendation result:", recommendationResult);
    assert(Array.isArray(recommendationResult), "Result should be an array.");
    assertFalse(
      "error" in recommendationResult[0],
      `Expected no error, got: ${JSON.stringify(recommendationResult[0])}`,
    );
    assertEquals(
      (recommendationResult[0] as { recommendation: string }).recommendation,
      "Pasta Primavera",
      "Should recommend the first menu item when no preferences are found.",
    );

    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Successful recommendation with user preferences",
  async () => {
    const [db, client] = await testDb();
    const restoreLLM = mockGeminiLLMResponse(
      '{"recommendation": "Spicy Thai Curry"}',
    );
    await withEnv("GEMINI_API_KEY", "dummy-api-key", async () => {
      const concept = new RestaurantMenuConcept(db);

      const restaurantId = freshID() as ID;
      const userId = freshID() as ID;

      console.log(`Setting up restaurant ${restaurantId} with menu items.`);
      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Spicy Thai Curry",
        description: "A rich and aromatic red curry with chicken",
        price: 16.00,
      });
      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Pad See Ew",
        description: "Stir-fried wide noodles with broccoli and beef",
        price: 14.50,
      });
      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Tom Yum Soup",
        description: "Hot and sour shrimp soup",
        price: 12.00,
      });

      console.log(`Setting up user ${userId} with preferences.`);
      const userTasteCollection: Collection<UserTastePreferenceDocument> = db
        .collection(
          "UserTastePreferences.users",
        );
      await userTasteCollection.insertOne({
        _id: userId,
        likedDishes: ["Spicy food"],
        dislikedDishes: ["Mild dishes"],
      });

      console.log(
        "Querying recommendation for user with preferences (LLM mocked)...",
      );
      const recommendationResult = await concept._getRecommendation({
        restaurant: restaurantId,
        user: userId,
      });

      console.log("Recommendation result:", recommendationResult);
      assert(Array.isArray(recommendationResult), "Result should be an array.");
      assertFalse(
        "error" in recommendationResult[0],
        `Expected no error, got: ${JSON.stringify(recommendationResult[0])}`,
      );
      assertEquals(
        (recommendationResult[0] as { recommendation: string }).recommendation,
        "Spicy Thai Curry",
        "Should recommend 'Spicy Thai Curry' based on mocked LLM response.",
      );
    });
    restoreLLM();
    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Error for non-existent restaurant",
  async () => {
    const [db, client] = await testDb();
    const concept = new RestaurantMenuConcept(db);

    const nonExistentRestaurantId = freshID() as ID;
    const userId = freshID() as ID;

    console.log(`Setting up user ${userId} with preferences.`);
    const userTasteCollection: Collection<UserTastePreferenceDocument> = db
      .collection(
        "UserTastePreferences.users",
      );
    await userTasteCollection.insertOne({
      _id: userId,
      likedDishes: ["Anything"],
    });

    console.log(
      "Querying recommendation for non-existent restaurant (should error)...",
    );
    const recommendationResult = await concept._getRecommendation({
      restaurant: nonExistentRestaurantId,
      user: userId,
    });

    console.log("Recommendation result:", recommendationResult);
    assert(Array.isArray(recommendationResult), "Result should be an array.");
    assert("error" in recommendationResult[0], "Should return an error.");
    assert(
      (recommendationResult[0] as { error: string }).error.includes(
        "No menu items found for restaurant",
      ),
      "Error message should indicate no menu items found.",
    );

    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Error for non-existent user",
  async () => {
    const [db, client] = await testDb();
    const concept = new RestaurantMenuConcept(db);

    const restaurantId = freshID() as ID;
    const nonExistentUserId = freshID() as ID;

    console.log(`Setting up restaurant ${restaurantId} with menu items.`);
    await concept.addMenuItem({
      restaurant: restaurantId,
      name: "Burger",
      description: "Classic beef burger",
      price: 10.00,
    });

    console.log(
      "Querying recommendation for non-existent user (should error)...",
    );
    const recommendationResult = await concept._getRecommendation({
      restaurant: restaurantId,
      user: nonExistentUserId,
    });

    console.log("Recommendation result:", recommendationResult);
    assert(Array.isArray(recommendationResult), "Result should be an array.");
    assert("error" in recommendationResult[0], "Should return an error.");
    assert(
      (recommendationResult[0] as { error: string }).error.includes(
        "User with ID",
      ) &&
        (recommendationResult[0] as { error: string }).error.includes(
          "not found in the UserTastePreferences collection.",
        ),
      "Error message should indicate user not found.",
    );

    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Error for restaurant with no menu items",
  async () => {
    const [db, client] = await testDb();
    const concept = new RestaurantMenuConcept(db);

    const restaurantId = freshID() as ID;
    const userId = freshID() as ID;

    console.log(`Setting up user ${userId} with preferences.`);
    const userTasteCollection: Collection<UserTastePreferenceDocument> = db
      .collection(
        "UserTastePreferences.users",
      );
    await userTasteCollection.insertOne({
      _id: userId,
      likedDishes: ["Pizza"],
    });

    console.log(
      "Querying recommendation for restaurant with no menu items (should error)...",
    );
    const recommendationResult = await concept._getRecommendation({
      restaurant: restaurantId,
      user: userId,
    });

    console.log("Recommendation result:", recommendationResult);
    assert(Array.isArray(recommendationResult), "Result should be an array.");
    assert("error" in recommendationResult[0], "Should return an error.");
    assert(
      (recommendationResult[0] as { error: string }).error.includes(
        "No menu items found for restaurant",
      ),
      "Error message should indicate no menu items.",
    );

    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Error when LLM returns invalid JSON",
  async () => {
    const [db, client] = await testDb();
    // Mock the LLM to return invalid JSON
    const restoreLLM = mockGeminiLLMResponse("THIS IS NOT JSON");
    await withEnv("GEMINI_API_KEY", "dummy-api-key", async () => {
      const concept = new RestaurantMenuConcept(db);

      const restaurantId = freshID() as ID;
      const userId = freshID() as ID;

      // Setup minimal required data
      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Valid Dish",
        description: "Description",
        price: 10.00,
      });
      const userTasteCollection: Collection<UserTastePreferenceDocument> = db
        .collection(
          "UserTastePreferences.users",
        );
      await userTasteCollection.insertOne({
        _id: userId,
        likedDishes: ["Taste"],
      });

      console.log(
        "Querying recommendation when LLM returns invalid JSON (should error)...",
      );
      const recommendationResult = await concept._getRecommendation({
        restaurant: restaurantId,
        user: userId,
      });

      console.log("Recommendation result:", recommendationResult);
      assert(Array.isArray(recommendationResult), "Result should be an array.");
      assert("error" in recommendationResult[0], "Should return an error.");
      assert(
        (recommendationResult[0] as { error: string }).error.includes(
          "Failed to parse LLM response as JSON.",
        ),
        "Error message should indicate invalid JSON.",
      );
    });
    restoreLLM(); // Restore the original LLM
    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Error when LLM recommendation is not on the menu",
  async () => {
    const [db, client] = await testDb();
    const restoreLLM = mockGeminiLLMResponse(
      '{"recommendation": "NonExistent Dish"}',
    );
    await withEnv("GEMINI_API_KEY", "dummy-api-key", async () => {
      const concept = new RestaurantMenuConcept(db);

      const restaurantId = freshID() as ID;
      const userId = freshID() as ID;

      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Existing Dish",
        description: "Description",
        price: 10.00,
      });
      const userTasteCollection: Collection<UserTastePreferenceDocument> = db
        .collection(
          "UserTastePreferences.users",
        );
      await userTasteCollection.insertOne({
        _id: userId,
        likedDishes: ["Taste"],
      });

      console.log(
        "Querying recommendation when LLM recommends non-existent dish (should error)...",
      );
      const recommendationResult = await concept._getRecommendation({
        restaurant: restaurantId,
        user: userId,
      });

      console.log("Recommendation result:", recommendationResult);
      assert(Array.isArray(recommendationResult), "Result should be an array.");
      assert("error" in recommendationResult[0], "Should return an error.");
      assert(
        (recommendationResult[0] as { error: string }).error.includes(
          "The recommended dish 'NonExistent Dish' is not on the menu.",
        ),
        "Error message should indicate dish not on menu.",
      );
    });
    restoreLLM();
    await client.close();
  },
);
