[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: UserAuthentication
# response:

```typescript
// file: src/UserAuthentication/UserAuthenticationConcept.test.ts

import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("Principle Test: User registration and successful authentication", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  const username = "principleUser";
  const password = "securePassword123";

  // 1. Action: Register user
  const registerResult = await concept.register({ username, password });
  assertEquals(typeof registerResult, "object");
  assertEquals(
    "user" in registerResult,
    true,
    "Registration should return a user ID.",
  );
  const userId = (registerResult as { user: string }).user;

  //2. Action: Authenticate user with correct password
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
  await client.close();
});

Deno.test(
  "Register with duplicate username",
  async () => {
    // Action Test: register - Duplicate Username
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);

    const username = "duplicateUser";
    const password = "dupPassword";

    const firstRegisterResult = await concept.register({
      username,
      password,
    });
    assertEquals(
      "user" in firstRegisterResult,
      true,
      "First registration should succeed.",
    );

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
    await client.close();
  },
);

Deno.test("Authenticate with success", async () => {
  // Action Test: authenticate successfully
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
  await client.close();
});

Deno.test(
  "Authenticate with incorrect password",
  async () => {
    // Action Test: authenticate - Incorrect Password
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);

    const username = "wrongPassUser";
    const password = "correctPassword";
    const wrongPassword = "incorrectPassword";

    await concept.register({ username, password });

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
    await client.close();
  },
);

Deno.test(
  "Authenticate with non-existent username",
  async () => {
    // Action Test: authenticate - Non-existent Username
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);
    const username = "nonExistentUser";
    const password = "anyPassword";

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
    await client.close();
  },
);

Deno.test("Query: _getUsername - Retrieve existing username", async () => {
  // Query Test: _getUsername for Existing User
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);
  const username = "queryUser";
  const password = "queryPass";

  const registerResult = await concept.register({ username, password });
  const userId = (registerResult as { user: string }).user as ID;

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
  await client.close();
});

Deno.test(
  "Query: _getUsername with non-existent user",
  async () => {
    // Query Test: _getUsername for Non-existent User
    const [db, client] = await testDb();
    const concept = new UserAuthenticationConcept(db);
    const nonExistentId = "nonExistentID123" as ID;
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
    await client.close();
  },
);
```