---
timestamp: 'Fri Nov 07 2025 15:10:57 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_151057.99dad511.md]]'
content_id: 1f6ff5b362ba362f5a159b0ead57e2d5d1956b36c0e443a2cc7595b07ab712b3
---

# response:

To implement the `getRecommendation` synchronization, we first need to ensure the `RestaurantMenu` concept exists and includes the `_getRecommendation` query as brainstormed.

Since the `RestaurantMenu` concept was only partially described, we'll create a full `RestaurantMenuConcept.ts` file in `src/concepts/RestaurantMenu/` that incorporates the `_getMenuItems` query and the brainstormed `_getRecommendation` query. The `_getRecommendation` query will be updated to return an array of objects, as expected by the `frames.query` mechanism.

After setting up the concept, we'll create a synchronization file `src/syncs/restaurantMenu.sync.ts` that handles:

1. An incoming HTTP request (via `Requesting.request`) that specifies a `session` and `restaurant` ID.
2. Authenticating the user from the `session` using `Sessioning._getUser`.
3. Calling `RestaurantMenu._getRecommendation` with the authenticated `user` and provided `restaurant` ID.
4. Responding to the original request (via `Requesting.respond`) with either the `recommendation` or an `error` message, depending on the outcome of the query.

***

### Step 1: Create/Update `src/concepts/RestaurantMenu/RestaurantMenuConcept.ts`

This file defines the `RestaurantMenu` concept, including a full implementation of the `_getRecommendation` query based on your brainstorming. It will require MongoDB collections for `menuItems` and will access `UserTastePreferences` data (assuming its collection is `UserTastePreferences.users`).

