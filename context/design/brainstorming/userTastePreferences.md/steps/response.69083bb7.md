---
timestamp: 'Fri Nov 07 2025 14:05:54 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_140554.d0a0e3d6.md]]'
content_id: 69083bb779a6c6a41fe43dd2bbc7d7e2d4674a70ac0631face8525a055294f3e
---

# response:

Here are the synchronizations for the `UserTastePreferences` concept, organized into `src/syncs/userTastePreferences/` directory.

These synchronizations cover:

1. **Request handling**: Translating incoming HTTP requests into `UserTastePreferences` concept actions or queries.
2. **Success responses**: Responding to the original request when a concept action or query completes successfully.
3. **Error responses**: Responding to the original request when a concept action or query returns an error.

***

```typescript
// src/syncs/userTastePreferences/addLikedDish.sync.ts
import { actions, Sync } from "@engine";
import { Requesting, UserTastePreferences } from "@concepts";

// 1. Handles the incoming HTTP request to add a liked dish.
export const AddLikedDishRequest: Sync = ({ request, user, dish }) => ({
  when: actions([
    Requesting.request,
    { path: "/user-taste-preferences/liked-dishes/add", user, dish },
    { request },
  ]),
  then: actions([UserTastePreferences.addLikedDish, { user, dish }]),
});

// 2. Responds to the request upon successful addition of a liked dish.
export const AddLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/liked-dishes/add" },
      { request },
    ],
    [UserTastePreferences.addLikedDish, {}, {}], // Empty output pattern for success
  ),
  then: actions([Requesting.respond, { request, status: "Dish liked successfully." }]),
});

// 3. Responds to the request if an error occurs during addition of a liked dish.
export const AddLikedDishErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/liked-dishes/add" },
      { request },
    ],
    [UserTastePreferences.addLikedDish, {}, { error }], // Output pattern with error
  ),
  then: actions([Requesting.respond, { request, error }]),
});

```

***

```typescript
// src/syncs/userTastePreferences/removeLikedDish.sync.ts
import { actions, Sync } from "@engine";
import { Requesting, UserTastePreferences } from "@concepts";

// 1. Handles the incoming HTTP request to remove a liked dish.
export const RemoveLikedDishRequest: Sync = ({ request, user, dish }) => ({
  when: actions([
    Requesting.request,
    { path: "/user-taste-preferences/liked-dishes/remove", user, dish },
    { request },
  ]),
  then: actions([UserTastePreferences.removeLikedDish, { user, dish }]),
});

// 2. Responds to the request upon successful removal of a liked dish.
export const RemoveLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/liked-dishes/remove" },
      { request },
    ],
    [UserTastePreferences.removeLikedDish, {}, {}], // Empty output pattern for success
  ),
  then: actions([Requesting.respond, { request, status: "Dish unliked successfully." }]),
});

// 3. Responds to the request if an error occurs during removal of a liked dish.
export const RemoveLikedDishErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/liked-dishes/remove" },
      { request },
    ],
    [UserTastePreferences.removeLikedDish, {}, { error }], // Output pattern with error
  ),
  then: actions([Requesting.respond, { request, error }]),
});

```

***

```typescript
// src/syncs/userTastePreferences/addDislikedDish.sync.ts
import { actions, Sync } from "@engine";
import { Requesting, UserTastePreferences } from "@concepts";

// 1. Handles the incoming HTTP request to add a disliked dish.
export const AddDislikedDishRequest: Sync = ({ request, user, dish }) => ({
  when: actions([
    Requesting.request,
    { path: "/user-taste-preferences/disliked-dishes/add", user, dish },
    { request },
  ]),
  then: actions([UserTastePreferences.addDislikedDish, { user, dish }]),
});

// 2. Responds to the request upon successful addition of a disliked dish.
export const AddDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/disliked-dishes/add" },
      { request },
    ],
    [UserTastePreferences.addDislikedDish, {}, {}], // Empty output pattern for success
  ),
  then: actions([Requesting.respond, { request, status: "Dish disliked successfully." }]),
});

// 3. Responds to the request if an error occurs during addition of a disliked dish.
export const AddDislikedDishErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/disliked-dishes/add" },
      { request },
    ],
    [UserTastePreferences.addDislikedDish, {}, { error }], // Output pattern with error
  ),
  then: actions([Requesting.respond, { request, error }]),
});

```

***

