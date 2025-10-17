---
timestamp: 'Thu Oct 16 2025 23:20:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_232028.0d14da47.md]]'
content_id: c3d4c630d88a60bbdd91616dcbf667858efd0bcbea2d9b40c2fae5173551cb9c
---

# file: src/usertastepreferences/UserTastePreferencesConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertArrayIncludes } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserTastePreferencesConcept from "./UserTastePreferencesConcept.ts";

// Define some consistent IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const dishPizza = "dish:Pizza" as ID;
const dishSushi = "dish:Sushi" as ID;
const dishBurger = "dish:Burger" as ID;
const dishSalad = "dish:Salad" as ID;
const dishTacos = "dish:Tacos" as ID;
const nonExistentUser = "user:NonExistent" as ID;
const nonExistentDish = "dish:NonExistent" as ID;

Deno.test("Principle: User adds liked dish, preference recorded, influences recommendations", async () => {
  console.log("\n--- Running Principle Test ---");
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log(`Action: ${userAlice} adds ${dishPizza} to liked dishes.`);
    const result = await concept.addLikedDish({ user: userAlice, dish: dishPizza });
    assertEquals("error" in result, false, `Expected addLikedDish to succeed, got error: ${JSON.stringify(result)}`);

    console.log(`Query: Get liked dishes for ${userAlice}.`);
    const likedDishes = await concept._getLikedDishes({ user: userAlice });
    assertEquals("error" in likedDishes, false, `Expected _getLikedDishes to succeed, got error: ${JSON.stringify(likedDishes)}`);
    assertArrayIncludes((likedDishes as { dish: ID }[]).map(d => d.dish), [dishPizza], `Expected ${dishPizza} to be in ${userAlice}'s liked dishes.`);
    assertEquals((likedDishes as { dish: ID }[]).length, 1, `Expected only 1 liked dish for ${userAlice}.`);

    console.log("Principle Fulfilled: User's preference for Pizza is recorded.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: addLikedDish - Success scenarios", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step("Add liked dish for a new user", async () => {
      console.log(`Action: ${userAlice} adds ${dishPizza} (new user).`);
      const result = await concept.addLikedDish({ user: userAlice, dish: dishPizza });
      assertEquals("error" in result, false, `Expected addLikedDish to succeed, got error: ${JSON.stringify(result)}`);
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishPizza]);
    });

    await t.step("Add liked dish for an existing user", async () => {
      console.log(`Action: ${userAlice} adds ${dishSushi} (existing user).`);
      const result = await concept.addLikedDish({ user: userAlice, dish: dishSushi });
      assertEquals("error" in result, false, `Expected addLikedDish to succeed, got error: ${JSON.stringify(result)}`);
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishPizza, dishSushi]);
    });

    await t.step("Add an already liked dish (idempotency)", async () => {
      console.log(`Action: ${userAlice} adds ${dishPizza} again.`);
      const result = await concept.addLikedDish({ user: userAlice, dish: dishPizza });
      assertEquals("error" in result, false, `Expected addLikedDish to succeed.`);
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals((liked as { dish: ID }[]).length, 2, "Expected number of liked dishes to remain 2 (idempotent).");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addLikedDish - Requirement enforcement (failure scenarios)", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step("Fail to add liked dish if already in dislikedDishes", async () => {
      console.log(`Setup: ${userBob} dislikes ${dishBurger}.`);
      await concept.addDislikedDish({ user: userBob, dish: dishBurger });
      const disliked = await concept._getDislikedDishes({ user: userBob });
      assertArrayIncludes((disliked as { dish: ID }[]).map(d => d.dish), [dishBurger]);

      console.log(`Action: ${userBob} tries to like ${dishBurger}.`);
      const result = await concept.addLikedDish({ user: userBob, dish: dishBurger });
      assertEquals("error" in result, true, "Expected addLikedDish to fail if dish is disliked.");
      assertEquals((result as { error: string }).error, `Dish ${dishBurger} is in disliked dishes for user ${userBob}`);

      const liked = await concept._getLikedDishes({ user: userBob });
      assertEquals((liked as { dish: ID }[]).length, 0, `Expected ${dishBurger} not to be in liked dishes.`);
    });

    await t.step("If dish was disliked, liking it should move it to liked and remove from disliked", async () => {
        console.log(`Setup: ${userAlice} dislikes ${dishSalad}.`);
        await concept.addDislikedDish({ user: userAlice, dish: dishSalad });
        let disliked = await concept._getDislikedDishes({ user: userAlice });
        assertArrayIncludes((disliked as { dish: ID }[]).map(d => d.dish), [dishSalad]);
        let liked = await concept._getLikedDishes({ user: userAlice });
        assertEquals((liked as { dish: ID }[]).length, 0);

        console.log(`Action: ${userAlice} now likes ${dishSalad}.`);
        const result = await concept.addLikedDish({ user: userAlice, dish: dishSalad });
        assertEquals("error" in result, false, `Expected addLikedDish to succeed.`);

        liked = await concept._getLikedDishes({ user: userAlice });
        assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishSalad], `Expected ${dishSalad} to be liked.`);
        disliked = await concept._getDislikedDishes({ user: userAlice });
        assertEquals((disliked as { dish: ID }[]).length, 0, `Expected ${dishSalad} to be removed from disliked.`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: removeLikedDish - Success and failure scenarios", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    // Setup: Alice likes Pizza
    await concept.addLikedDish({ user: userAlice, dish: dishPizza });
    let liked = await concept._getLikedDishes({ user: userAlice });
    assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishPizza]);

    await t.step("Successfully remove liked dish", async () => {
      console.log(`Action: ${userAlice} removes ${dishPizza} from liked.`);
      const result = await concept.removeLikedDish({ user: userAlice, dish: dishPizza });
      assertEquals("error" in result, false, `Expected removeLikedDish to succeed, got error: ${JSON.stringify(result)}`);

      liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals((liked as { dish: ID }[]).length, 0, `Expected ${userAlice} to have no liked dishes.`);
    });

    await t.step("Fail to remove liked dish if not liked", async () => {
      console.log(`Action: ${userAlice} tries to remove ${dishSushi} (not liked).`);
      const result = await concept.removeLikedDish({ user: userAlice, dish: dishSushi });
      assertEquals("error" in result, true, "Expected removeLikedDish to fail if dish is not liked.");
      assertEquals((result as { error: string }).error, `Dish ${dishSushi} is not in liked dishes for user ${userAlice}`);
    });

    await t.step("Fail to remove liked dish for non-existent user", async () => {
      console.log(`Action: ${nonExistentUser} tries to remove ${dishBurger}.`);
      const result = await concept.removeLikedDish({ user: nonExistentUser, dish: dishBurger });
      assertEquals("error" in result, true, "Expected removeLikedDish to fail for non-existent user.");
      assertEquals((result as { error: string }).error, `User ${nonExistentUser} not found in taste preferences`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addDislikedDish - Success scenarios", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step("Add disliked dish for a new user", async () => {
      console.log(`Action: ${userBob} adds ${dishBurger} (new user).`);
      const result = await concept.addDislikedDish({ user: userBob, dish: dishBurger });
      assertEquals("error" in result, false, `Expected addDislikedDish to succeed, got error: ${JSON.stringify(result)}`);
      const disliked = await concept._getDislikedDishes({ user: userBob });
      assertArrayIncludes((disliked as { dish: ID }[]).map(d => d.dish), [dishBurger]);
    });

    await t.step("Add disliked dish for an existing user", async () => {
      console.log(`Action: ${userBob} adds ${dishSalad} (existing user).`);
      const result = await concept.addDislikedDish({ user: userBob, dish: dishSalad });
      assertEquals("error" in result, false, `Expected addDislikedDish to succeed, got error: ${JSON.stringify(result)}`);
      const disliked = await concept._getDislikedDishes({ user: userBob });
      assertArrayIncludes((disliked as { dish: ID }[]).map(d => d.dish), [dishBurger, dishSalad]);
    });

    await t.step("Add an already disliked dish (idempotency)", async () => {
      console.log(`Action: ${userBob} adds ${dishBurger} again.`);
      const result = await concept.addDislikedDish({ user: userBob, dish: dishBurger });
      assertEquals("error" in result, false, `Expected addDislikedDish to succeed.`);
      const disliked = await concept._getDislikedDishes({ user: userBob });
      assertEquals((disliked as { dish: ID }[]).length, 2, "Expected number of disliked dishes to remain 2 (idempotent).");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addDislikedDish - Requirement enforcement (failure scenarios)", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step("Fail to add disliked dish if already in likedDishes", async () => {
      console.log(`Setup: ${userAlice} likes ${dishPizza}.`);
      await concept.addLikedDish({ user: userAlice, dish: dishPizza });
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishPizza]);

      console.log(`Action: ${userAlice} tries to dislike ${dishPizza}.`);
      const result = await concept.addDislikedDish({ user: userAlice, dish: dishPizza });
      assertEquals("error" in result, true, "Expected addDislikedDish to fail if dish is liked.");
      assertEquals((result as { error: string }).error, `Dish ${dishPizza} is in liked dishes for user ${userAlice}`);

      const disliked = await concept._getDislikedDishes({ user: userAlice });
      assertEquals((disliked as { dish: ID }[]).length, 0, `Expected ${dishPizza} not to be in disliked dishes.`);
    });

    await t.step("If dish was liked, disliking it should move it to disliked and remove from liked", async () => {
        console.log(`Setup: ${userBob} likes ${dishTacos}.`);
        await concept.addLikedDish({ user: userBob, dish: dishTacos });
        let liked = await concept._getLikedDishes({ user: userBob });
        assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishTacos]);
        let disliked = await concept._getDislikedDishes({ user: userBob });
        assertEquals((disliked as { dish: ID }[]).length, 0);

        console.log(`Action: ${userBob} now dislikes ${dishTacos}.`);
        const result = await concept.addDislikedDish({ user: userBob, dish: dishTacos });
        assertEquals("error" in result, false, `Expected addDislikedDish to succeed.`);

        disliked = await concept._getDislikedDishes({ user: userBob });
        assertArrayIncludes((disliked as { dish: ID }[]).map(d => d.dish), [dishTacos], `Expected ${dishTacos} to be disliked.`);
        liked = await concept._getLikedDishes({ user: userBob });
        assertEquals((liked as { dish: ID }[]).length, 0, `Expected ${dishTacos} to be removed from liked.`);
    });
  } finally {
    await client.close();
  }
});


