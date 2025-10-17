---
timestamp: 'Wed Oct 15 2025 20:06:17 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_200617.d0571f19.md]]'
content_id: 8c58b57a7cf281ec59bc06a797c412bec01e4925a09e7acacc5db6b207185de1
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { assertEquals } from "jsr:@std/assert";

/**
  concept UserAuthentication [User]
  purpose limit access to known users
  principle if a user registers with a unique username and password, they can later log in using those
  same credentials to prove their identity and gain access.
  state
      a set of Users with
          a username String
          a password String

  actions
      register (username: String, password: String): (user: User)
          requires: no User exists with the given username
          effects: creates and returns a new User and associates it with the provided username and password

      authenticate (username: String, password: String): (user: User)
          requires: a User exists with the given username, and the password matches the stored password for that User
          effects: returns the User associated with the credentials

      authenticate (username: String, password: String): (error: String)
          requires: a User exists with the given username, and the password does not match the stored password for that User
          effects: returns an error message indicating that the authenticate action failed

  queries
      _getUsername (user: User) : (username: String)
          requires: user exists
          effects: returns username of user

      _getPassword (user: User) : (password: String)
          requires: user exists
          effects: returns password of user
 */

// Collection prefix to ensure namespace separation
const PREFIX = "UserAuthentication" + ".";

// Generic type
type User = ID;

// Internal entity types
type Credentials = ID; // This type is not strictly used in the current implementation, but conceptually ties to the 'state' declaration.

/**
 * state
 *   a set of Users with
 *     a username String
 *     a password String
 */
interface AuthUser {
  _id: User;
  username: string;
  password: string;
  isLoggedIn: boolean; // Not explicitly in the concept spec but often part of auth state. For this example, let's keep it.
}

function verifyPassword(
  password: string,
  passwordFromDb: string,
): boolean {
  return password === passwordFromDb;
}

export default class UserAuthenticationConcept {
  users: Collection<AuthUser>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * Action: Register a new User
   * @requires username is not already taken
   * @effects creates and returns a new User with the given username and password
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Check if username already exists
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already taken." };
    }

    const newUser: AuthUser = {
      _id: freshID(),
      username,
      password: password,
      isLoggedIn: false,
    };

    await this.users.insertOne(newUser);
    return { user: newUser._id };
  }

  /**
   * Action: User login
   *
   * @requires user exists
   * @effects Returns the User ID if valid username/password combination, error otherwise
   */
  async login(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    const user = await this.users.findOne({ username });

    // Check if user exists and password matches
    if (!user || !verifyPassword(password, user.password)) {
      return { error: "Invalid username or password." };
    }

    // In a real app, you might set isLoggedIn: true here, but for simple auth, just returning the user is sufficient.
    return { user: user._id };
  }

  /**
   * Query: Get username for a given User ID
   *
   * @requires user exists
   * @effects returns username of user
   */
  async _getUsername(
    { user: userId }: { user: User },
  ): Promise<{ username: string } | { error: string }> {
    const authUser = await this.users.findOne({ _id: userId });
    if (!authUser) {
      return { error: "User not found." };
    }
    return { username: authUser.username };
  }

  /**
   * Query: Get password for a given User ID
   *
   * @requires user exists
   * @effects returns password of user
   */
  async _getPassword(
    { user: userId }: { user: User },
  ): Promise<{ password: string } | { error: string }> {
    const authUser = await this.users.findOne({ _id: userId });
    if (!authUser) {
      return { error: "User not found." };
    }
    return { password: authUser.password };
  }
}
```

````
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**

  concept UserAuthentication [User]
  purpose limit access to known users
  principle if a user registers with a unique username and password, they can later log in using those
  same credentials to prove their identity and gain access.
  state
      a set of Credentials with
          a username String
          a password String

  actions
      register (username: String, password: String): (user: User)
          requires: no User exists with the given username
          effects: creates and returns a new User and associates it with the provided username and password

      authenticate (username: String, password: String): (user: User)
          requires: a User exists with the given username, and the password matches the stored password for that User
          effects: returns the User associated with the credentials

      authenticate (username: String, password: String): (error: String)
          requires: a User exists with the given username, and the password does not match the stored password for that User
          effects: returns an error message indicating that the authenticate action failed

      _getUsername (user: User) : (username: String)
          requires: user exists
          effects: returns username of user
 */

// Collection prefix to ensure namespace separation
const PREFIX = "UserAuthentication" + ".";

// Generic type
type User = ID;

// Internal entity types
type Credentials = ID;

/**
 * state
 *   a set of Users with
 *     a username String
 *     a password String
 */
interface AuthUser {
  _id: User;
  username: string;
  password: string;
  isLoggedIn: boolean;
}

function verifyPassword(
  password: string,
  passwordFromDb: string,
): boolean {
  return password === passwordFromDb;
}

export default class UserAuthenticationConcept {
  users: Collection<AuthUser>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * Action: Register a new User
   * @requires username is not already taken
   * @effects creates and returns a new User with the given username and password
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Check if username already exists
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already taken." };
    }

    const newUser: AuthUser = {
      _id: freshID(),
      username,
      password: password,
      isLoggedIn: false,
    };

    await this.users.insertOne(newUser);
    return { user: newUser._id };
  }

  /**
   * Action: User login
   *
   * @requires user exists
   * @effects Returns the User ID if valid username/password combination, error otherwise
   */
  async login(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    const user = await this.users.findOne({ username });

    // Check if user exists and password matches
    if (!user || !verifyPassword(password, user.password)) {
      return { error: "Invalid username or password." };
    }

    return { user: user._id };
  }

  /**
   * Query: Get username for a given User ID
   *
   * @requires user exists
   * @effects returns username of user
   */
  async _getUsername(
    { user: userId }: { user: User },
  ): Promise<{ username: string } | { error: string }> {
    const authUser = await this.users.findOne({ _id: userId });
    if (!authUser) {
      return { error: "User not found." };
    }
    return { username: authUser.username };
  }
}```