```typescript
// src/syncs/userTastePreferences/removeDislikedDish.sync.ts
import { actions, Sync } from "@engine";
import { Requesting, UserTastePreferences } from "@concepts";

// 1. Handles the incoming HTTP request to remove a disliked dish.
export const RemoveDislikedDishRequest: Sync = ({ request, user, dish }) => ({
  when: actions([
    Requesting.request,
    { path: "/user-taste-preferences/disliked-dishes/remove", user, dish },
    { request },
  ]),
  then: actions([UserTastePreferences.removeDislikedDish, { user, dish }]),
});

// 2. Responds to the request upon successful removal of a disliked dish.
export const RemoveDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/disliked-dishes/remove" },
      { request },
    ],
    [UserTastePreferences.removeDislikedDish, {}, {}], // Empty output pattern for success
  ),
  then: actions([Requesting.respond, { request, status: "Dish undisliked successfully." }]),
});

// 3. Responds to the request if an error occurs during removal of a disliked dish.
export const RemoveDislikedDishErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/disliked-dishes/remove" },
      { request },
    ],
    [UserTastePreferences.removeDislikedDish, {}, { error }], // Output pattern with error
  ),
  then: actions([Requesting.respond, { request, error }]),
});

```

***

```typescript
// src/syncs/userTastePreferences/getLikedDishes.sync.ts
import { actions, Frames, Sync } from "@engine";
import { Requesting, UserTastePreferences } from "@concepts";

// 1. Handles the incoming HTTP request to get liked dishes for a user.
export const GetLikedDishesRequest: Sync = (
  { request, user, dish, likedDishes },
) => ({
  when: actions([
    Requesting.request,
    { path: "/user-taste-preferences/liked-dishes", user },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0]; // Capture the original frame for response
    frames = await frames.query(
      UserTastePreferences._getLikedDishes,
      { user },
      { dish }, // `dish` will be bound to individual dish IDs (e.g., "d1", "d2")
    );

    // If no liked dishes or user was new/initialized, frames might be empty or contain `dish: undefined`.
    // The concept returns an empty array `[]` if no dishes or user is new.
    if (frames.length === 0) {
      // If the concept returned an empty array, we need to manually create a frame
      // for the response to fire with an empty likedDishes array.
      return new Frames({ ...originalFrame, [likedDishes]: [] });
    }

    // `collectAs` groups the individual `dish` bindings into an array named `likedDishes`.
    return frames.collectAs([dish], likedDishes);
  },
  then: actions([Requesting.respond, { request, likedDishes }]),
});

// Note: As per the concept's implementation, _getLikedDishes creates a user
// and returns an empty array if not found, rather than an error object for this specific case.
// Thus, a separate error response synchronization for a missing user is not needed here
// unless the concept were to return `[{ error: "..." }]` for other internal query failures.

```

***

```typescript
// src/syncs/userTastePreferences/getDislikedDishes.sync.ts
import { actions, Frames, Sync } from "@engine";
import { Requesting, UserTastePreferences } from "@concepts";

// 1. Handles the incoming HTTP request to get disliked dishes for a user (success path).
export const GetDislikedDishesRequest: Sync = (
  { request, user, dish, dislikedDishes },
) => ({
  when: actions([
    Requesting.request,
    { path: "/user-taste-preferences/disliked-dishes", user },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0]; // Capture the original frame for response
    // Query for disliked dishes, binding individual dishes to 'dish'
    frames = await frames.query(
      UserTastePreferences._getDislikedDishes,
      { user },
      { dish },
    );

    // If no disliked dishes, frames might be empty.
    // Also, if the query returned [{ error: "User not found" }], that will be caught by the error sync.
    // This sync handles the success case (dishes found or no dishes but user exists).
    if (frames.length === 0) {
      // If the concept returned an empty array (user exists but no disliked dishes),
      // create a frame for response with an empty dislikedDishes array.
      return new Frames({ ...originalFrame, [dislikedDishes]: [] });
    }

    // Filter out any frames that might have an error binding (those will be handled by error sync)
    frames = frames.filter(($) => !$[dish]?.error);

    // Collect individual 'dish' bindings into an array named 'dislikedDishes'.
    return frames.collectAs([dish], dislikedDishes);
  },
  then: actions([Requesting.respond, { request, dislikedDishes }]),
});

// 2. Responds to the request if an error occurs (e.g., user not found for _getDislikedDishes).
export const GetDislikedDishesErrorResponse: Sync = ({ request, user, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/user-taste-preferences/disliked-dishes", user },
      { request },
    ],
  ),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Query specifically for the error output from _getDislikedDishes
    frames = await frames.query(
      UserTastePreferences._getDislikedDishes,
      { user },
      { error }, // Bind the error directly
    );
    // Ensure we only proceed if an error was actually returned
    if (frames.length > 0 && frames[0][error]) {
      return new Frames({ ...originalFrame, [error]: frames[0][error] });
    }
    return new Frames(); // No error frame, so this sync won't fire.
  },
  then: actions([Requesting.respond, { request, error }]),
});
```