Deno.test("Action: removeDislikedDish - Success and failure scenarios", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    // Setup: Bob dislikes Burger
    await concept.addDislikedDish({ user: userBob, dish: dishBurger });
    let disliked = await concept._getDislikedDishes({ user: userBob });
    assertArrayIncludes((disliked as { dish: ID }[]).map(d => d.dish), [dishBurger]);

    await t.step("Successfully remove disliked dish", async () => {
      console.log(`Action: ${userBob} removes ${dishBurger} from disliked.`);
      const result = await concept.removeDislikedDish({ user: userBob, dish: dishBurger });
      assertEquals("error" in result, false, `Expected removeDislikedDish to succeed, got error: ${JSON.stringify(result)}`);

      disliked = await concept._getDislikedDishes({ user: userBob });
      assertEquals((disliked as { dish: ID }[]).length, 0, `Expected ${userBob} to have no disliked dishes.`);
    });

    await t.step("Fail to remove disliked dish if not disliked", async () => {
      console.log(`Action: ${userBob} tries to remove ${dishSalad} (not disliked).`);
      const result = await concept.removeDislikedDish({ user: userBob, dish: dishSalad });
      assertEquals("error" in result, true, "Expected removeDislikedDish to fail if dish is not disliked.");
      assertEquals((result as { error: string }).error, `Dish ${dishSalad} is not in disliked dishes for user ${userBob}`);
    });

    await t.step("Fail to remove disliked dish for non-existent user", async () => {
      console.log(`Action: ${nonExistentUser} tries to remove ${dishSalad}.`);
      const result = await concept.removeDislikedDish({ user: nonExistentUser, dish: dishSalad });
      assertEquals("error" in result, true, "Expected removeDislikedDish to fail for non-existent user.");
      assertEquals((result as { error: string }).error, `User ${nonExistentUser} not found in taste preferences`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Queries: _getLikedDishes and _getDislikedDishes", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    // Setup for Alice: likes Pizza, dislikes Burger
    await concept.addLikedDish({ user: userAlice, dish: dishPizza });
    await concept.addDislikedDish({ user: userAlice, dish: dishBurger });
    // Setup for Bob: no preferences initially
    // Setup for Charlie: likes Sushi, likes Tacos
    await concept.addLikedDish({ user: userBob, dish: dishSushi });
    await concept.addLikedDish({ user: userBob, dish: dishTacos });


    await t.step("Get liked dishes for a user with liked dishes", async () => {
      console.log(`Query: Get liked dishes for ${userAlice}.`);
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals("error" in liked, false);
      assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishPizza]);
      assertEquals((liked as { dish: ID }[]).length, 1);
    });

    await t.step("Get disliked dishes for a user with disliked dishes", async () => {
      console.log(`Query: Get disliked dishes for ${userAlice}.`);
      const disliked = await concept._getDislikedDishes({ user: userAlice });
      assertEquals("error" in disliked, false);
      assertArrayIncludes((disliked as { dish: ID }[]).map(d => d.dish), [dishBurger]);
      assertEquals((disliked as { dish: ID }[]).length, 1);
    });

    await t.step("Get liked dishes for a user with no preferences", async () => {
      console.log(`Query: Get liked dishes for ${userCharlie} (no preferences).`);
      const liked = await concept._getLikedDishes({ user: userCharlie });
      assertEquals("error" in liked, false);
      assertEquals((liked as { dish: ID }[]).length, 0); // User created by addLikedDish, but no dishes.
    });

     await t.step("Get disliked dishes for a user with no preferences", async () => {
      console.log(`Query: Get disliked dishes for ${userCharlie} (no preferences).`);
      const disliked = await concept._getDislikedDishes({ user: userCharlie });
      assertEquals("error" in disliked, false);
      assertEquals((disliked as { dish: ID }[]).length, 0); // User created by addLikedDish, but no dishes.
    });


    await t.step("Get liked dishes for a user that only exists in liked, not disliked", async () => {
      await concept.addLikedDish({ user: userBob, dish: dishPizza });
      const liked = await concept._getLikedDishes({ user: userBob });
      assertEquals("error" in liked, false);
      assertArrayIncludes((liked as { dish: ID }[]).map(d => d.dish), [dishPizza]);
    });

    await t.step("Get disliked dishes for a non-existent user", async () => {
      console.log(`Query: Get disliked dishes for ${nonExistentUser}.`);
      const disliked = await concept._getDislikedDishes({ user: nonExistentUser });
      assertEquals("error" in disliked, true, "Expected query to fail for non-existent user in concept state.");
      assertEquals((disliked as { error: string }).error, `User ${nonExistentUser} not found in taste preferences`);
    });
  } finally {
    await client.close();
  }
});
```
