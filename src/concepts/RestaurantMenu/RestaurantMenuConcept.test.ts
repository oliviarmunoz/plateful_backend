import { assert, assertEquals, assertFalse } from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
import RestaurantMenuConcept from "./RestaurantMenuConcept.ts";
import { ID } from "@utils/types.ts";
import { Collection } from "npm:mongodb";
import { GeminiLLM } from "@utils/gemini-llm.ts";

/**
  concept RestaurantMenu [Restaurant, User]

  purpose allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices to inform their choices, and receive personalized recommendations

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
