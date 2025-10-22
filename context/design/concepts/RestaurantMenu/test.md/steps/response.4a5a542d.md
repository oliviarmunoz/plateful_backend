---
timestamp: 'Tue Oct 21 2025 21:23:43 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_212343.6c69bc91.md]]'
content_id: 4a5a542d77c73bd13799238d2827a9f55bb96adb06e4ea8e1c6ca237ed818381
---

# response:

```typescript
import { assertEquals, assert, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import RestaurantMenuConcept from "./RestaurantMenuConcept.ts";
import { ID } from "@utils/types.ts";
import { stub } from "jsr:@std/testing/mock";
import { GeminiLLM } from "@utils/gemini-llm.ts"; // Import the actual LLM class to stub its prototype

// Mock for Deno.env.get, to control API key availability
let restoreEnvStub: () => void;
// Mock for GeminiLLM.prototype.executeLLM, to control LLM responses
let restoreLLMStub: () => void;

Deno.test("RestaurantMenuConcept", async (t) => {
  const [db, client] = await testDb();
  const concept = new RestaurantMenuConcept(db);

  // Define some common IDs for testing
  const restaurantId = "rest:chipotle" as ID;
  const userId = "user:alice" as ID;
  const anotherUserId = "user:bob" as ID;

  // Cleanup stubs before each test to ensure isolation
  Deno.test.beforeEach(() => {
    if (restoreEnvStub) {
      restoreEnvStub();
    }
    if (restoreLLMStub) {
      restoreLLMStub();
    }
  });

  // Close the database client after all tests in this file
  Deno.test.afterAll(async () => {
    await client.close();
    // Ensure stubs are restored after all tests as well
    if (restoreEnvStub) {
      restoreEnvStub();
    }
    if (restoreLLMStub) {
      restoreLLMStub();
    }
  });

  await t.step("addMenuItem action", async (s) => {
    await s.step("should add a new menu item", async () => {
      console.log("Trace: Attempting to add a new menu item 'Burrito'");
      const result = await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Burrito",
        description: "Large flour tortilla with rice, beans, meat, salsa, and cheese.",
        price: 10.50,
      });

      assert("menuItem" in result, `Expected success, got error: ${result.error}`);
      const menuItemId = result.menuItem;
      console.log(`Trace: Menu item 'Burrito' added with ID: ${menuItemId}`);

      const fetchedItem = await concept.menuItems.findOne({ _id: menuItemId });
      assert(fetchedItem !== null, "Menu item should be found in the database");
      assertEquals(fetchedItem?.name, "Burrito");
      assertEquals(fetchedItem?.restaurant, restaurantId);
    });

    await s.step("should not add a duplicate menu item for the same restaurant", async () => {
      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Burrito",
        description: "Original description",
        price: 10.50,
      });

      console.log("Trace: Attempting to add a duplicate menu item 'Burrito'");
      const result = await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Burrito",
        description: "New description",
        price: 11.00,
      });

      assert("error" in result, "Expected an error for duplicate menu item");
      assertEquals(
        result.error,
        `Menu item 'Burrito' already exists for restaurant '${restaurantId}'.`,
      );
    });
  });

  await t.step("updateMenuItem action", async (s) => {
    let menuItemId: ID;

    s.beforeEach(async () => {
      // Ensure a fresh menu item for each update test
      const addResult = await concept.addMenuItem({
        restaurant: restaurantId,
        name: `Taco-${freshID()}`, // Unique name
        description: "Crispy taco",
        price: 3.00,
      });
      menuItemId = (addResult as { menuItem: ID }).menuItem;
    });

    await s.step("should update the description and price of an existing menu item", async () => {
      console.log(`Trace: Updating menu item ${menuItemId} description and price`);
      const result = await concept.updateMenuItem({
        menuItem: menuItemId,
        newDescription: "Soft tortilla with juicy meat",
        newPrice: 3.50,
      });

      assert("menuItem" in result, `Expected success, got error: ${result.error}`);
      console.log(`Trace: Menu item ${menuItemId} updated successfully.`);

      const fetchedItem = await concept.menuItems.findOne({ _id: menuItemId });
      assertEquals(fetchedItem?.description, "Soft tortilla with juicy meat");
      assertEquals(fetchedItem?.price, 3.50);
    });

    await s.step("should update only the description if price is not provided", async () => {
      console.log(`Trace: Updating menu item ${menuItemId} description only`);
      const result = await concept.updateMenuItem({
        menuItem: menuItemId,
        newDescription: "New description only",
      });

      assert("menuItem" in result, `Expected success, got error: ${result.error}`);

      const fetchedItem = await concept.menuItems.findOne({ _id: menuItemId });
      assertEquals(fetchedItem?.description, "New description only");
      assertEquals(fetchedItem?.price, 3.00); // Price should remain unchanged
    });

    await s.step("should return an error if menu item does not exist", async () => {
      const nonExistentId = "nonexistent:item" as ID;
      console.log(`Trace: Attempting to update non-existent menu item ${nonExistentId}`);
      const result = await concept.updateMenuItem({
        menuItem: nonExistentId,
        newDescription: "Should fail",
      });

      assert("error" in result, "Expected an error for non-existent menu item");
      assertEquals(
        result.error,
        `No menu item found with ID '${nonExistentId}' to update.`,
      );
    });
  });

  await t.step("removeMenuItem action", async (s) => {
    let menuItemId: ID;

    s.beforeEach(async () => {
      // Ensure a fresh menu item for each remove test
      const addResult = await concept.addMenuItem({
        restaurant: restaurantId,
        name: `Salad-${freshID()}`,
        description: "Healthy salad",
        price: 9.00,
      });
      menuItemId = (addResult as { menuItem: ID }).menuItem;
    });

    await s.step("should remove an existing menu item", async () => {
      console.log(`Trace: Removing menu item ${menuItemId}`);
      const result = await concept.removeMenuItem({ menuItem: menuItemId });

      assert("success" in result, `Expected success, got error: ${result.error}`);
      assertEquals(result.success, true);
      console.log(`Trace: Menu item ${menuItemId} removed successfully.`);

      const fetchedItem = await concept.menuItems.findOne({ _id: menuItemId });
      assert(fetchedItem === null, "Menu item should no longer be in the database");
    });

    await s.step("should return an error if menu item does not exist", async () => {
      const nonExistentId = "nonexistent:item" as ID;
      console.log(`Trace: Attempting to remove non-existent menu item ${nonExistentId}`);
      const result = await concept.removeMenuItem({ menuItem: nonExistentId });

      assert("error" in result, "Expected an error for non-existent menu item");
      assertEquals(
        result.error,
        `No menu item found with ID '${nonExistentId}' to delete.`,
      );
    });
  });

  await t.step("queries", async (s) => {
    let pastaId: ID;
    let pizzaId: ID;
    const otherRestaurantId = "rest:pizzaplace" as ID;
    let otherMenuItemId: ID;

    s.beforeEach(async () => {
      // Add items for the main restaurant
      const pastaResult = await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Spaghetti Carbonara",
        description: "Creamy pasta with pancetta",
        price: 18.00,
      });
      pastaId = (pastaResult as { menuItem: ID }).menuItem;

      const pizzaResult = await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Margherita Pizza",
        description: "Classic Neapolitan pizza",
        price: 16.00,
      });
      pizzaId = (pizzaResult as { menuItem: ID }).menuItem;

      // Add item for another restaurant
      const otherResult = await concept.addMenuItem({
        restaurant: otherRestaurantId,
        name: "Pepperoni Pizza",
        description: "Pepperoni and cheese",
        price: 17.00,
      });
      otherMenuItemId = (otherResult as { menuItem: ID }).menuItem;
    });

    await s.step("should get all menu items for a specific restaurant", async () => {
      console.log(`Trace: Getting menu items for restaurant ${restaurantId}`);
      const items = await concept._getMenuItems({ restaurant: restaurantId });

      assertEquals(items.length, 2);
      assertEquals(
        items.map((i) => i.menuItem).sort(),
        [pastaId, pizzaId].sort(),
      );
      assert(
        items.some((item) =>
          item.name === "Spaghetti Carbonara" && item.price === 18.00
        ),
        "Should contain Spaghetti Carbonara",
      );
      assert(
        items.some((item) =>
          item.name === "Margherita Pizza" && item.price === 16.00
        ),
        "Should contain Margherita Pizza",
      );

      console.log(
        `Trace: Verifying no items from other restaurant are returned for ${restaurantId}`,
      );
      assert(
        !items.some((item) => item.menuItem === otherMenuItemId),
        "Should not include items from other restaurants",
      );
    });

    await s.step("should get details for a specific menu item", async () => {
      console.log(`Trace: Getting details for menu item ${pastaId}`);
      const details = await concept._getMenuItemDetails({ menuItem: pastaId });

      assertEquals(details.length, 1);
      assertEquals(details[0].name, "Spaghetti Carbonara");
      assertEquals(details[0].description, "Creamy pasta with pancetta");
      assertEquals(details[0].price, 18.00);
    });

    await s.step("should return an empty array for a non-existent menu item details", async () => {
      const nonExistentId = "nonexistent:item" as ID;
      console.log(`Trace: Getting details for non-existent menu item ${nonExistentId}`);
      const details = await concept._getMenuItemDetails({ menuItem: nonExistentId });

      assertEquals(details.length, 0);
    });
  });

  await t.step("._getRecommendation query", async (s) => {
    // Shared setup for recommendation tests
    let uniqueRestaurantId = "rest:recommendationplace" as ID;
    let pastaId: ID, pizzaId: ID, saladId: ID;

    s.beforeEach(async () => {
      // Add menu items for the unique restaurant
      const pastaRes = await concept.addMenuItem({
        restaurant: uniqueRestaurantId,
        name: "Penne Arrabiata",
        description: "Spicy tomato pasta",
        price: 14,
      });
      pastaId = (pastaRes as { menuItem: ID }).menuItem;

      const pizzaRes = await concept.addMenuItem({
        restaurant: uniqueRestaurantId,
        name: "Pepperoni Pizza",
        description: "Classic pepperoni pizza",
        price: 17,
      });
      pizzaId = (pizzaRes as { menuItem: ID }).menuItem;

      const saladRes = await concept.addMenuItem({
        restaurant: uniqueRestaurantId,
        name: "Caesar Salad",
        description: "Crisp romaine, croutons, parmesan",
        price: 12,
      });
      saladId = (saladRes as { menuItem: ID }).menuItem;
    });

    await s.step("should return an error if no API key is provided", async () => {
      console.log("Trace: Testing _getRecommendation without API key.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return undefined;
        return Deno.env.get(name);
      });

      // Ensure user exists, but no menu items for this restaurant
      await concept.users.insertOne({ _id: userId, likedDishes: [], dislikedDishes: [] });

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "error" in result[0]);
      assertEquals(result[0].error, "Missing GEMINI_API_KEY environment variable.");
      console.log("Trace: Successfully returned error for missing API key.");
    });

    await s.step("should return an error if no menu items exist for the restaurant", async () => {
      console.log("Trace: Testing _getRecommendation with no menu items.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      await concept.users.insertOne({ _id: userId, likedDishes: [], dislikedDishes: [] });

      const nonExistentRestaurant = "rest:emptyplace" as ID;
      const result = await concept._getRecommendation({
        restaurant: nonExistentRestaurant,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "error" in result[0]);
      assertEquals(
        result[0].error,
        `No menu items found for restaurant '${nonExistentRestaurant}'.`,
      );
      console.log("Trace: Successfully returned error for no menu items.");
    });

    await s.step("should return the first menu item if user has no preferences", async () => {
      console.log("Trace: Testing _getRecommendation with no user preferences.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      // Insert user with no preferences
      await concept.users.insertOne({ _id: userId, likedDishes: [], dislikedDishes: [] });

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "recommendation" in result[0]);
      assertEquals(result[0].recommendation, "Penne Arrabiata"); // First item added in beforeEach
      console.log("Trace: Successfully returned first menu item as generic recommendation.");
    });

    await s.step("should return an LLM recommendation based on liked dishes", async () => {
      console.log("Trace: Testing _getRecommendation with liked dishes.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      await concept.users.insertOne({
        _id: userId,
        likedDishes: ["Spicy food"],
        dislikedDishes: [],
      });

      restoreLLMStub = stub(GeminiLLM.prototype, "executeLLM", () => {
        return Promise.resolve('{"recommendation": "Penne Arrabiata"}');
      });

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "recommendation" in result[0]);
      assertEquals(result[0].recommendation, "Penne Arrabiata");
      console.log("Trace: LLM successfully recommended Penne Arrabiata based on liked dishes.");
    });

    await s.step("should return an LLM recommendation avoiding disliked dishes", async () => {
      console.log("Trace: Testing _getRecommendation with disliked dishes.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      await concept.users.insertOne({
        _id: userId,
        likedDishes: [],
        dislikedDishes: ["Penne Arrabiata"],
      });

      restoreLLMStub = stub(GeminiLLM.prototype, "executeLLM", () => {
        return Promise.resolve('{"recommendation": "Pepperoni Pizza"}');
      });

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "recommendation" in result[0]);
      assertEquals(result[0].recommendation, "Pepperoni Pizza");
      console.log("Trace: LLM successfully recommended Pepperoni Pizza avoiding disliked pasta.");
    });

    await s.step("should return an error if LLM recommends a non-existent dish", async () => {
      console.log("Trace: Testing _getRecommendation when LLM suggests non-existent dish.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      await concept.users.insertOne({ _id: userId, likedDishes: ["Exotic food"], dislikedDishes: [] });

      restoreLLMStub = stub(GeminiLLM.prototype, "executeLLM", () => {
        return Promise.resolve('{"recommendation": "Dragon Noodles"}'); // Dragon Noodles is not on the menu
      });

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "error" in result[0]);
      assertEquals(result[0].error, "The recommended dish 'Dragon Noodles' is not on the menu.");
      console.log("Trace: Successfully returned error for non-existent dish recommendation.");
    });

    await s.step("should return an error if LLM response is invalid JSON", async () => {
      console.log("Trace: Testing _getRecommendation with invalid LLM JSON response.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      await concept.users.insertOne({ _id: userId, likedDishes: ["Pasta"], dislikedDishes: [] });

      restoreLLMStub = stub(GeminiLLM.prototype, "executeLLM", () => {
        return Promise.resolve('This is definitely not JSON');
      });

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "error" in result[0]);
      assertEquals(result[0].error, "Failed to parse LLM response as JSON.");
      console.log("Trace: Successfully returned error for invalid LLM JSON.");
    });

    await s.step("should return an error if LLM response JSON is missing recommendation field", async () => {
      console.log("Trace: Testing _getRecommendation with LLM JSON missing 'recommendation'.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      await concept.users.insertOne({ _id: userId, likedDishes: ["Pasta"], dislikedDishes: [] });

      restoreLLMStub = stub(GeminiLLM.prototype, "executeLLM", () => {
        return Promise.resolve('{"suggestedDish": "Penne Arrabiata"}');
      });

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: userId,
      });

      assert(Array.isArray(result) && result.length > 0 && "error" in result[0]);
      assertEquals(result[0].error, "LLM did not return a valid recommendation.");
      console.log("Trace: Successfully returned error for LLM JSON missing recommendation field.");
    });

    await s.step("should return an error if user does not exist in taste preferences", async () => {
      console.log("Trace: Testing _getRecommendation with non-existent user.");
      restoreEnvStub = stub(Deno.env, "get", (name) => {
        if (name === "GEMINI_API_KEY") return "dummy-api-key";
        return Deno.env.get(name);
      });

      const nonExistentUser = "user:nonexistent" as ID;
      // No user entry in concept.users for nonExistentUser

      const result = await concept._getRecommendation({
        restaurant: uniqueRestaurantId,
        user: nonExistentUser,
      });

      assert(Array.isArray(result) && result.length > 0 && "error" in result[0]);
      assertEquals(result[0].error, `User with ID '${nonExistentUser}' not found in the UserTastePreferences collection.`);
      console.log("Trace: Successfully returned error for non-existent user.");
    });
  });
});
```
