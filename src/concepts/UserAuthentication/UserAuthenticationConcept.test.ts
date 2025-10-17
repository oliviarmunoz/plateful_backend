import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("Principle Test: User registration and successful authentication", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  const username = "principleUser";
  const password = "securePassword123";

  console.log("Registering user...");
  const registerResult = await concept.register({ username, password });
  assertEquals(typeof registerResult, "object");
  assertEquals(
    "user" in registerResult,
    true,
    "Registration should return a user ID.",
  );
  const userId = (registerResult as { user: string }).user;

  console.log("Authenticating user...");
  const authResult = await concept.authenticate({ username, password });
  assertEquals(typeof authResult, "object");
  assertEquals(
    "user" in authResult,
    true,
    "Authentication should return a user ID.",
  );
  assertEquals(
    (authResult as { user: string }).user,
    userId,
    "Authenticated user ID should match registered user ID.",
  );
  console.log("User successfully authenticated.");
  await client.close();
});

Deno.test(
  "Register with duplicate username",
  async () => {
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);

    const username = "duplicateUser";
    const password = "dupPassword";
    console.log("Registering first user...");
    const firstRegisterResult = await concept.register({
      username,
      password,
    });
    assertEquals(
      "user" in firstRegisterResult,
      true,
      "First registration should succeed.",
    );
    console.log("Registering second user...");
    const secondRegisterResult = await concept.register({
      username,
      password,
    });
    assertEquals(
      "error" in secondRegisterResult,
      true,
      "Second registration with duplicate username should fail.",
    );
    assertEquals(
      (secondRegisterResult as { error: string }).error,
      "Username already taken.",
      "Error message should indicate duplicate username.",
    );
    console.log("Second user failed to authenticate.");
    await client.close();
  },
);

Deno.test("Authenticate with success", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);
  const username = "authTestUser";
  const password = "authPassword";

  const registerResult = await concept.register({ username, password });
  assertEquals(
    "user" in registerResult,
    true,
    "Registration must succeed for authentication test.",
  );
  const userId = (registerResult as { user: string }).user;

  console.log("Authenticating user...");
  const authResult = await concept.authenticate({ username, password });
  assertEquals(
    "user" in authResult,
    true,
    "Authentication should succeed with correct credentials.",
  );
  assertEquals(
    (authResult as { user: string }).user,
    userId,
    "Authenticated user ID should match.",
  );
  console.log("User successfully authenticated...");
  await client.close();
});

Deno.test(
  "Authenticate with incorrect password",
  async () => {
    console.log("Action Test: authenticate - Incorrect Password");
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);

    const username = "wrongPassUser";
    const password = "correctPassword";
    const wrongPassword = "incorrectPassword";

    await concept.register({ username, password });

    console.log("Authenticating user...");
    const authResult = await concept.authenticate({
      username,
      password: wrongPassword,
    });
    assertEquals(
      "error" in authResult,
      true,
      "Authentication with wrong password should fail.",
    );
    assertEquals(
      (authResult as { error: string }).error,
      "Invalid username or password.",
      "Error message should indicate invalid credentials.",
    );
    console.log("User failed to authenticate.");
    await client.close();
  },
);

Deno.test(
  "Authenticate with non-existent username",
  async () => {
    console.log("Action Test: authenticate - Non-existent Username");
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);
    const username = "nonExistentUser";
    const password = "anyPassword";

    console.log("Authenticating user...");
    const authResult = await concept.authenticate({ username, password });
    assertEquals(
      "error" in authResult,
      true,
      "Authentication with non-existent username should fail.",
    );
    assertEquals(
      (authResult as { error: string }).error,
      "Invalid username or password.",
      "Error message should indicate invalid credentials.",
    );
    console.log("User failed to authenticate.");
    await client.close();
  },
);

Deno.test("Query: _getUsername - Retrieve existing username", async () => {
  console.log("Query Test: _getUsername for Existing User");
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);
  const username = "queryUser";
  const password = "queryPass";

  const registerResult = await concept.register({ username, password });
  const userId = (registerResult as { user: string }).user as ID;

  console.log("Querying username...");
  const queryResult = await concept._getUsername({ user: userId });
  assertEquals(
    "username" in queryResult,
    true,
    "Query should return username.",
  );
  assertEquals(
    (queryResult as { username: string }).username,
    username,
    "Retrieved username should match.",
  );
  console.log("Username successfully queried.");
  await client.close();
});

Deno.test(
  "Query: _getUsername with non-existent user",
  async () => {
    console.log("Query Test: _getUsername for Non-existent User");
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);
    const nonExistentId = "nonExistentID123" as ID;

    console.log("Querying username...");
    const queryResult = await concept._getUsername({ user: nonExistentId });
    assertEquals(
      "error" in queryResult,
      true,
      "Query for non-existent user should fail.",
    );
    assertEquals(
      (queryResult as { error: string }).error,
      "User not found.",
      "Error message should indicate user not found.",
    );
    console.log("Username failed to be queried.");
    await client.close();
  },
);
