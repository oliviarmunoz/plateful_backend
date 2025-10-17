---
timestamp: 'Thu Oct 16 2025 23:18:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231827.d7fa150e.md]]'
content_id: a11cba279df545570cf0994a9f9e038a8da6a6a6aadb808978a450df6484dc86
---

# file: src/concepts/UserTastePreferencesConcept.test.ts

```typescript
import { Deno } from "https://deno.land/std@0.224.0/testing/mod.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserTastePreferencesConcept from "./UserTastePreferencesConcept.ts";

Deno.test("UserTastePreferences Concept", async (test) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  // Define test IDs
  const userA = "user:Alice" as ID;
  const userB = "user:Bob" as ID;
  const dish1 = "dish:Pasta" as ID;
  const dish2 = "dish:Pizza" as ID;
  const dish3 = "dish:Salad" as ID;
  const dish4 = "dish:Burger" as ID;
  const dish5 = "dish:Sushi" as ID;

  await test.step("Principle: A user's liked dish preference is recorded", async () => {
    console.log(
      `--- Principle Test: User ${userA} likes ${dish1}, preference recorded ---`,
    );

    // Initial state check for userA
    console.log(`Checking initial state for ${userA}...`);
    const initialLiked = await concept._getLikedDishes({ user: userA });
    assertEquals(initialLiked, [], "User A should have no liked dishes initially.");
    console.log(`Initial liked dishes for ${userA}: ${JSON.stringify(initialLiked)}`);

    // Action: userA likes dish1
    console.log(`Action: ${userA} adds ${dish1} to liked dishes.`);
    const result = await concept.addLikedDish({ user: userA, dish: dish1 });
    assertEquals(result, {}, "addLikedDish should return an empty object on success.");

    // Verification: check if dish1 is in userA's liked dishes
    console.log(`Verifying state: checking liked dishes for ${userA} after action...`);
    const likedDishes = await concept._getLikedDishes({ user: userA });
    assertEquals(likedDishes, [{ dish: dish1 }], "Dish 1 should be in user A's liked dishes.");
    console.log(`Final liked dishes for ${userA}: ${JSON.stringify(likedDishes)}`);

    console.log(
      `Principle fulfilled: ${dish1} was recorded as liked for ${userA}.`,
    );
    console.log(
      "-------------------------------------------------------------------",
    );
  });

  await test.step("Action: addLikedDish - success scenarios", async () => {
    console.log(`--- Test: addLikedDish - success scenarios ---`);

    // Scenario 1: Add a new liked dish for a new user
    console.log(`Action: ${userB} adds ${dish2} to liked dishes (new user).`);
    let result = await concept.addLikedDish({ user: userB, dish: dish2 });
    assertEquals(result, {}, "addLikedDish should succeed for a new user.");
    let liked = await concept._getLikedDishes({ user: userB });
    assertEquals(liked, [{ dish: dish2 }], "User B should have dish 2 liked.");
    console.log(`Liked dishes for ${userB}: ${JSON.stringify(liked)}`);

    // Scenario 2: Add another liked dish for an existing user
    console.log(`Action: ${userB} adds ${dish3} to liked dishes (existing user).`);
    result = await concept.addLikedDish({ user: userB, dish: dish3 });
    assertEquals(result, {}, "addLikedDish should succeed for an existing user.");
    liked = await concept._getLikedDishes({ user: userB });
    // Note: order might not be guaranteed by $addToSet, so compare sets or sort
    assertEquals(liked.map((d) => d.dish).sort(), [dish2, dish3].sort(), "User B should have dish 2 and dish 3 liked.");
    console.log(`Liked dishes for ${userB}: ${JSON.stringify(liked)}`);

    // Scenario 3: Add a dish already liked (idempotent)
    console.log(`Action: ${userB} re-adds ${dish2} to liked dishes (already liked).`);
    result = await concept.addLikedDish({ user: userB, dish: dish2 });
    assertEquals(result, {}, "addLikedDish should succeed (idempotent) if dish is already liked.");
    liked = await concept._getLikedDishes({ user: userB });
    assertEquals(liked.map((d) => d.dish).sort(), [dish2, dish3].sort(), "User B's liked dishes should remain the same.");
    console.log(`Liked dishes for ${userB}: ${JSON.stringify(liked)}`);

    console.log(`--- End Test: addLikedDish - success scenarios ---`);
  });

  await test.step("Action: addLikedDish - failure scenarios", async () => {
    console.log(`--- Test: addLikedDish - failure scenarios ---`);

    // Precondition: dish is not in dislikedDishes for user
    console.log(`Setup: ${userA} dislikes ${dish4}.`);
    let addDislikedResult = await concept.addDislikedDish({ user: userA, dish: dish4 });
    assertEquals(addDislikedResult, {}, "Setup: addDislikedDish should succeed.");
    let disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(disliked, [{ dish: dish4 }], "Setup: User A should have dish 4 disliked.");

    console.log(`Action: ${userA} attempts to like ${dish4} (which is disliked).`);
    const result = await concept.addLikedDish({ user: userA, dish: dish4 });
    assertEquals(
      result,
      { error: `Dish ${dish4} is in disliked dishes for user ${userA}` },
      "addLikedDish should fail if dish is in dislikedDishes.",
    );
    let liked = await concept._getLikedDishes({ user: userA });
    assertEquals(liked, [{ dish: dish1 }], "Dish 4 should not be added to liked dishes."); // dish1 from principle test

    console.log(`--- End Test: addLikedDish - failure scenarios ---`);
  });

  await test.step("Action: removeLikedDish - success scenarios", async () => {
    console.log(`--- Test: removeLikedDish - success scenarios ---`);

    // Precondition: userA already likes dish1 (from principle test)
    console.log(`Setup: Verify ${userA} likes ${dish1}.`);
    let liked = await concept._getLikedDishes({ user: userA });
    assertEquals(liked, [{ dish: dish1 }], "Setup: User A should like dish 1.");

    // Scenario 1: Remove an existing liked dish
    console.log(`Action: ${userA} removes ${dish1} from liked dishes.`);
    const result = await concept.removeLikedDish({ user: userA, dish: dish1 });
    assertEquals(result, {}, "removeLikedDish should succeed.");
    liked = await concept._getLikedDishes({ user: userA });
    assertEquals(liked, [], "User A should no longer like dish 1.");
    console.log(`Liked dishes for ${userA}: ${JSON.stringify(liked)}`);

    console.log(`--- End Test: removeLikedDish - success scenarios ---`);
  });

  await test.step("Action: removeLikedDish - failure scenarios", async () => {
    console.log(`--- Test: removeLikedDish - failure scenarios ---`);

    // Precondition: userA currently likes no dishes
    console.log(`Setup: Verify ${userA} likes no dishes.`);
    let liked = await concept._getLikedDishes({ user: userA });
    assertEquals(liked, [], "Setup: User A should like no dishes.");

    // Scenario 1: Remove a dish that is not liked
    console.log(`Action: ${userA} attempts to remove ${dish5} (not liked).`);
    let result = await concept.removeLikedDish({ user: userA, dish: dish5 });
    assertEquals(
      result,
      { error: `Dish ${dish5} is not in liked dishes for user ${userA}` },
      "removeLikedDish should fail if dish is not liked.",
    );

    // Scenario 2: Remove a dish for a non-existent user record in this concept
    const nonExistentUser = "user:nonexistent" as ID;
    console.log(`Action: Attempt to remove liked dish for non-existent user ${nonExistentUser}.`);
    result = await concept.removeLikedDish({ user: nonExistentUser, dish: dish1 });
    assertEquals(
      result,
      { error: `User ${nonExistentUser} not found in taste preferences` },
      "removeLikedDish should fail if user record does not exist.",
    );

    console.log(`--- End Test: removeLikedDish - failure scenarios ---`);
  });

  await test.step("Action: addDislikedDish - success scenarios", async () => {
    console.log(`--- Test: addDislikedDish - success scenarios ---`);

    // Scenario 1: Add a new disliked dish for a new user
    const newDishForNewUser = "dish:Tofu" as ID;
    const newNewUser = "user:Charlie" as ID;
    console.log(`Action: ${newNewUser} adds ${newDishForNewUser} to disliked dishes (new user).`);
    let result = await concept.addDislikedDish({ user: newNewUser, dish: newDishForNewUser });
    assertEquals(result, {}, "addDislikedDish should succeed for a new user.");
    let disliked = await concept._getDislikedDishes({ user: newNewUser });
    assertEquals(disliked, [{ dish: newDishForNewUser }], "User Charlie should have Tofu disliked.");
    console.log(`Disliked dishes for ${newNewUser}: ${JSON.stringify(disliked)}`);

    // Scenario 2: Add another disliked dish for an existing user (userB from previous tests)
    console.log(`Action: ${userB} adds ${dish4} to disliked dishes (existing user).`);
    result = await concept.addDislikedDish({ user: userB, dish: dish4 });
    assertEquals(result, {}, "addDislikedDish should succeed for an existing user.");
    disliked = await concept._getDislikedDishes({ user: userB });
    assertEquals(disliked, [{ dish: dish4 }], "User B should have dish 4 disliked.");
    console.log(`Disliked dishes for ${userB}: ${JSON.stringify(disliked)}`);

    // Scenario 3: Add a dish already disliked (idempotent)
    console.log(`Action: ${userB} re-adds ${dish4} to disliked dishes (already disliked).`);
    result = await concept.addDislikedDish({ user: userB, dish: dish4 });
    assertEquals(result, {}, "addDislikedDish should succeed (idempotent) if dish is already disliked.");
    disliked = await concept._getDislikedDishes({ user: userB });
    assertEquals(disliked, [{ dish: dish4 }], "User B's disliked dishes should remain the same.");
    console.log(`Disliked dishes for ${userB}: ${JSON.stringify(disliked)}`);

    // Scenario 4: Change mind from liked to disliked
    console.log(`Setup: ${userA} likes ${dish5}.`);
    await concept.addLikedDish({ user: userA, dish: dish5 });
    let likedA = await concept._getLikedDishes({ user: userA });
    assertEquals(likedA.map(d => d.dish).sort(), [dish5].sort(), "Setup: User A should like dish 5.");
    
    console.log(`Action: ${userA} adds ${dish5} to disliked dishes (was liked).`);
    result = await concept.addDislikedDish({ user: userA, dish: dish5 });
    assertEquals(result, {}, "addDislikedDish should succeed when moving from liked to disliked.");
    
    likedA = await concept._getLikedDishes({ user: userA });
    assertEquals(likedA, [], "Dish 5 should be removed from liked dishes for User A.");
    disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(disliked.map(d => d.dish).sort(), [dish4, dish5].sort(), "Dish 5 should be added to disliked dishes for User A.");

    console.log(`--- End Test: addDislikedDish - success scenarios ---`);
  });

  await test.step("Action: addDislikedDish - failure scenarios", async () => {
    console.log(`--- Test: addDislikedDish - failure scenarios ---`);

    // Precondition: dish is not in likedDishes for user
    console.log(`Setup: ${userA} likes ${dish1}.`); // dish1 was removed, re-add for this specific test
    await concept.addLikedDish({ user: userA, dish: dish1 });
    let liked = await concept._getLikedDishes({ user: userA });
    assertEquals(liked.map(d => d.dish).sort(), [dish1].sort(), "Setup: User A should like dish 1.");

    console.log(`Action: ${userA} attempts to dislike ${dish1} (which is liked).`);
    const result = await concept.addDislikedDish({ user: userA, dish: dish1 });
    assertEquals(
      result,
      { error: `Dish ${dish1} is in liked dishes for user ${userA}` },
      "addDislikedDish should fail if dish is in likedDishes.",
    );
    let disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(disliked.map(d => d.dish).sort(), [dish4, dish5].sort(), "Dish 1 should not be added to disliked dishes.");

    console.log(`--- End Test: addDislikedDish - failure scenarios ---`);
  });

  await test.step("Action: removeDislikedDish - success scenarios", async () => {
    console.log(`--- Test: removeDislikedDish - success scenarios ---`);

    // Precondition: userB already dislikes dish4 (from previous tests)
    console.log(`Setup: Verify ${userB} dislikes ${dish4}.`);
    let disliked = await concept._getDislikedDishes({ user: userB });
    assertEquals(disliked, [{ dish: dish4 }], "Setup: User B should dislike dish 4.");

    // Scenario 1: Remove an existing disliked dish
    console.log(`Action: ${userB} removes ${dish4} from disliked dishes.`);
    const result = await concept.removeDislikedDish({ user: userB, dish: dish4 });
    assertEquals(result, {}, "removeDislikedDish should succeed.");
    disliked = await concept._getDislikedDishes({ user: userB });
    assertEquals(disliked, [], "User B should no longer dislike dish 4.");
    console.log(`Disliked dishes for ${userB}: ${JSON.stringify(disliked)}`);

    console.log(`--- End Test: removeDislikedDish - success scenarios ---`);
  });

  await test.step("Action: removeDislikedDish - failure scenarios", async () => {
    console.log(`--- Test: removeDislikedDish - failure scenarios ---`);

    // Precondition: userB currently dislikes no dishes
    console.log(`Setup: Verify ${userB} dislikes no dishes.`);
    let disliked = await concept._getDislikedDishes({ user: userB });
    assertEquals(disliked, [], "Setup: User B should dislike no dishes.");

    // Scenario 1: Remove a dish that is not disliked
    console.log(`Action: ${userB} attempts to remove ${dish1} (not disliked).`);
    let result = await concept.removeDislikedDish({ user: userB, dish: dish1 });
    assertEquals(
      result,
      { error: `Dish ${dish1} is not in disliked dishes for user ${userB}` },
      "removeDislikedDish should fail if dish is not disliked.",
    );

    // Scenario 2: Remove a dish for a non-existent user record in this concept
    const nonExistentUser = "user:dan" as ID;
    console.log(`Action: Attempt to remove disliked dish for non-existent user ${nonExistentUser}.`);
    result = await concept.removeDislikedDish({ user: nonExistentUser, dish: dish1 });
    assertEquals(
      result,
      { error: `User ${nonExistentUser} not found in taste preferences` },
      "removeDislikedDish should fail if user record does not exist.",
    );

    console.log(`--- End Test: removeDislikedDish - failure scenarios ---`);
  });

  await test.step("Query: _getLikedDishes", async () => {
    console.log(`--- Test: _getLikedDishes query ---`);

    // Setup: Add some liked dishes for userA
    await concept.addLikedDish({ user: userA, dish: dish1 });
    await concept.addLikedDish({ user: userA, dish: dish5 });
    console.log(`Setup: ${userA} likes ${dish1} and ${dish5}.`);

    // Query for userA's liked dishes
    console.log(`Query: Get liked dishes for ${userA}.`);
    const likedDishes = await concept._getLikedDishes({ user: userA });
    assertEquals(
      likedDishes.map((d) => d.dish).sort(),
      [dish1, dish5].sort(),
      "Should return all liked dishes for user A.",
    );
    console.log(`Liked dishes for ${userA}: ${JSON.stringify(likedDishes)}`);

    // Query for a user with no liked dishes (userB has no liked dishes at this point)
    console.log(`Query: Get liked dishes for ${userB} (no liked dishes).`);
    const likedDishesB = await concept._getLikedDishes({ user: userB });
    assertEquals(likedDishesB, [], "Should return an empty array for user B (no liked dishes).");
    console.log(`Liked dishes for ${userB}: ${JSON.stringify(likedDishesB)}`);

    // Query for a non-existent user
    const nonExistentUser = "user:Eve" as ID;
    console.log(`Query: Get liked dishes for non-existent user ${nonExistentUser}.`);
    const errorResult = await concept._getLikedDishes({ user: nonExistentUser });
    assertEquals(
      errorResult,
      { error: `User ${nonExistentUser} not found in taste preferences` },
      "Should return an error for a non-existent user.",
    );

    console.log(`--- End Test: _getLikedDishes query ---`);
  });

  await test.step("Query: _getDislikedDishes", async () => {
    console.log(`--- Test: _getDislikedDishes query ---`);

    // Setup: Add some disliked dishes for userA
    // dish4 and dish5 should be disliked by userA from previous tests
    // Let's ensure dish4 is still disliked from `addDislikedDish - failure scenarios` test
    await concept.addDislikedDish({ user: userA, dish: dish4 });
    console.log(`Setup: ${userA} dislikes ${dish4}.`);


    // Query for userA's disliked dishes
    console.log(`Query: Get disliked dishes for ${userA}.`);
    const dislikedDishes = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      dislikedDishes.map((d) => d.dish).sort(),
      [dish4].sort(), // dish5 was moved from disliked to liked and then back to liked. Let's make sure.
      "Should return all disliked dishes for user A.",
    );
    console.log(`Disliked dishes for ${userA}: ${JSON.stringify(dislikedDishes)}`);

    // Query for a user with no disliked dishes (userB has no disliked dishes at this point)
    console.log(`Query: Get disliked dishes for ${userB} (no disliked dishes).`);
    const dislikedDishesB = await concept._getDislikedDishes({ user: userB });
    assertEquals(dislikedDishesB, [], "Should return an empty array for user B (no disliked dishes).");
    console.log(`Disliked dishes for ${userB}: ${JSON.stringify(dislikedDishesB)}`);

    // Query for a non-existent user
    const nonExistentUser = "user:Frank" as ID;
    console.log(`Query: Get disliked dishes for non-existent user ${nonExistentUser}.`);
    const errorResult = await concept._getDislikedDishes({ user: nonExistentUser });
    assertEquals(
      errorResult,
      { error: `User ${nonExistentUser} not found in taste preferences` },
      "Should return an error for a non-existent user.",
    );

    console.log(`--- End Test: _getDislikedDishes query ---`);
  });

  await client.close();
});
```
