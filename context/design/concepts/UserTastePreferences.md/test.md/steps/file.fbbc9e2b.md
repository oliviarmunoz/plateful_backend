---
timestamp: 'Thu Oct 16 2025 23:35:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_233559.38b08fb0.md]]'
content_id: fbbc9e2b1383a165691597d695f8351d7baaed7f491be8d7608a0bca815270b6
---

# file: src/concepts/UserTastePreferencesConcept/UserTastePreferencesConcept.test.ts

```typescript
import { assertEquals, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserTastePreferencesConcept from "./UserTastePreferencesConcept.ts";

// Define mock IDs for testing
const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;
const dish1 = "dish:Pasta" as ID;
const dish2 = "dish:Salad" as ID;
const dish3 = "dish:Sushi" as ID;
const dish4 = "dish:Pizza" as ID;

Deno.test("Principle: User preferences are recorded and updated, influencing recommendations (via internal state)", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log(
      "--- Principle Test: User preferences are recorded and updated ---",
    );

    console.log(`Action: ${userA} adds ${dish1} to liked dishes.`);
    const likedResult1 = await concept.addLikedDish({
      user: userA,
      dish: dish1,
    });
    assertEquals(
      "error" in likedResult1,
      false,
      `addLikedDish for ${dish1} should succeed.`,
    );

    console.log(`Query: Get liked dishes for ${userA}.`);
    let likedDishes = await concept._getLikedDishes({ user: userA });
    assertEquals(
      likedDishes.map((d) => d.dishes),
      [dish1],
      `${userA} should have ${dish1} in liked dishes.`,
    );

    console.log(`Action: ${userA} adds ${dish2} to liked dishes.`);
    const likedResult2 = await concept.addLikedDish({
      user: userA,
      dish: dish2,
    });
    assertEquals(
      "error" in likedResult2,
      false,
      `addLikedDish for ${dish2} should succeed.`,
    );

    console.log(`Query: Get liked dishes for ${userA}.`);
    likedDishes = await concept._getLikedDishes({ user: userA });
    assertEquals(
      likedDishes.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      `${userA} should have ${dish1}, ${dish2} in liked dishes.`,
    );

    console.log(
      `Action: ${userA} adds ${dish1} to disliked dishes (should move from liked).`,
    );
    const dislikedResult1 = await concept.addDislikedDish({
      user: userA,
      dish: dish1,
    });
    assertEquals(
      "error" in dislikedResult1,
      false,
      `addDislikedDish for ${dish1} should succeed.`,
    );

    console.log(`Query: Get liked dishes for ${userA}.`);
    likedDishes = await concept._getLikedDishes({ user: userA });
    assertEquals(
      likedDishes.map((d) => d.dishes),
      [dish2],
      `${userA} should now only have ${dish2} in liked dishes.`,
    );

    console.log(`Query: Get disliked dishes for ${userA}.`);
    let dislikedDishes = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      dislikedDishes.map((d) => d.dishes),
      [dish1],
      `${userA} should have ${dish1} in disliked dishes.`,
    );

    console.log(
      "Principle demonstrated: User preferences are recorded and can be moved between liked/disliked lists, forming a profile that would influence recommendations.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: addLikedDish - new user, existing user, existing disliked dish", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log("--- addLikedDish Test ---");

    // Test 1: Add a liked dish for a new user
    console.log(`Action: ${userA} adds ${dish1} as liked (new user).`);
    let result = await concept.addLikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addLikedDish for a new user should succeed.",
    );
    let liked = await concept._getLikedDishes({ user: userA });
    assertEquals(
      liked.map((d) => d.dishes),
      [dish1],
      `${userA} should have ${dish1} liked.`,
    );

    // Test 2: Add another liked dish for the same user
    console.log(`Action: ${userA} adds ${dish2} as liked (existing user).`);
    result = await concept.addLikedDish({ user: userA, dish: dish2 });
    assertEquals(
      "error" in result,
      false,
      "addLikedDish for an existing user should succeed.",
    );
    liked = await concept._getLikedDishes({ user: userA });
    assertEquals(
      liked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      `${userA} should have ${dish1}, ${dish2} liked.`,
    );

    // Test 3: Add a dish that was previously disliked (should move)
    console.log(`Action: ${userB} adds ${dish3} as disliked.`);
    await concept.addDislikedDish({ user: userB, dish: dish3 });
    let dislikedB = await concept._getDislikedDishes({ user: userB });
    assertEquals(
      dislikedB.map((d) => d.dishes),
      [dish3],
      `${userB} should have ${dish3} disliked.`,
    );

    console.log(`Action: ${userB} adds ${dish3} as liked (was disliked).`);
    result = await concept.addLikedDish({ user: userB, dish: dish3 });
    assertEquals(
      "error" in result,
      false,
      "addLikedDish should succeed when moving from disliked.",
    );
    let likedB = await concept._getLikedDishes({ user: userB });
    assertEquals(
      likedB.map((d) => d.dishes),
      [dish3],
      `${userB} should now have ${dish3} liked.`,
    );
    dislikedB = await concept._getDislikedDishes({ user: userB });
    assertEquals(
      dislikedB.map((d) => d.dishes),
      [],
      `${userB} should no longer have ${dish3} disliked.`,
    );

    // Test 4: Add a dish already liked (should not duplicate)
    console.log(
      `Action: ${userA} adds ${dish1} as liked again (already liked).`,
    );
    result = await concept.addLikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addLikedDish for already liked dish should succeed (no-op).",
    );
    liked = await concept._getLikedDishes({ user: userA });
    assertEquals(
      liked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      `${userA} liked dishes should remain unique.`,
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: removeLikedDish - existing, non-existent dish, non-existent user", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log("--- removeLikedDish Test ---");

    // Setup: UserA likes dish1 and dish2
    await concept.addLikedDish({ user: userA, dish: dish1 });
    await concept.addLikedDish({ user: userA, dish: dish2 });
    let liked = await concept._getLikedDishes({ user: userA });
    assertEquals(
      liked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      "Setup: UserA should have dish1 and dish2 liked.",
    );

    // Test 1: Remove an existing liked dish
    console.log(`Action: ${userA} removes ${dish1} from liked.`);
    let result = await concept.removeLikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "removeLikedDish for existing dish should succeed.",
    );
    liked = await concept._getLikedDishes({ user: userA });
    assertEquals(
      liked.map((d) => d.dishes),
      [dish2],
      `${userA} should only have ${dish2} liked.`,
    );

    // Test 2: Attempt to remove a dish not liked by the user
    console.log(`Action: ${userA} removes ${dish3} from liked (not liked).`);
    result = await concept.removeLikedDish({ user: userA, dish: dish3 });
    assertEquals(
      "error" in result,
      true,
      "removeLikedDish for non-liked dish should fail.",
    );
    assertEquals(
      (result as { error: string }).error,
      `Dish '${dish3}' is not in the liked dishes for user '${userA}'.`,
    );

    // Test 3: Attempt to remove for a non-existent user
    const nonExistentUser = "user:NonExistent" as ID;
    console.log(
      `Action: ${nonExistentUser} removes ${dish1} from liked (non-existent user).`,
    );
    result = await concept.removeLikedDish({
      user: nonExistentUser,
      dish: dish1,
    });
    assertEquals(
      "error" in result,
      true,
      "removeLikedDish for non-existent user should fail.",
    );
    assertEquals(
      (result as { error: string }).error,
      `User with ID '${nonExistentUser}' does not exist.`,
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: addDislikedDish - new user, existing user, existing liked dish", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log("--- addDislikedDish Test ---");

    // Test 1: Add a disliked dish for a new user
    console.log(`Action: ${userA} adds ${dish1} as disliked (new user).`);
    let result = await concept.addDislikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addDislikedDish for a new user should succeed.",
    );
    let disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      disliked.map((d) => d.dishes),
      [dish1],
      `${userA} should have ${dish1} disliked.`,
    );

    // Test 2: Add another disliked dish for the same user
    console.log(`Action: ${userA} adds ${dish2} as disliked (existing user).`);
    result = await concept.addDislikedDish({ user: userA, dish: dish2 });
    assertEquals(
      "error" in result,
      false,
      "addDislikedDish for an existing user should succeed.",
    );
    disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      disliked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      `${userA} should have ${dish1}, ${dish2} disliked.`,
    );

    // Test 3: Add a dish that was previously liked (should move)
    console.log(`Action: ${userB} adds ${dish3} as liked.`);
    await concept.addLikedDish({ user: userB, dish: dish3 });
    let likedB = await concept._getLikedDishes({ user: userB });
    assertEquals(
      likedB.map((d) => d.dishes),
      [dish3],
      `${userB} should have ${dish3} liked.`,
    );

    console.log(`Action: ${userB} adds ${dish3} as disliked (was liked).`);
    result = await concept.addDislikedDish({ user: userB, dish: dish3 });
    assertEquals(
      "error" in result,
      false,
      "addDislikedDish should succeed when moving from liked.",
    );
    let dislikedB = await concept._getDislikedDishes({ user: userB });
    assertEquals(
      dislikedB.map((d) => d.dishes),
      [dish3],
      `${userB} should now have ${dish3} disliked.`,
    );
    likedB = await concept._getLikedDishes({ user: userB });
    assertEquals(
      likedB.map((d) => d.dishes),
      [],
      `${userB} should no longer have ${dish3} liked.`,
    );

    // Test 4: Add a dish already disliked (should not duplicate)
    console.log(
      `Action: ${userA} adds ${dish1} as disliked again (already disliked).`,
    );
    result = await concept.addDislikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addDislikedDish for already disliked dish should succeed (no-op).",
    );
    disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      disliked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      `${userA} disliked dishes should remain unique.`,
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: removeDislikedDish - existing, non-existent dish, non-existent user", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log("--- removeDislikedDish Test ---");

    // Setup: UserA dislikes dish1 and dish2
    await concept.addDislikedDish({ user: userA, dish: dish1 });
    await concept.addDislikedDish({ user: userA, dish: dish2 });
    let disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      disliked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      "Setup: UserA should have dish1 and dish2 disliked.",
    );

    // Test 1: Remove an existing disliked dish
    console.log(`Action: ${userA} removes ${dish1} from disliked.`);
    let result = await concept.removeDislikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "removeDislikedDish for existing dish should succeed.",
    );
    disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      disliked.map((d) => d.dishes),
      [dish2],
      `${userA} should only have ${dish2} disliked.`,
    );

    // Test 2: Attempt to remove a dish not disliked by the user
    console.log(
      `Action: ${userA} removes ${dish3} from disliked (not disliked).`,
    );
    result = await concept.removeDislikedDish({ user: userA, dish: dish3 });
    assertEquals(
      "error" in result,
      true,
      "removeDislikedDish for non-disliked dish should fail.",
    );
    assertEquals(
      (result as { error: string }).error,
      `Dish '${dish3}' is not in the disliked dishes for user '${userA}'.`,
    );

    // Test 3: Attempt to remove for a non-existent user
    const nonExistentUser = "user:NonExistent" as ID;
    console.log(
      `Action: ${nonExistentUser} removes ${dish1} from disliked (non-existent user).`,
    );
    result = await concept.removeDislikedDish({
      user: nonExistentUser,
      dish: dish1,
    });
    assertEquals(
      "error" in result,
      true,
      "removeDislikedDish for non-existent user should fail.",
    );
    assertEquals(
      (result as { error: string }).error,
      `User with ID '${nonExistentUser}' does not exist.`,
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getLikedDishes - existing user with dishes, existing user no dishes, non-existent user", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log("--- _getLikedDishes Test ---");

    // Setup: UserA likes dish1, UserB has no preferences
    await concept.addLikedDish({ user: userA, dish: dish1 });

    // Test 1: Existing user with liked dishes
    console.log(`Query: Get liked dishes for ${userA}.`);
    let liked = await concept._getLikedDishes({ user: userA });
    assertEquals(
      liked.map((d) => d.dishes),
      [dish1],
      `Should return ${dish1} for ${userA}.`,
    );

    // Test 2: Existing user with no liked dishes (only disliked)
    console.log(`Action: ${userA} dislikes ${dish2}.`);
    await concept.addDislikedDish({ user: userA, dish: dish2 });
    console.log(`Action: ${userA} removes ${dish1} from liked.`);
    await concept.removeLikedDish({ user: userA, dish: dish1 });
    console.log(`Query: Get liked dishes for ${userA} (now empty).`);
    liked = await concept._getLikedDishes({ user: userA });
    assertEquals(
      liked,
      [],
      `Should return an empty array for ${userA} after removing liked dishes.`,
    );

    // Test 3: Non-existent user
    const nonExistentUser = "user:Ghost" as ID;
    console.log(
      `Query: Get liked dishes for ${nonExistentUser} (non-existent).`,
    );
    liked = await concept._getLikedDishes({ user: nonExistentUser });
    assertEquals(liked, [{
      error: `User with ID '${nonExistentUser}' does not exist.`,
    }], `Should return error for non-existent user.`);
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getDislikedDishes - existing user with dishes, existing user no dishes, non-existent user", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log("--- _getDislikedDishes Test ---");

    // Setup: UserA dislikes dish1, UserB has no preferences
    await concept.addDislikedDish({ user: userA, dish: dish1 });

    // Test 1: Existing user with disliked dishes
    console.log(`Query: Get disliked dishes for ${userA}.`);
    let disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      disliked.map((d) => d.dishes),
      [dish1],
      `Should return ${dish1} for ${userA}.`,
    );

    // Test 2: Existing user with no disliked dishes (only liked)
    console.log(`Action: ${userA} likes ${dish2}.`);
    await concept.addLikedDish({ user: userA, dish: dish2 });
    console.log(`Action: ${userA} removes ${dish1} from disliked.`);
    await concept.removeDislikedDish({ user: userA, dish: dish1 });
    console.log(`Query: Get disliked dishes for ${userA} (now empty).`);
    disliked = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      disliked,
      [],
      `Should return an empty array for ${userA} after removing disliked dishes.`,
    );

    // Test 3: Non-existent user
    const nonExistentUser = "user:Phantom" as ID;
    console.log(
      `Query: Get disliked dishes for ${nonExistentUser} (non-existent).`,
    );
    disliked = await concept._getDislikedDishes({ user: nonExistentUser });
    assertEquals(disliked, [{
      error: `User with ID '${nonExistentUser}' does not exist.`,
    }], `Should return error for non-existent user.`);
  } finally {
    await client.close();
  }
});

```
