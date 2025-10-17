---
timestamp: 'Tue Oct 14 2025 21:07:03 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_210703.bf67dab0.md]]'
content_id: c4dfbd568eeeb3abc7995067ea22134426e8cc58a82b5531867372a613779b38
---

# response:

```typescript
// @utils/types.ts (assumed to be available)
export type ID = string & { __brand: "ID" };
export type Empty = Record<PropertyKey, never>;

// @utils/database.ts (assumed to be available)
// import { MongoClient, Db } from "npm:mongodb";
// import { v4 as uuidv4 } from "uuid";
// import "https://deno.land/std@0.224.0/dotenv/load.ts";
// export const freshID = (): ID => uuidv4() as ID;
// export async function getDb(): Promise<[Db, MongoClient]> { /* ... */ }

// Note: For a real application, passwords should be securely hashed (e.g., with bcrypt).
// For this example, we'll store and compare them directly as strings.
function hashPassword(password: string): string {
  // In a real application, use a strong hashing algorithm like bcrypt.
  // For demonstration, we'll just return the password itself.
  return password;
}

function verifyPassword(password: string, hashedPasswordFromDb: string): boolean {
  // In a real application, compare using the hashing library.
  return password === hashedPasswordFromDb;
}
```

```typescript
// file: src/UserAuthentication/UserAuthenticationConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts"; // Assuming freshID is imported from @utils/database.ts

/**
 * concept UserAuthentication [User]
 *
 * purpose allow users to register an account, and then login and logout to
 *         authenticate and deauthenticate themselves.
 *
 * principle after a user registers with a username and password, they can log in
 *           with those credentials and be authenticated. Logging out will
 *           revoke that authentication.
 */

// Declare collection prefix, use concept name
const PREFIX = "UserAuthentication" + ".";

// Generic type for this concept
type User = ID;

/**
 * state
 *   a set of Users with
 *     a username String
 *     a password String (stored as hash for security)
 *     a isLoggedIn Boolean
 */
interface AuthUser {
  _id: User; // The ID of the user
  username: string;
  passwordHash: string; // Storing hashed password for security
  isLoggedIn: boolean; // Tracks if this concept considers the user logged in
}

export default class UserAuthenticationConcept {
  users: Collection<AuthUser>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * action register (username: String, password: String): (user: User) | (error: String)
   *
   * requires username is not already taken.
   * effects creates a new User with the given username and hashed password,
   *         sets isLoggedIn to false, returns the new User ID.
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Check if username already exists
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already taken." };
    }

    const hashedPassword = hashPassword(password);
    const newUser: AuthUser = {
      _id: freshID(),
      username,
      passwordHash: hashedPassword,
      isLoggedIn: false, // User is not logged in upon registration
    };

    await this.users.insertOne(newUser);
    return { user: newUser._id };
  }

  /**
   * action login (username: String, password: String): (user: User) | (error: String)
   *
   * requires user exists with matching username and password.
   * effects sets isLoggedIn to true for the found user, returns the User ID.
   */
  async login(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    const user = await this.users.findOne({ username });

    // Check if user exists and password matches
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { error: "Invalid username or password." };
    }

    // Set isLoggedIn to true
    await this.users.updateOne(
      { _id: user._id },
      { $set: { isLoggedIn: true } },
    );

    return { user: user._id };
  }

  /**
   * action logout (user: User): Empty | (error: String)
   *
   * requires user exists and isLoggedIn is true for that user.
   * effects sets isLoggedIn to false for the given user.
   */
  async logout({ user }: { user: User }): Promise<Empty | { error: string }> {
    const existingUser = await this.users.findOne({ _id: user });

    // Check if user exists and is currently logged in according to this concept
    if (!existingUser) {
      return { error: "User not found." };
    }
    if (!existingUser.isLoggedIn) {
      return { error: "User is not currently logged in." };
    }

    // Set isLoggedIn to false
    await this.users.updateOne(
      { _id: user },
      { $set: { isLoggedIn: false } },
    );

    return {}; // Return empty record for success
  }

  /**
   * query _isUserLoggedIn (user: User): (loggedIn: Boolean)
   *
   * effects returns true if the user is currently logged in, false otherwise.
   */
  async _isUserLoggedIn(
    { user }: { user: User },
  ): Promise<{ loggedIn: boolean }> {
    const existingUser = await this.users.findOne({ _id: user });
    return { loggedIn: existingUser?.isLoggedIn ?? false };
  }
}
```
