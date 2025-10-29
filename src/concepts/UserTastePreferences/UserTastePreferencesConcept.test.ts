import { assertEquals, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserTastePreferencesConcept from "./UserTastePreferencesConcept.ts";

/**
 * concept UserTastePreferences [User, Dish]

  purpose enable users to mark dishes as liked or disliked to build a profile of their taste preferences

  principle when a user adds a dish to their liked list, that preference is recorded, influencing future recommendations

  state
    a set of Users with
      a set of likedDishes Dish
      a set of dislikedDishes Dish

  actions
    addLikedDish (user: User, dish: Dish)
      requires:
      effects: add dish to likedDishes for user. If user record does not exist, create it first with empty lists. If dish was previously in dislikedDishes, it is removed from there.

    removeLikedDish (user: User, dish: Dish)
      requires: user exists, dish is in likedDishes for user
      effects: remove dish from likedDishes for user

    addDislikedDish (user: User, dish: Dish)
      requires:
      effects: add dish to dislikedDishes for user. If user record does not exist, create it first with empty lists. If dish was previously in likedDishes, it is removed from there.

    removeDislikedDish (user: User, dish: Dish)
      requires: user exists, dish exists, dish is in dislikedDishes for user
      effects: remove dish from dislikedDishes for user

    _getLikedDishes (user: User): (dishes: set(Dish))
      requires: user exists
      effects: returns all dishes liked by the specified user

    _getDislikedDishes (user: User): (dishes: set(Dish))
      requires: user exists
      effects: returns all dishes disliked by the specified user
 */

const userA = "user:Alice" as ID;
const userB = "user:Bob" as ID;
const dish1 = "dish:Pasta" as ID;
const dish2 = "dish:Salad" as ID;
const dish3 = "dish:Sushi" as ID;

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
    let likedDishesQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedDishesQueryResult.length > 0 && "error" in likedDishesQueryResult[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    let likedDishes = likedDishesQueryResult as { dishes: ID }[];
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
    likedDishesQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedDishesQueryResult.length > 0 && "error" in likedDishesQueryResult[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    likedDishes = likedDishesQueryResult as { dishes: ID }[];
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
    likedDishesQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedDishesQueryResult.length > 0 && "error" in likedDishesQueryResult[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    likedDishes = likedDishesQueryResult as { dishes: ID }[];
    assertEquals(
      likedDishes.map((d) => d.dishes),
      [dish2],
      `${userA} should now only have ${dish2} in liked dishes.`,
    );

    console.log(`Query: Get disliked dishes for ${userA}.`);
    const dislikedDishesQueryResult = await concept._getDislikedDishes({
      user: userA,
    });
    assertNotEquals(
      dislikedDishesQueryResult.length > 0 &&
        "error" in dislikedDishesQueryResult[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    const dislikedDishes = dislikedDishesQueryResult as { dishes: ID }[];
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

    // Add a liked dish for a new user
    console.log(`Action: ${userA} adds ${dish1} as liked (new user).`);
    let result = await concept.addLikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addLikedDish for a new user should succeed.",
    );
    let likedQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedQueryResult.length > 0 && "error" in likedQueryResult[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    let liked = likedQueryResult as { dishes: ID }[];
    assertEquals(
      liked.map((d) => d.dishes),
      [dish1],
      `${userA} should have ${dish1} liked.`,
    );

    // Add another liked dish for the same user
    console.log(`Action: ${userA} adds ${dish2} as liked (existing user).`);
    result = await concept.addLikedDish({ user: userA, dish: dish2 });
    assertEquals(
      "error" in result,
      false,
      "addLikedDish for an existing user should succeed.",
    );
    likedQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedQueryResult.length > 0 && "error" in likedQueryResult[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    liked = likedQueryResult as { dishes: ID }[];
    assertEquals(
      liked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      `${userA} should have ${dish1}, ${dish2} liked.`,
    );

    // Add a dish that was previously disliked (should move)
    console.log(`Action: ${userB} adds ${dish3} as disliked.`);
    await concept.addDislikedDish({ user: userB, dish: dish3 });
    let dislikedQueryResultB = await concept._getDislikedDishes({
      user: userB,
    });
    assertNotEquals(
      dislikedQueryResultB.length > 0 && "error" in dislikedQueryResultB[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    let dislikedB = dislikedQueryResultB as { dishes: ID }[];
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
    const likedQueryResultB = await concept._getLikedDishes({ user: userB });
    assertNotEquals(
      likedQueryResultB.length > 0 && "error" in likedQueryResultB[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    const likedB = likedQueryResultB as { dishes: ID }[];
    assertEquals(
      likedB.map((d) => d.dishes),
      [dish3],
      `${userB} should now have ${dish3} liked.`,
    );
    dislikedQueryResultB = await concept._getDislikedDishes({ user: userB });
    assertNotEquals(
      dislikedQueryResultB.length > 0 && "error" in dislikedQueryResultB[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    dislikedB = dislikedQueryResultB as { dishes: ID }[];
    assertEquals(
      dislikedB.map((d) => d.dishes),
      [],
      `${userB} should no longer have ${dish3} disliked.`,
    );

    // Add a dish already liked (should not duplicate)
    console.log(
      `Action: ${userA} adds ${dish1} as liked again (already liked).`,
    );
    result = await concept.addLikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addLikedDish for already liked dish should succeed (no-op).",
    );
    likedQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedQueryResult.length > 0 && "error" in likedQueryResult[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    liked = likedQueryResult as { dishes: ID }[];
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

    // UserA likes dish1 and dish2
    await concept.addLikedDish({ user: userA, dish: dish1 });
    await concept.addLikedDish({ user: userA, dish: dish2 });
    let likedQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedQueryResult.length > 0 && "error" in likedQueryResult[0],
      true,
      "Setup query for liked dishes should not return an error.",
    );
    let liked = likedQueryResult as { dishes: ID }[];
    assertEquals(
      liked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      "Setup: UserA should have dish1 and dish2 liked.",
    );

    // Remove an existing liked dish
    console.log(`Action: ${userA} removes ${dish1} from liked.`);
    let result = await concept.removeLikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "removeLikedDish for existing dish should succeed.",
    );
    likedQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedQueryResult.length > 0 && "error" in likedQueryResult[0],
      true,
      "Query after removal should not return an error.",
    );
    liked = likedQueryResult as { dishes: ID }[];
    assertEquals(
      liked.map((d) => d.dishes),
      [dish2],
      `${userA} should only have ${dish2} liked.`,
    );

    // Attempt to remove a dish not liked by the user
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

    // Attempt to remove for a non-existent user
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

    // Add a disliked dish for a new user
    console.log(`Action: ${userA} adds ${dish1} as disliked (new user).`);
    let result = await concept.addDislikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addDislikedDish for a new user should succeed.",
    );
    let dislikedQueryResult = await concept._getDislikedDishes({ user: userA });
    assertNotEquals(
      dislikedQueryResult.length > 0 && "error" in dislikedQueryResult[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    let disliked = dislikedQueryResult as { dishes: ID }[];
    assertEquals(
      disliked.map((d) => d.dishes),
      [dish1],
      `${userA} should have ${dish1} disliked.`,
    );

    // Add another disliked dish for the same user
    console.log(`Action: ${userA} adds ${dish2} as disliked (existing user).`);
    result = await concept.addDislikedDish({ user: userA, dish: dish2 });
    assertEquals(
      "error" in result,
      false,
      "addDislikedDish for an existing user should succeed.",
    );
    dislikedQueryResult = await concept._getDislikedDishes({ user: userA });
    assertNotEquals(
      dislikedQueryResult.length > 0 && "error" in dislikedQueryResult[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    disliked = dislikedQueryResult as { dishes: ID }[];
    assertEquals(
      disliked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      `${userA} should have ${dish1}, ${dish2} disliked.`,
    );

    // Add a dish that was previously liked (should move)
    console.log(`Action: ${userB} adds ${dish3} as liked.`);
    await concept.addLikedDish({ user: userB, dish: dish3 });
    let likedQueryResultB = await concept._getLikedDishes({ user: userB });
    assertNotEquals(
      likedQueryResultB.length > 0 && "error" in likedQueryResultB[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    let likedB = likedQueryResultB as { dishes: ID }[];
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
    const dislikedQueryResultB = await concept._getDislikedDishes({
      user: userB,
    });
    assertNotEquals(
      dislikedQueryResultB.length > 0 && "error" in dislikedQueryResultB[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    const dislikedB = dislikedQueryResultB as { dishes: ID }[];
    assertEquals(
      dislikedB.map((d) => d.dishes),
      [dish3],
      `${userB} should now have ${dish3} disliked.`,
    );
    likedQueryResultB = await concept._getLikedDishes({ user: userB });
    assertNotEquals(
      likedQueryResultB.length > 0 && "error" in likedQueryResultB[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    likedB = likedQueryResultB as { dishes: ID }[];
    assertEquals(
      likedB.map((d) => d.dishes),
      [],
      `${userB} should no longer have ${dish3} liked.`,
    );

    // Add a dish already disliked (should not duplicate)
    console.log(
      `Action: ${userA} adds ${dish1} as disliked again (already disliked).`,
    );
    result = await concept.addDislikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "addDislikedDish for already disliked dish should succeed (no-op).",
    );
    dislikedQueryResult = await concept._getDislikedDishes({ user: userA });
    assertNotEquals(
      dislikedQueryResult.length > 0 && "error" in dislikedQueryResult[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    disliked = dislikedQueryResult as { dishes: ID }[];
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

    // UserA dislikes dish1 and dish2
    await concept.addDislikedDish({ user: userA, dish: dish1 });
    await concept.addDislikedDish({ user: userA, dish: dish2 });
    let dislikedQueryResult = await concept._getDislikedDishes({ user: userA });
    assertNotEquals(
      dislikedQueryResult.length > 0 && "error" in dislikedQueryResult[0],
      true,
      "Setup query for disliked dishes should not return an error.",
    );
    let disliked = dislikedQueryResult as { dishes: ID }[];
    assertEquals(
      disliked.map((d) => d.dishes).sort(),
      [dish1, dish2].sort(),
      "Setup: UserA should have dish1 and dish2 disliked.",
    );

    // Remove an existing disliked dish
    console.log(`Action: ${userA} removes ${dish1} from disliked.`);
    let result = await concept.removeDislikedDish({ user: userA, dish: dish1 });
    assertEquals(
      "error" in result,
      false,
      "removeDislikedDish for existing dish should succeed.",
    );
    dislikedQueryResult = await concept._getDislikedDishes({ user: userA });
    assertNotEquals(
      dislikedQueryResult.length > 0 && "error" in dislikedQueryResult[0],
      true,
      "Query after removal should not return an error.",
    );
    disliked = dislikedQueryResult as { dishes: ID }[];
    assertEquals(
      disliked.map((d) => d.dishes),
      [dish2],
      `${userA} should only have ${dish2} disliked.`,
    );

    // Attempt to remove a dish not disliked by the user
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

    // Attempt to remove for a non-existent user
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

    // UserA likes dish1, UserB has no preferences
    await concept.addLikedDish({ user: userA, dish: dish1 });

    // Existing user with liked dishes
    console.log(`Query: Get liked dishes for ${userA}.`);
    let likedQueryResult = await concept._getLikedDishes({ user: userA });
    assertNotEquals(
      likedQueryResult.length > 0 && "error" in likedQueryResult[0],
      true,
      "Query for liked dishes should not return an error.",
    );
    const liked = likedQueryResult as { dishes: ID }[];
    assertEquals(
      liked.map((d) => d.dishes),
      [dish1],
      `Should return ${dish1} for ${userA}.`,
    );

    // Existing user with no liked dishes (only disliked)
    console.log(`Action: ${userA} dislikes ${dish2}.`);
    await concept.addDislikedDish({ user: userA, dish: dish2 });
    console.log(`Action: ${userA} removes ${dish1} from liked.`);
    await concept.removeLikedDish({ user: userA, dish: dish1 });
    console.log(`Query: Get liked dishes for ${userA} (now empty).`);
    likedQueryResult = await concept._getLikedDishes({ user: userA });
    assertEquals(
      likedQueryResult,
      [],
      `Should return an empty array for ${userA} after removing liked dishes.`,
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getDislikedDishes - existing user with dishes, existing user no dishes, non-existent user", async () => {
  const [db, client] = await testDb();
  const concept = new UserTastePreferencesConcept(db);

  try {
    console.log("--- _getDislikedDishes Test ---");

    // UserA dislikes dish1, UserB has no preferences
    await concept.addDislikedDish({ user: userA, dish: dish1 });

    // Existing user with disliked dishes
    console.log(`Query: Get disliked dishes for ${userA}.`);
    let dislikedQueryResult = await concept._getDislikedDishes({ user: userA });
    // Robust check for no error
    assertNotEquals(
      dislikedQueryResult.length > 0 && "error" in dislikedQueryResult[0],
      true,
      "Query for disliked dishes should not return an error.",
    );
    const disliked = dislikedQueryResult as { dishes: ID }[];
    assertEquals(
      disliked.map((d) => d.dishes),
      [dish1],
      `Should return ${dish1} for ${userA}.`,
    );

    // Existing user with no disliked dishes (only liked)
    console.log(`Action: ${userA} likes ${dish2}.`);
    await concept.addLikedDish({ user: userA, dish: dish2 });
    console.log(`Action: ${userA} removes ${dish1} from disliked.`);
    await concept.removeDislikedDish({ user: userA, dish: dish1 });
    console.log(`Query: Get disliked dishes for ${userA} (now empty).`);
    dislikedQueryResult = await concept._getDislikedDishes({ user: userA });
    assertEquals(
      dislikedQueryResult,
      [],
      `Should return an empty array for ${userA} after removing disliked dishes.`,
    );

    // Non-existent user
    const nonExistentUser = "user:Phantom" as ID;
    console.log(
      `Query: Get disliked dishes for ${nonExistentUser} (non-existent).`,
    );
    dislikedQueryResult = await concept._getDislikedDishes({
      user: nonExistentUser,
    });
    assertEquals(dislikedQueryResult, [{
      error: `User with ID '${nonExistentUser}' does not exist.`,
    }], `Should return error for non-existent user.`);
  } finally {
    await client.close();
  }
});