```typescript
// src/concepts/RestaurantMenu/RestaurantMenuConcept.ts
import { Collection, Db } from "npm:mongodb";
import { ID, Empty } from "@utils/types.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts"; // Assuming this utility is available and configured

// Define types for clarity
type Restaurant = ID;
type Dish = ID;
type User = ID;

interface MenuItemDocument {
  _id: ID;
  restaurant: Restaurant;
  name: string;
  description: string;
  price: number;
}

// Interface to represent the structure of a user's taste preferences
interface UserTastePreferencesDocument {
  _id: User;
  likedDishes: Dish[];
  dislikedDishes: Dish[];
}

const PREFIX = "RestaurantMenu" + ".";

export default class RestaurantMenuConcept {
  private menuItems: Collection<MenuItemDocument>;
  private userTastePreferencesCollection: Collection<UserTastePreferencesDocument>;

  constructor(private readonly db: Db) {
    this.menuItems = this.db.collection(PREFIX + "menuItems");
    // Assuming the UserTastePreferences collection name is consistent
    this.userTastePreferencesCollection = this.db.collection(
      "UserTastePreferences.users",
    );
  }

  // --- Concept Actions (based on the provided informal design) ---

  async addMenuItem(
    { restaurant, name, description, price }: {
      restaurant: Restaurant;
      name: string;
      description: string;
      price: number;
    },
  ): Promise<{ menuItem: ID } | { error: string }> {
    const existing = await this.menuItems.findOne({ restaurant, name });
    if (existing) {
      return { error: `Menu item '${name}' already exists for restaurant '${restaurant}'.` };
    }
    const newId = new ID(); // Assuming ID generation
    await this.menuItems.insertOne({ _id: newId, restaurant, name, description, price });
    return { menuItem: newId };
  }

  async updateMenuItem(
    { menuItem, newDescription, newPrice }: {
      menuItem: ID;
      newDescription?: string;
      newPrice?: number;
    },
  ): Promise<{ menuItem: ID } | { error: string }> {
    const updateFields: { description?: string; price?: number } = {};
    if (newDescription !== undefined) updateFields.description = newDescription;
    if (newPrice !== undefined) updateFields.price = newPrice;

    if (Object.keys(updateFields).length === 0) {
      return { error: "No description or price provided for update." };
    }

    const result = await this.menuItems.findOneAndUpdate(
      { _id: menuItem },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return { error: `Menu item with ID '${menuItem}' not found.` };
    }
    return { menuItem: result.value._id };
  }

  async removeMenuItem(
    { menuItem }: { menuItem: ID },
  ): Promise<{ success: boolean } | { error: string }> {
    const result = await this.menuItems.deleteOne({ _id: menuItem });
    if (result.deletedCount === 0) {
      return { error: `Menu item with ID '${menuItem}' not found.` };
    }
    return { success: true };
  }

  // --- Concept Queries (based on the provided informal design) ---

  /**
   * Query: _getMenuItems
   * @requires true
   * @effects returns a set of all menu items associated with the given restaurant, including their name, description, and price
   */
  async _getMenuItems(
    { restaurant }: { restaurant: Restaurant },
  ): Promise<{ menuItem: ID; name: string; description: string; price: number }[]> {
    const items = await this.menuItems.find({ restaurant }).toArray();
    return items.map((item) => ({
      menuItem: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
    }));
  }

  /**
   * Query: _getMenuItemDetails
   * @requires menuItem with the given ID exists
   * @effects returns the name, description, and price of the specified menu item
   */
  async _getMenuItemDetails(
    { menuItem }: { menuItem: ID },
  ): Promise<{ name: string; description: string; price: number } | { error: string }> {
    const item = await this.menuItems.findOne({ _id: menuItem });
    if (!item) {
      return { error: `Menu item with ID '${menuItem}' not found.` };
    }
    return { name: item.name, description: item.description, price: item.price };
  }

  /**
   * Query: _getRecommendation (updated to return an array of results as expected by `frames.query`)
   * @requires a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
   * @effects returns an array containing either a recommended dish or an error object.
   */
  async _getRecommendation(
    { restaurant, user }: { restaurant: ID; user: User },
  ): Promise<[{ recommendation: string }] | [{ error: string }]> {
    try {
      // Fetch the restaurant’s menu
      const menu = await this._getMenuItems({ restaurant });
      if (!menu.length) {
        return [{ error: `No menu items found for restaurant '${restaurant}'.` }];
      }

      // Fetch the user's taste preferences
      const userData = await this.userTastePreferencesCollection.findOne(
        { _id: user },
        { projection: { likedDishes: 1, dislikedDishes: 1 } },
      );

      // Constructing preferences from likedDishes and dislikedDishes for the LLM prompt
      const preferences: Record<string, number> = {};
      if (userData?.likedDishes) {
        userData.likedDishes.forEach((dish) => {
          preferences[`Likes: ${dish}`] = 5;
        });
      }
      if (userData?.dislikedDishes) {
        userData.dislikedDishes.forEach((dish) => {
          preferences[`Dislikes: ${dish}`] = 1;
        });
      }

      if (Object.keys(preferences).length === 0) {
        // If no preferences, return the first menu item as a generic recommendation
        return [{ recommendation: menu[0].name }];
      }

      // Construct prompt with user preferences
      const preferencesText = Object.entries(preferences)
        .map(([trait, score]) => `${trait}: ${score}/5`)
        .join("\n");

      const menuText = menu
        .map((dish) => `- ${dish.name}: ${dish.description}`)
        .join("\n");

      const prompt = `
You are a restaurant recommendation assistant.

USER PREFERENCES:
${preferencesText}

MENU ITEMS:
${menuText}

From the above menu, choose ONE dish that best matches the user's preferences.
Respond only in JSON format:
{"recommendation": "<exact dish name>"}
`.trim();

      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) {
        return [{ error: "Missing GEMINI_API_KEY environment variable." }];
      }

      const llm = new GeminiLLM({ apiKey });
      const llmResponse = await llm.executeLLM(prompt);

      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [{ error: "Failed to parse LLM response as JSON." }];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const recommendation = parsed?.recommendation?.trim();

      if (!recommendation) {
        return [{ error: "LLM did not return a valid recommendation." }];
      }

      // VALIDATION: Verify dish is on the menu
      const match = menu.find(
        (dish) => dish.name.toLowerCase() === recommendation.toLowerCase(),
      );

      if (!match) {
        console.warn(
          `LLM recommended '${recommendation}' which is not on the menu for restaurant '${restaurant}'.`,
        );
        return [{
          error:
            `The recommended dish '${recommendation}' is not on the menu. Please try again.`,
        }];
      }
      return [{ recommendation: match.name }];
    } catch (err) {
      console.error("[RestaurantMenu._getRecommendation] Error:", err);
      return [{ error: (err as Error).message }];
    }
  }
}
```

### Step 2: Create `src/syncs/restaurantMenu.sync.ts`

This synchronization will handle the entire flow from receiving an API request to responding with a recommendation or an error.

