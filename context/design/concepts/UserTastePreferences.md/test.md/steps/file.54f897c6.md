---
timestamp: 'Thu Oct 16 2025 23:28:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_232800.cdc82530.md]]'
content_id: 54f897c640918699862da853e4fd0fefadb911d2d30cce10510664bf716af772
---

# file: src/concepts/UserTastePreferencesConcept.test.ts

```typescript
import { assertArrayIncludes, assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserTastePreferencesConcept from "./UserTastePreferencesConcept.ts";

// Define some consistent IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID; // Added userCharlie definition
const dishPizza = "dish:Pizza" as ID;
const dishSushi = "dish:Sushi" as ID;
const dishBurger = "dish:Burger" as ID;
const dishSalad = "dish:Salad" as ID;
const dishTacos = "dish:Tacos" as ID;
const nonExistentUser = "user:NonExistent" as ID;

Deno.test("Principle: User adds liked dish, preference recorded, influences recommendations", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log(`Action: ${userAlice} adds ${dishPizza} to liked dishes.`);
    const result = await concept.addLikedDish({
      user: userAlice,
      dish: dishPizza,
    });
    assertEquals(
      "error" in result,
      false,
      `Expected addLikedDish to succeed, got error: ${JSON.stringify(result)}`,
    );

    console.log(`Query: Get liked dishes for ${userAlice}.`);
    const likedDishes = await concept._getLikedDishes({ user: userAlice });
    assertEquals(
      "error" in likedDishes,
      false,
      `Expected _getLikedDishes to succeed, got error: ${
        JSON.stringify(likedDishes)
      }`,
    );
    assertArrayIncludes((likedDishes as { dish: ID }[]).map((d) => d.dish), [
      dishPizza,
    ], `Expected ${dishPizza} to be in ${userAlice}'s liked dishes.`);
    assertEquals(
      (likedDishes as { dish: ID }[]).length,
      1,
      `Expected only 1 liked dish for ${userAlice}.`,
    );

    console.log("Successfully recorded User's preference.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: addLikedDish - Success scenarios", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step("Add liked dish for a new user", async () => {
      console.log(`Action: ${userAlice} adds ${dishPizza} to liked dishes (new user).`);
      const result = await concept.addLikedDish({
        user: userAlice,
        dish: dishPizza,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected addLikedDish to succeed, got error: ${
          JSON.stringify(result)
        }`,
      );
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals("error" in liked, false); // Ensure no error on query
      assertArrayIncludes((liked as { dish: ID }[]).map((d) => d.dish), [
        dishPizza,
      ]);
      assertEquals((liked as { dish: ID }[]).length, 1);
    });

    await t.step("Add liked dish for an existing user", async () => {
      console.log(`Action: ${userAlice} adds ${dishSushi} to liked dishes (existing user).`);
      const result = await concept.addLikedDish({
        user: userAlice,
        dish: dishSushi,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected addLikedDish to succeed, got error: ${
          JSON.stringify(result)
        }`,
      );
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals("error" in liked, false); // Ensure no error on query
      assertArrayIncludes((liked as { dish: ID }[]).map((d) => d.dish), [
        dishPizza,
        dishSushi,
      ]);
      assertEquals((liked as { dish: ID }[]).length, 2);
    });

    await t.step("Add an already liked dish (idempotency)", async () => {
      console.log(`Action: ${userAlice} adds ${dishPizza} again (idempotent).`);
      const result = await concept.addLikedDish({
        user: userAlice,
        dish: dishPizza,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected addLikedDish to succeed.`,
      );
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals("error" in liked, false); // Ensure no error on query
      assertEquals(
        (liked as { dish: ID }[]).length,
        2,
        "Expected number of liked dishes to remain 2 (idempotent).",
      );
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addLikedDish - Moving preference from disliked to liked", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step(
      "If dish was disliked, liking it should move it to liked and remove from disliked",
      async () => {
        console.log(`Setup: ${userAlice} dislikes ${dishSalad}.`);
        await concept.addDislikedDish({ user: userAlice, dish: dishSalad });
        let disliked = await concept._getDislikedDishes({ user: userAlice });
        assertEquals("error" in disliked, false);
        assertArrayIncludes((disliked as { dish: ID }[]).map((d) => d.dish), [
          dishSalad,
        ]);
        let liked = await concept._getLikedDishes({ user: userAlice });
        assertEquals("error" in liked, false);
        assertEquals((liked as { dish: ID }[]).length, 0);

        console.log(`Action: ${userAlice} now likes ${dishSalad}.`);
        const result = await concept.addLikedDish({
          user: userAlice,
          dish: dishSalad,
        });
        assertEquals(
          "error" in result,
          false,
          `Expected addLikedDish to succeed, got error: ${JSON.stringify(result)}`,
        );

        liked = await concept._getLikedDishes({ user: userAlice });
        assertEquals("error" in liked, false);
        assertArrayIncludes((liked as { dish: ID }[]).map((d) => d.dish), [
          dishSalad,
        ], `Expected ${dishSalad} to be liked.`);
        disliked = await concept._getDislikedDishes({ user: userAlice });
        assertEquals("error" in disliked, false);
        assertEquals(
          (disliked as { dish: ID }[]).length,
          0,
          `Expected ${dishSalad} to be removed from disliked.`,
        );
      },
    );
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
    assertEquals("error" in liked, false);
    assertArrayIncludes((liked as { dish: ID }[]).map((d) => d.dish), [
      dishPizza,
    ]);

    await t.step("Successfully remove liked dish", async () => {
      console.log(`Action: ${userAlice} removes ${dishPizza} from liked.`);
      const result = await concept.removeLikedDish({
        user: userAlice,
        dish: dishPizza,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected removeLikedDish to succeed, got error: ${
          JSON.stringify(result)
        }`,
      );

      liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals("error" in liked, false);
      assertEquals(
        (liked as { dish: ID }[]).length,
        0,
        `Expected ${userAlice} to have no liked dishes.`,
      );
    });

    await t.step("Fail to remove liked dish if not liked", async () => {
      console.log(
        `Action: ${userAlice} tries to remove ${dishSushi} (not liked).`,
      );
      // Ensure Alice's document exists, but she doesn't like dishSushi
      await concept.ensureUserDocument(userAlice);
      const result = await concept.removeLikedDish({
        user: userAlice,
        dish: dishSushi,
      });
      assertEquals(
        "error" in result,
        true,
        "Expected removeLikedDish to fail if dish is not liked.",
      );
      assertEquals(
        (result as { error: string }).error,
        `Dish ${dishSushi} is not in liked dishes for user ${userAlice}`,
      );
    });

    await t.step(
      "Fail to remove liked dish for non-existent user",
      async () => {
        console.log(
          `Action: ${nonExistentUser} tries to remove ${dishBurger}.`,
        );
        const result = await concept.removeLikedDish({
          user: nonExistentUser,
          dish: dishBurger,
        });
        assertEquals(
          "error" in result,
          true,
          "Expected removeLikedDish to fail for non-existent user.",
        );
        assertEquals(
          (result as { error: string }).error,
          `User ${nonExistentUser} not found in taste preferences`,
        );
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: addDislikedDish - Success scenarios", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step("Add disliked dish for a new user", async () => {
      console.log(`Action: ${userBob} adds ${dishBurger} to disliked dishes (new user).`);
      const result = await concept.addDislikedDish({
        user: userBob,
        dish: dishBurger,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected addDislikedDish to succeed, got error: ${
          JSON.stringify(result)
        }`,
      );
      const disliked = await concept._getDislikedDishes({ user: userBob });
      assertEquals("error" in disliked, false);
      assertArrayIncludes((disliked as { dish: ID }[]).map((d) => d.dish), [
        dishBurger,
      ]);
      assertEquals((disliked as { dish: ID }[]).length, 1);
    });

    await t.step("Add disliked dish for an existing user", async () => {
      console.log(`Action: ${userBob} adds ${dishSalad} to disliked dishes (existing user).`);
      const result = await concept.addDislikedDish({
        user: userBob,
        dish: dishSalad,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected addDislikedDish to succeed, got error: ${
          JSON.stringify(result)
        }`,
      );
      const disliked = await concept._getDislikedDishes({ user: userBob });
      assertEquals("error" in disliked, false);
      assertArrayIncludes((disliked as { dish: ID }[]).map((d) => d.dish), [
        dishBurger,
        dishSalad,
      ]);
      assertEquals((disliked as { dish: ID }[]).length, 2);
    });

    await t.step("Add an already disliked dish (idempotency)", async () => {
      console.log(`Action: ${userBob} adds ${dishBurger} again (idempotent).`);
      const result = await concept.addDislikedDish({
        user: userBob,
        dish: dishBurger,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected addDislikedDish to succeed.`,
      );
      const disliked = await concept._getDislikedDishes({ user: userBob });
      assertEquals("error" in disliked, false);
      assertEquals(
        (disliked as { dish: ID }[]).length,
        2,
        "Expected number of disliked dishes to remain 2 (idempotent).",
      );
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addDislikedDish - Moving preference from liked to disliked", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    await t.step(
      "If dish was liked, disliking it should move it to disliked and remove from liked",
      async () => {
        console.log(`Setup: ${userBob} likes ${dishTacos}.`);
        await concept.addLikedDish({ user: userBob, dish: dishTacos });
        let liked = await concept._getLikedDishes({ user: userBob });
        assertEquals("error" in liked, false);
        assertArrayIncludes((liked as { dish: ID }[]).map((d) => d.dish), [
          dishTacos,
        ]);
        let disliked = await concept._getDislikedDishes({ user: userBob });
        assertEquals("error" in disliked, false);
        assertEquals((disliked as { dish: ID }[]).length, 0);

        console.log(`Action: ${userBob} now dislikes ${dishTacos}.`);
        const result = await concept.addDislikedDish({
          user: userBob,
          dish: dishTacos,
        });
        assertEquals(
          "error" in result,
          false,
          `Expected addDislikedDish to succeed, got error: ${JSON.stringify(result)}`,
        );

        disliked = await concept._getDislikedDishes({ user: userBob });
        assertEquals("error" in disliked, false);
        assertArrayIncludes((disliked as { dish: ID }[]).map((d) => d.dish), [
          dishTacos,
        ], `Expected ${dishTacos} to be disliked.`);
        liked = await concept._getLikedDishes({ user: userBob });
        assertEquals("error" in liked, false);
        assertEquals(
          (liked as { dish: ID }[]).length,
          0,
          `Expected ${dishTacos} to be removed from liked.`,
        );
      },
    );
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
    assertEquals("error" in disliked, false);
    assertArrayIncludes((disliked as { dish: ID }[]).map((d) => d.dish), [
      dishBurger,
    ]);

    await t.step("Successfully remove disliked dish", async () => {
      console.log(`Action: ${userBob} removes ${dishBurger} from disliked.`);
      const result = await concept.removeDislikedDish({
        user: userBob,
        dish: dishBurger,
      });
      assertEquals(
        "error" in result,
        false,
        `Expected removeDislikedDish to succeed, got error: ${
          JSON.stringify(result)
        }`,
      );

      disliked = await concept._getDislikedDishes({ user: userBob });
      assertEquals("error" in disliked, false);
      assertEquals(
        (disliked as { dish: ID }[]).length,
        0,
        `Expected ${userBob} to have no disliked dishes.`,
      );
    });

    await t.step("Fail to remove disliked dish if not disliked", async () => {
      console.log(
        `Action: ${userBob} tries to remove ${dishSalad} (not disliked).`,
      );
      // Ensure Bob's document exists, but he doesn't dislike dishSalad
      await concept.ensureUserDocument(userBob);
      const result = await concept.removeDislikedDish({
        user: userBob,
        dish: dishSalad,
      });
      assertEquals(
        "error" in result,
        true,
        "Expected removeDislikedDish to fail if dish is not disliked.",
      );
      assertEquals(
        (result as { error: string }).error,
        `Dish ${dishSalad} is not in disliked dishes for user ${userBob}`,
      );
    });

    await t.step(
      "Fail to remove disliked dish for non-existent user",
      async () => {
        console.log(`Action: ${nonExistentUser} tries to remove ${dishSalad}.`);
        const result = await concept.removeDislikedDish({
          user: nonExistentUser,
          dish: dishSalad,
        });
        assertEquals(
          "error" in result,
          true,
          "Expected removeDislikedDish to fail for non-existent user.",
        );
        assertEquals(
          (result as { error: string }).error,
          `User ${nonExistentUser} not found in taste preferences`,
        );
      },
    );
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

    // Setup for Bob: likes Sushi, Tacos (will not have disliked dishes)
    await concept.addLikedDish({ user: userBob, dish: dishSushi });
    await concept.addLikedDish({ user: userBob, dish: dishTacos });

    // Setup for Charlie: Ensure document exists, but with no initial preferences
    // This makes sure queries for Charlie return empty arrays, not errors.
    await concept.ensureUserDocument(userCharlie);


    await t.step("Get liked dishes for a user with liked dishes", async () => {
      console.log(`Query: Get liked dishes for ${userAlice}.`);
      const liked = await concept._getLikedDishes({ user: userAlice });
      assertEquals("error" in liked, false);
      assertArrayIncludes((liked as { dish: ID }[]).map((d) => d.dish), [
        dishPizza,
      ]);
      assertEquals((liked as { dish: ID }[]).length, 1);
    });

    await t.step(
      "Get disliked dishes for a user with disliked dishes",
      async () => {
        console.log(`Query: Get disliked dishes for ${userAlice}.`);
        const disliked = await concept._getDislikedDishes({ user: userAlice });
        assertEquals("error" in disliked, false);
        assertArrayIncludes((disliked as { dish: ID }[]).map((d) => d.dish), [
          dishBurger,
        ]);
        assertEquals((disliked as { dish: ID }[]).length, 1);
      },
    );

    await t.step(
      "Get liked dishes for a user who exists but has no liked dishes (e.g., userCharlie)",
      async () => {
        console.log(`Query: Get liked dishes for ${userCharlie} (no preferences).`);
        const charlieLiked = await concept._getLikedDishes({ user: userCharlie });
        assertEquals("error" in charlieLiked, false);
        assertEquals((charlieLiked as { dish: ID }[]).length, 0, `Expected ${userCharlie} to have 0 liked dishes.`);
      },
    );

    await t.step(
      "Get disliked dishes for a user who exists but has no disliked dishes (e.g., userBob)",
      async () => {
        console.log(`Query: Get disliked dishes for ${userBob} (only liked ${dishSushi}, ${dishTacos}).`);
        const disliked = await concept._getDislikedDishes({
          user: userBob,
        });
        assertEquals("error" in disliked, false);
        assertEquals((disliked as { dish: ID }[]).length, 0);
      },
    );

    await t.step("Get liked dishes for a non-existent user", async () => {
      console.log(`Query: Get liked dishes for ${nonExistentUser}.`);
      const liked = await concept._getLikedDishes({ user: nonExistentUser });
      assertEquals(
        "error" in liked,
        true,
        "Expected query to fail for non-existent user in concept state.",
      );
      assertEquals(
        (liked as { error: string }).error,
        `User ${nonExistentUser} not found in taste preferences`,
      );
    });
    await t.step("Get disliked dishes for a non-existent user", async () => {
      console.log(`Query: Get disliked dishes for ${nonExistentUser}.`);
      const disliked = await concept._getDislikedDishes({
        user: nonExistentUser,
      });
      assertEquals(
        "error" in disliked,
        true,
        "Expected query to fail for non-existent user in concept state.",
      );
      assertEquals(
        (disliked as { error: string }).error,
        `User ${nonExistentUser} not found in taste preferences`,
      );
    });
  } finally {
    await client.close();
  }
});
```
