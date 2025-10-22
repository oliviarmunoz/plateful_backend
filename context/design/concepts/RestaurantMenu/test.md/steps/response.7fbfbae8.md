---
timestamp: 'Tue Oct 21 2025 21:26:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_212607.a9ec2662.md]]'
content_id: 7fbfbae8d535c3567dd3e7672480245dc0782f72f0092c3d8e2c5b9f9323f78a
---

# response:

Here are the additional tests for the `_getRecommendation` action in the `RestaurantMenuConcept`, placed in a new test file `src/concepts/RestaurantMenu/RestaurantMenuConcept.test.ts`.

To ensure deterministic testing, especially for the LLM interaction, a mocking utility (`mockGeminiLLMResponse`) is introduced. This allows controlling the LLM's response without making actual network calls, which is crucial for reliable unit tests.

### file: src/concepts/RestaurantMenu/RestaurantMenuConcept.test.ts

```typescript
import { assertEquals, assertExists, assert, assertFalse } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import RestaurantMenuConcept from "./RestaurantMenuConcept.ts";
import { ID } from "@utils/types.ts";
import { Collection } from "npm:mongodb";
import { GeminiLLM } from "@utils/gemini-llm.ts"; // Import GeminiLLM for mocking

// Helper for managing environment variables during tests
// This is essential for testing cases where the GEMINI_API_KEY might be missing or set.
function withEnv(key: string, value: string | undefined, fn: () => Promise<void>) {
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

// Mock LLM response directly in the test scope
// This allows intercepting calls to GeminiLLM.prototype.executeLLM and returning a predefined string.
// This is critical for making tests involving the LLM deterministic and independent of network calls.
const mockGeminiLLMResponse = (response: string) => {
  const originalExecuteLLM = GeminiLLM.prototype.executeLLM;
  GeminiLLM.prototype.executeLLM = async (_prompt: string) => response;
  return () => {
    GeminiLLM.prototype.executeLLM = originalExecuteLLM; // Restore original after test
  };
};

// Interface for user taste preferences to directly insert into the collection
// This collection is managed by a separate concept (UserTastePreferences) but queried by RestaurantMenu.
interface UserTastePreferenceDocument {
  _id: ID;
  likedDishes?: string[];
  dislikedDishes?: string[];
}

Deno.test(
  "Query _getRecommendation: Fallback to first item when no user preferences",
  async () => {
    const [db, client] = await testDb();
    const concept = new RestaurantMenuConcept(db);

    const restaurantId = freshID() as ID;
    const userId = freshID() as ID;

    console.log(`Setting up restaurant ${restaurantId} with menu items.`);
    // Add two menu items to ensure a 'first' item exists.
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
    // Directly insert into the UserTastePreferences.users collection for testing purposes.
    const userTasteCollection: Collection<UserTastePreferenceDocument> = db.collection(
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
    assertFalse("error" in recommendationResult[0], `Expected no error, got: ${JSON.stringify(recommendationResult[0])}`);
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
    // Temporarily mock the LLM for this test to control its output
    const restoreLLM = mockGeminiLLMResponse(
      '{"recommendation": "Spicy Thai Curry"}',
    );
    // Ensure API key is set for the GeminiLLM constructor to not throw initially.
    // The actual value doesn't matter since `executeLLM` is mocked.
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
      // Directly insert into UserTastePreferences.users to simulate user preferences
      const userTasteCollection: Collection<UserTastePreferenceDocument> = db.collection(
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
      assertFalse("error" in recommendationResult[0], `Expected no error, got: ${JSON.stringify(recommendationResult[0])}`);
      assertEquals(
        (recommendationResult[0] as { recommendation: string }).recommendation,
        "Spicy Thai Curry",
        "Should recommend 'Spicy Thai Curry' based on mocked LLM response.",
      );
    });
    restoreLLM(); // Restore the original LLM after the test
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
    const userTasteCollection: Collection<UserTastePreferenceDocument> = db.collection(
      "UserTastePreferences.users",
    );
    await userTasteCollection.insertOne({ _id: userId, likedDishes: ["Anything"] });

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
      (recommendationResult[0] as { error: string }).error.includes("No menu items found for restaurant"),
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
      (recommendationResult[0] as { error: string }).error.includes("User with ID") &&
        (recommendationResult[0] as { error: string }).error.includes("not found in the UserTastePreferences collection."),
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

    const restaurantId = freshID() as ID; // Create restaurant ID but add no menu items
    const userId = freshID() as ID;

    console.log(`Setting up user ${userId} with preferences.`);
    const userTasteCollection: Collection<UserTastePreferenceDocument> = db.collection(
      "UserTastePreferences.users",
    );
    await userTasteCollection.insertOne({ _id: userId, likedDishes: ["Pizza"] });

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
      (recommendationResult[0] as { error: string }).error.includes("No menu items found for restaurant"),
      "Error message should indicate no menu items.",
    );

    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Error when GEMINI_API_KEY is missing",
  async () => {
    const [db, client] = await testDb();
    // Temporarily unset the API key to simulate a missing environment variable
    await withEnv("GEMINI_API_KEY", undefined, async () => {
      const concept = new RestaurantMenuConcept(db);

      const restaurantId = freshID() as ID;
      const userId = freshID() as ID;

      // Setup minimal required data to reach the LLM check point
      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Test Dish",
        description: "A test dish",
        price: 1.00,
      });
      const userTasteCollection: Collection<UserTastePreferenceDocument> = db.collection(
        "UserTastePreferences.users",
      );
      await userTasteCollection.insertOne({ _id: userId, likedDishes: ["Test"] });

      console.log("Querying recommendation with missing API key (should error)...");
      const recommendationResult = await concept._getRecommendation({
        restaurant: restaurantId,
        user: userId,
      });

      console.log("Recommendation result:", recommendationResult);
      assert(Array.isArray(recommendationResult), "Result should be an array.");
      assert("error" in recommendationResult[0], "Should return an error.");
      assert(
        (recommendationResult[0] as { error: string }).error.includes("Missing GEMINI_API_KEY environment variable."),
        "Error message should indicate missing API key.",
      );
    });
    await client.close();
  },
);

Deno.test(
  "Query _getRecommendation: Error when LLM returns invalid JSON",
  async () => {
    const [db, client] = await testDb();
    // Mock the LLM to return invalid JSON
    const restoreLLM = mockGeminiLLMResponse("THIS IS NOT JSON");
    await withEnv("GEMINI_API_KEY", "dummy-api-key", async () => { // API key set to satisfy constructor
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
      const userTasteCollection: Collection<UserTastePreferenceDocument> = db.collection(
        "UserTastePreferences.users",
      );
      await userTasteCollection.insertOne({ _id: userId, likedDishes: ["Taste"] });

      console.log("Querying recommendation when LLM returns invalid JSON (should error)...");
      const recommendationResult = await concept._getRecommendation({
        restaurant: restaurantId,
        user: userId,
      });

      console.log("Recommendation result:", recommendationResult);
      assert(Array.isArray(recommendationResult), "Result should be an array.");
      assert("error" in recommendationResult[0], "Should return an error.");
      assert(
        (recommendationResult[0] as { error: string }).error.includes("Failed to parse LLM response as JSON."),
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
    // Mock the LLM to return a dish that doesn't exist on the menu
    const restoreLLM = mockGeminiLLMResponse('{"recommendation": "NonExistent Dish"}');
    await withEnv("GEMINI_API_KEY", "dummy-api-key", async () => { // API key set to satisfy constructor
      const concept = new RestaurantMenuConcept(db);

      const restaurantId = freshID() as ID;
      const userId = freshID() as ID;

      // Setup menu item that IS NOT the recommended one
      await concept.addMenuItem({
        restaurant: restaurantId,
        name: "Existing Dish",
        description: "Description",
        price: 10.00,
      });
      const userTasteCollection: Collection<UserTastePreferenceDocument> = db.collection(
        "UserTastePreferences.users",
      );
      await userTasteCollection.insertOne({ _id: userId, likedDishes: ["Taste"] });

      console.log("Querying recommendation when LLM recommends non-existent dish (should error)...");
      const recommendationResult = await concept._getRecommendation({
        restaurant: restaurantId,
        user: userId,
      });

      console.log("Recommendation result:", recommendationResult);
      assert(Array.isArray(recommendationResult), "Result should be an array.");
      assert("error" in recommendationResult[0], "Should return an error.");
      assert(
        (recommendationResult[0] as { error: string }).error.includes("The recommended dish 'NonExistent Dish' is not on the menu."),
        "Error message should indicate dish not on menu.",
      );
    });
    restoreLLM(); // Restore the original LLM
    await client.close();
  },
);

```
