import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
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
      return { error: "Username already exists." };
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
  async authenticate(
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
}