# critique the above code
# response:

The provided TypeScript implementation for the `UserAuthenticationConcept` is a good effort but has several points that could be improved to better align with the concept design principles and the given specification.

Here's a detailed critique:

---

**1. Adherence to Concept Specification**

*   **Action Name Mismatch:**
    *   **Critique:** The concept specification defines the login action as `authenticate`, but the implementation uses the method name `login`.
    *   **Impact:** This breaks direct mapping to the concept's API and can cause confusion when integrating with syncs or other parts of the system that expect the specified `authenticate` name.
    *   **Recommendation:** Rename the `login` method to `authenticate`.

*   **Missing Query (`_getPassword`):**
    *   **Critique:** The concept specification explicitly includes a query `_getPassword (user: User) : (password: String)`, but this query is completely absent from the `UserAuthenticationConcept` class.
    *   **Impact:** The implementation is incomplete according to its own specification.
    *   **Recommendation:** Add the `_getPassword` method to the class, implementing its `requires` and `effects`.

*   **Preconditions and Effects:**
    *   For `register`, `authenticate` (login), and `_getUsername`, the implementation largely respects the stated `requires` (preconditions) and `effects` (postconditions) in the code's logic and return values. This is good.
    *   The use of `{ error: "..." }` for failure cases aligns with the specified `(error: String)` return type.

---

**2. Concept State Representation & Separation of Concerns**