```typescript
// src/syncs/restaurantMenu.sync.ts
import { actions, Sync, Frames } from "@engine";
import { Requesting, Sessioning, RestaurantMenu } from "@concepts"; // Import required concepts

export const GetDishRecommendationOnRequest: Sync = (
  { request, session, restaurant, user, recommendation, error, responseBody },
) => ({
  when: actions([
    Requesting.request,
    { path: "/RestaurantMenu/getRecommendation", session, restaurant },
    { request }, // Capture the Requesting.request action's ID
  ]),
  where: async (frames) => {
    // There will be one frame at this point, originating from `Requesting.request`.
    const originalRequestFrame = frames[0];

    // 1. Authenticate user session to get the 'user' ID.
    let processedFrames = await frames.query(
      Sessioning._getUser,
      { session: originalRequestFrame[session] }, // Use the session from the original request
      { user },
    );

    // If no user is found for the session, generate an error response immediately.
    if (processedFrames.length === 0) {
      return new Frames({
        [request]: originalRequestFrame[request], // Preserve the original request ID
        [responseBody]: { error: "Invalid session. User not authenticated." },
      });
    }

    // Now 'processedFrames' contains frames that have `request`, `session`, `restaurant`, and `user` bindings.
    // 2. Call the `RestaurantMenu._getRecommendation` query.
    // This query is expected to return an array of objects: either `[{ recommendation: string }]` or `[{ error: string }]`.
    processedFrames = await processedFrames.query(
      RestaurantMenu._getRecommendation,
      { restaurant: restaurant, user: user }, // Use variables from the current frame
      { recommendation, error }, // Bind the output to these variables
    );

    // 3. Transform the query results into a single `responseBody` for `Requesting.respond`.
    const finalFrames = [];
    for (const frame of processedFrames) {
      let body: { recommendation?: string; error?: string };
      if (frame[recommendation] !== undefined) {
        body = { recommendation: frame[recommendation] as string };
      } else if (frame[error] !== undefined) {
        body = { error: frame[error] as string };
      } else {
        // Fallback for unexpected cases where neither recommendation nor error is bound
        body = { error: "Failed to get a recommendation (query returned no specific result)." };
      }
      finalFrames.push({
        ...frame, // Keep all existing bindings (including `request`, `session`, `restaurant`, `user`)
        [responseBody]: body, // Add the constructed response body
      });
    }

    return new Frames(...finalFrames);
  },
  then: actions(
    // 4. Respond to the original request using the `responseBody` constructed in the `where` clause.
    // The `...responseBody` syntax spreads the properties of the `responseBody` object
    // directly as parameters to `Requesting.respond`.
    // E.g., if `responseBody` is `{ recommendation: "Pizza" }`, it calls `Requesting.respond({ request, recommendation: "Pizza" })`.
    // If `responseBody` is `{ error: "No menu" }`, it calls `Requesting.respond({ request, error: "No menu" })`.
    [Requesting.respond, { request, ...responseBody }],
  ),
});
```

***

### How to use it:

1. **Save the files:**
   * Save the first block of code as `src/concepts/RestaurantMenu/RestaurantMenuConcept.ts`.
   * Save the second block of code as `src/syncs/restaurantMenu.sync.ts`.
2. **Environment Variable:** Ensure you have `GEMINI_API_KEY` set in your `.env` file, as the `_getRecommendation` query uses a Gemini LLM.
3. **Build:** Run `deno run build` from your project root. This will scan your `src/concepts` and `src/syncs` directories and generate the necessary `@concepts` and `@syncs` imports.
4. **Start:** Run `deno run start` to start your application server.
5. **Make a Request:** You can now send an HTTP POST request to `/api/RestaurantMenu/getRecommendation` with a JSON body containing `session` and `restaurant` IDs.

**Example Request (assuming `s123` is a valid session and `r456` is a restaurant ID):**

```http
POST /api/RestaurantMenu/getRecommendation
Content-Type: application/json

{
  "session": "s123",
  "restaurant": "r456"
}
```

The system will:

1. Receive the request.
2. Find the `GetDishRecommendationOnRequest` synchronization.
3. Authenticate the `session` to get the `user`.
4. Call the `RestaurantMenu._getRecommendation` query.
5. Construct a response body with the recommendation or an error.
6. Send an HTTP response back to the client.