*   **`isLoggedIn` Field in `AuthUser`:**
    *   **Critique:** The `AuthUser` interface (which models the concept's state) includes an `isLoggedIn: boolean` field, and it's initialized to `false` in the `register` method. The `isLoggedIn` status is not part of the `UserAuthentication` concept's defined `state` (`a set of Users with a username String, a password String`). The documentation explicitly emphasizes "separation of concerns," stating: "In a concept design, these would be separated into different concepts: one for authentication, one for profiles, one for naming, one for notification, and so on." The act of "being logged in" typically implies a session, which should reside in a separate `Session` concept.
    *   **Impact:** This violates the "separation of concerns" principle by conflating authentication credentials with session state. It adds state that is not strictly necessary for the core purpose of *authenticating* users.
    *   **Recommendation:** Remove the `isLoggedIn` field from the `AuthUser` interface and all related logic. The successful return of a `user: User` from `authenticate` *is* the authentication event; managing the active session derived from that is a job for another concept.

*   **`type Credentials = ID;`:**
    *   **Critique:** This type is declared but not used in the `AuthUser` interface or the rest of the logic. The `AuthUser` interface directly models the "user with username and password" aspect.
    *   **Impact:** Minor, but it's an unused declaration.
    *   **Recommendation:** Remove the unused `Credentials` type alias, or explicitly explain its conceptual role if it's meant to represent something not directly mapped to `AuthUser`.

---

**3. Security Best Practices**

*   **Plaintext Password Storage:**
    *   **Critique:** The `password` field in the `AuthUser` interface and how it's stored in the database implies plaintext storage. The `verifyPassword` function also compares plaintext passwords directly. This is a critical security vulnerability.
    *   **Impact:** If the database is compromised, all user passwords are exposed, leading to significant security risks for users (e.g., credential stuffing attacks on other services).
    *   **Recommendation:** Implement robust password hashing (e.g., using a library like `bcrypt`) and salting. The `register` method should hash the password before storing it, and the `authenticate` (login) method should hash the provided password and compare it against the stored hash using a secure comparison function.

---

**4. Minor Implementation Details**

*   **Unused Import:** The `Empty` type is imported from `@utils/types.ts` but is not used within the class.
    *   **Recommendation:** Remove unused imports.
*   **`verifyPassword` Function Location:** While functional, placing `verifyPassword` as a top-level function outside the class makes it less encapsulated. It could be a private method of the `UserAuthenticationConcept` class.
    *   **Recommendation:** Consider making `verifyPassword` a `private` method within the `UserAuthenticationConcept` class.

---

**Revised Concept Specification (reflecting needed query for completeness):**

````

concept UserAuthentication \[User]
purpose limit access to known users
principle if a user registers with a unique username and password, they can later log in using those
same credentials to prove their identity and gain access.
state
a set of Users with
a username String
a password String

actions
register (username: String, password: String): (user: User)
requires: no User exists with the given username
effects: creates and returns a new User and associates it with the provided username and password

```
authenticate (username: String, password: String): (user: User)
    requires: a User exists with the given username, and the password matches the stored password for that User
    effects: returns the User associated with the credentials

authenticate (username: String, password: String): (error: String)
    requires: a User exists with the given username, and the password does not match the stored password for that User
    effects: returns an error message indicating that the authenticate action failed
```

queries
\_getUsername (user: User) : (username: String)
requires: user exists
effects: returns username of user

```
_getPassword (user: User) : (password: String) // This query *must* be added to the implementation.
    requires: user exists
    effects: returns password of user
```

````

---

**Conclusion:**

The implementation demonstrates a good understanding of how to structure a concept in TypeScript and interact with a database. However, addressing the discrepancies with the specification (method naming, missing query), enforcing strict separation of concerns (removing `isLoggedIn`), and crucially, implementing secure password handling, would significantly improve the quality and robustness of this `UserAuthenticationConcept`.

---

[@testing-concepts](../../../design/background/testing-concepts.md)

[@LikertSurvey](src/concepts/LikertSurvey/LikertSurveryConcept.test.ts)

[@UserAuthenticationConcept](UserAuthentication.ts)

# make a test file for this
# response:

First, based on the critique, here's the *corrected* `UserAuthenticationConcept` implementation. I've addressed the naming mismatch (`login` to `authenticate`), added the `_getPassword` query, removed the `isLoggedIn` field (adhering to separation of concerns), and noted the critical security vulnerability of plaintext passwords (though not implementing hashing for this exercise as it wasn't requested for the *implementation* task itself, but is crucial for a real application).

---

```typescript
// src/concepts/UserAuthentication/UserAuthenticationConcept.ts
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
  concept UserAuthentication [User]
  purpose limit access to known users
  principle if a user registers with a unique username and password, they can later log in using those
  same credentials to prove their identity and gain access.
  state
      a set of Users with
          a username String
          a password String

  actions
      register (username: String, password: String): (user: User)
          requires: no User exists with the given username
          effects: creates and returns a new User and associates it with the provided username and password

      authenticate (username: String, password: String): (user: User)
          requires: a User exists with the given username, and the password matches the stored password for that User
          effects: returns the User associated with the credentials

      authenticate (username: String, password: String): (error: String)
          requires: a User exists with the given username, and the password does not match the stored password for that User
          effects: returns an error message indicating that the authenticate action failed

  queries
      _getUsername (user: User) : (username: String)
          requires: user exists
          effects: returns username of user

      _getPassword (user: User) : (password: String)
          requires: user exists
          effects: returns password of user
 */

// Collection prefix to ensure namespace separation
const PREFIX = "UserAuthentication" + ".";

// Generic type
type User = ID;

/**
 * state
 *   a set of Users with
 *     a username String
 *     a password String
 */
interface AuthUser {
  _id: User;
  username: string;
  password: string; // CRITICAL: In a real application, this *must* be a hashed password.
}

export default class UserAuthenticationConcept {
  users: Collection<AuthUser>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  // Private helper for password verification (would use bcrypt.compare in real app)
  private _verifyPassword(
    providedPassword: string,
    storedPassword: string, // Renamed to storedPassword to align with direct comparison for this exercise
  ): boolean {
    // CRITICAL: For a real app, this should involve secure password hashing (e.g., bcrypt.compareSync).
    return providedPassword === storedPassword;
  }

  /**
   * Action: Register a new User
   * @requires username is not already taken
   * @effects creates and returns a new User with the given username and password
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    console.log(`Action: register(${username}, ****)`);
    // Precondition: no User exists with the given username
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      console.log(`  - Precondition failed: Username '${username}' already taken.`);
      return { error: "Username already taken." };
    }

    // Effect: creates and returns a new User and associates it with the provided username and password
    // CRITICAL: In a real app, hash the password here before storing.
    const newUser: AuthUser = {
      _id: freshID(),
      username,
      password: password,
    };

    await this.users.insertOne(newUser);
    console.log(`  - Effect: User registered with ID: ${newUser._id}`);
    return { user: newUser._id };
  }

  /**
   * Action: Authenticate (login) a User
   *
   * @requires a User exists with the given username, and the password matches the stored password for that User
   * @effects Returns the User ID if valid username/password combination, error otherwise
   */
  async authenticate(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    console.log(`Action: authenticate(${username}, ****)`);
    const user = await this.users.findOne({ username });

    // Precondition check (combined for simplicity as specified in spec)
    if (!user) {
      console.log(`  - Precondition failed: User '${username}' not found.`);
      return { error: "Invalid username or password." }; // Generic message for security
    }
    if (!this._verifyPassword(password, user.password)) {
      console.log(`  - Precondition failed: Password for '${username}' does not match.`);
      return { error: "Invalid username or password." }; // Generic message for security
    }

    // Effect: returns the User associated with the credentials
    console.log(`  - Effect: User authenticated with ID: ${user._id}`);
    return { user: user._id };
  }

  /**
   * Query: Get username for a given User ID
   *
   * @requires user exists
   * @effects returns username of user
   */
  async _getUsername(
    { user: userId }: { user: User },
  ): Promise<{ username: string } | { error: string }> {
    console.log(`Query: _getUsername(${userId})`);
    // Precondition: user exists
    const authUser = await this.users.findOne({ _id: userId });
    if (!authUser) {
      console.log(`  - Precondition failed: User ID '${userId}' not found.`);
      return { error: "User not found." };
    }
    // Effect: returns username of user
    console.log(`  - Effect: Found username: ${authUser.username}`);
    return { username: authUser.username };
  }

  /**
   * Query: Get password for a given User ID
   *
   * @requires user exists
   * @effects returns password of user
   */
  async _getPassword(
    { user: userId }: { user: User },
  ): Promise<{ password: string } | { error: string }> {
    console.log(`Query: _getPassword(${userId})`);
    // Precondition: user exists
    const authUser = await this.users.findOne({ _id: userId });
    if (!authUser) {
      console.log(`  - Precondition failed: User ID '${userId}' not found.`);
      return { error: "User not found." };
    }
    // Effect: returns password of user
    console.log(`  - Effect: Found password (CRITICAL: should be hashed): ****`);
    return { password: authUser.password };
  }
}
````

***

Now, here is the test file for the `UserAuthenticationConcept`, assuming the corrected implementation above is available at `../UserAuthentication/UserAuthenticationConcept.ts`.

***

```typescript
// src/concepts/UserAuthentication/UserAuthenticationConcept.test.ts
import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthenticationConcept from "./UserAuthenticationConcept.ts"; // Assuming relative path

// Test file for the UserAuthentication Concept

Deno.test("UserAuthentication Concept Tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  await t.step("Principle Test: User registration and successful authentication", async () => {
    console.log("\n--- Principle Test: Register and Authenticate ---");
    console.log(
      "Demonstrates: if a user registers with a unique username and password, they can later log in using those " +
        "same credentials to prove their identity and gain access.",
    );

    const username = "principleUser";
    const password = "securePassword123";

    console.log(`1. Action: Register user '${username}'`);
    const registerResult = await concept.register({ username, password });
    assertEquals(typeof registerResult, "object");
    assertEquals("user" in registerResult, true, "Registration should return a user ID.");
    const userId = (registerResult as { user: string }).user;
    console.log(`   - Registered user ID: ${userId}`);

    console.log(`2. Action: Authenticate user '${username}' with correct password`);
    const authResult = await concept.authenticate({ username, password });
    assertEquals(typeof authResult, "object");
    assertEquals("user" in authResult, true, "Authentication should return a user ID.");
    assertEquals((authResult as { user: string }).user, userId, "Authenticated user ID should match registered user ID.");
    console.log(`   - Authenticated user ID: ${(authResult as { user: string }).user}`);

    console.log("Principle fulfilled: User successfully registered and then authenticated.");
  });

  await t.step("Action: register - Successful registration", async () => {
    console.log("\n--- Action Test: register - Happy Path ---");
    const username = "testuser1";
    const password = "password1";

    console.log(`1. Attempting to register user '${username}'.`);
    const result = await concept.register({ username, password });

    assertEquals(typeof result, "object");
    assertEquals("user" in result, true, "Expected 'user' field in successful registration result.");
    const userId = (result as { user: string }).user;
    console.log(`   - User '${username}' registered with ID: ${userId}`);

    console.log(`2. Verifying state via _getUsername query for user ID: ${userId}`);
    const usernameQueryResult = await concept._getUsername({ user: userId });
    assertEquals(typeof usernameQueryResult, "object");
    assertEquals("username" in usernameQueryResult, true, "Expected 'username' field from _getUsername query.");
    assertEquals((usernameQueryResult as { username: string }).username, username, "Retrieved username should match.");

    console.log(`3. Verifying state via _getPassword query for user ID: ${userId}`);
    const passwordQueryResult = await concept._getPassword({ user: userId });
    assertEquals(typeof passwordQueryResult, "object");
    assertEquals("password" in passwordQueryResult, true, "Expected 'password' field from _getPassword query.");
    assertEquals((passwordQueryResult as { password: string }).password, password, "Retrieved password should match (NOTE: Insecure in real app).");
  });

  await t.step("Action: register - Duplicate username should fail", async () => {
    console.log("\n--- Action Test: register - Duplicate Username ---");
    const username = "duplicateUser";
    const password = "dupPassword";

    console.log(`1. Registering '${username}' for the first time.`);
    const firstRegisterResult = await concept.register({ username, password });
    assertEquals("user" in firstRegisterResult, true, "First registration should succeed.");
    console.log(`   - First registration successful for ID: ${(firstRegisterResult as { user: string }).user}`);

    console.log(`2. Attempting to register '${username}' again.`);
    const secondRegisterResult = await concept.register({ username, password });
    assertEquals("error" in secondRegisterResult, true, "Second registration with duplicate username should fail.");
    assertEquals(
      (secondRegisterResult as { error: string }).error,
      "Username already taken.",
      "Error message should indicate duplicate username.",
    );
    console.log(`   - Second registration failed as expected: '${(secondRegisterResult as { error: string }).error}'`);
  });

  await t.step("Action: authenticate - Successful authentication", async () => {
    console.log("\n--- Action Test: authenticate - Happy Path ---");
    const username = "authTestUser";
    const password = "authPassword";

    console.log(`1. Registering user '${username}'.`);
    const registerResult = await concept.register({ username, password });
    assertEquals("user" in registerResult, true, "Registration must succeed for authentication test.");
    const userId = (registerResult as { user: string }).user;
    console.log(`   - User '${username}' registered with ID: ${userId}`);

    console.log(`2. Attempting to authenticate '${username}' with correct password.`);
    const authResult = await concept.authenticate({ username, password });
    assertEquals("user" in authResult, true, "Authentication should succeed with correct credentials.");
    assertEquals((authResult as { user: string }).user, userId, "Authenticated user ID should match.");
    console.log(`   - Successfully authenticated user ID: ${(authResult as { user: string }).user}`);
  });

  await t.step("Action: authenticate - Incorrect password should fail", async () => {
    console.log("\n--- Action Test: authenticate - Incorrect Password ---");
    const username = "wrongPassUser";
    const password = "correctPassword";
    const wrongPassword = "incorrectPassword";

    console.log(`1. Registering user '${username}'.`);
    await concept.register({ username, password });
    console.log(`   - User '${username}' registered.`);

    console.log(`2. Attempting to authenticate '${username}' with incorrect password.`);
    const authResult = await concept.authenticate({ username, password: wrongPassword });
    assertEquals("error" in authResult, true, "Authentication with wrong password should fail.");
    assertEquals(
      (authResult as { error: string }).error,
      "Invalid username or password.",
      "Error message should indicate invalid credentials.",
    );
    console.log(`   - Authentication failed as expected: '${(authResult as { error: string }).error}'`);
  });

  await t.step("Action: authenticate - Non-existent username should fail", async () => {
    console.log("\n--- Action Test: authenticate - Non-existent Username ---");
    const username = "nonExistentUser";
    const password = "anyPassword";

    console.log(`1. Attempting to authenticate non-existent user '${username}'.`);
    const authResult = await concept.authenticate({ username, password });
    assertEquals("error" in authResult, true, "Authentication with non-existent username should fail.");
    assertEquals(
      (authResult as { error: string }).error,
      "Invalid username or password.",
      "Error message should indicate invalid credentials.",
    );
    console.log(`   - Authentication failed as expected: '${(authResult as { error: string }).error}'`);
  });

  await t.step("Query: _getUsername - Retrieve existing username", async () => {
    console.log("\n--- Query Test: _getUsername - Existing User ---");
    const username = "queryUser";
    const password = "queryPass";

    console.log(`1. Registering user '${username}'.`);
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: string }).user;
    console.log(`   - User registered with ID: ${userId}`);

    console.log(`2. Querying username for ID: ${userId}`);
    const queryResult = await concept._getUsername({ user: userId });
    assertEquals("username" in queryResult, true, "Query should return username.");
    assertEquals((queryResult as { username: string }).username, username, "Retrieved username should match.");
    console.log(`   - Retrieved username: '${(queryResult as { username: string }).username}'`);
  });

  await t.step("Query: _getUsername - Non-existent user should fail", async () => {
    console.log("\n--- Query Test: _getUsername - Non-existent User ---");
    const nonExistentId = "nonExistentID123"; // A dummy ID
    console.log(`1. Querying username for non-existent ID: '${nonExistentId}'.`);
    const queryResult = await concept._getUsername({ user: nonExistentId });
    assertEquals("error" in queryResult, true, "Query for non-existent user should fail.");
    assertEquals(
      (queryResult as { error: string }).error,
      "User not found.",
      "Error message should indicate user not found.",
    );
    console.log(`   - Query failed as expected: '${(queryResult as { error: string }).error}'`);
  });

  await t.step("Query: _getPassword - Retrieve existing password", async () => {
    console.log("\n--- Query Test: _getPassword - Existing User ---");
    const username = "passQueryUser";
    const password = "passQueryPass";

    console.log(`1. Registering user '${username}'.`);
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: string }).user;
    console.log(`   - User registered with ID: ${userId}`);

    console.log(`2. Querying password for ID: ${userId}`);
    const queryResult = await concept._getPassword({ user: userId });
    assertEquals("password" in queryResult, true, "Query should return password.");
    assertEquals((queryResult as { password: string }).password, password, "Retrieved password should match.");
    console.log(`   - Retrieved password (CRITICAL: should be hashed): '****'`);
  });

  await t.step("Query: _getPassword - Non-existent user should fail", async () => {
    console.log("\n--- Query Test: _getPassword - Non-existent User ---");
    const nonExistentId = "anotherNonExistentID"; // A dummy ID
    console.log(`1. Querying password for non-existent ID: '${nonExistentId}'.`);
    const queryResult = await concept._getPassword({ user: nonExistentId });
    assertEquals("error" in queryResult, true, "Query for non-existent user should fail.");
    assertEquals(
      (queryResult as { error: string }).error,
      "User not found.",
      "Error message should indicate user not found.",
    );
    console.log(`   - Query failed as expected: '${(queryResult as { error: string }).error}'`);
  });


  await client.close();
});
```
