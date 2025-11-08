---
timestamp: 'Fri Nov 07 2025 14:08:05 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_140805.8651acce.md]]'
content_id: 0057b4a62bd42359c89ffce48cc68cec104823745b9139373aaa90809ca9e785
---

# response:

Here are the synchronizations for the `UserTastePreferences` concept, following the pattern of the `feedback.sync.ts` file and incorporating best practices for handling query results, including empty sets and errors.

I've made the following design choices:

1. **Authentication**: All API requests involving `UserTastePreferences` require a valid `session` to authenticate the `user`. This is done by querying `Sessioning._getUser`.
2. **Request-Response Flow**: Each external API endpoint (`Requesting.request`) typically has three associated synchronizations:
   * One to `then` call the corresponding `UserTastePreferences` action/query (e.g., `AddLikedDishRequest`).
   * One to respond on successful completion (`...Response`).
   * One to respond on error (`...ResponseError`).
3. **Query Handling**:
   * For queries (`_getLikedDishes`, `_getDislikedDishes`), a `where` clause is used to process the potentially multiple results and collect them into a single array for the `Requesting.respond` action.
   * Specific "empty" response synchronizations (`...ResponseEmpty`) are included for queries to handle cases where no results are found, which is a common pitfall in these architectures.
   * The `_getLikedDishes` concept's unique behavior (upserting a new user with empty preferences) means it will never return an explicit error object for a non-existent user, only an empty array. Therefore, `GetLikedDishesResponseError` is omitted.
   * The `_getDislikedDishes` concept *does* return an error object if the user does not exist, so `GetDislikedDishesResponseError` is retained for that specific case.

```typescript
import { actions, Frames, Sync } from "@engine";
import { Requesting, Sessioning, UserTastePreferences } from "@concepts";

// Helper for success messages for actions returning Empty or {error: string}
const successResponse = (message: string) => ({ message });

// ===============================================
// 1. addLikedDish Syncs
// ===============================================
export const AddLikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/addLikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences.addLikedDish, { user, dish }]),
});

export const AddLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addLikedDish" }, { request }],
    [UserTastePreferences.addLikedDish, {}, {}], // Concept returns Empty on success
  ),
  then: actions([Requesting.respond, { request, ...successResponse("Dish liked successfully.") }]),
});

export const AddLikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addLikedDish" }, { request }],
    [UserTastePreferences.addLikedDish, {}, { error }], // Concept returns { error: string } on failure
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ===============================================
// 2. removeLikedDish Syncs
// ===============================================
export const RemoveLikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/removeLikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences.removeLikedDish, { user, dish }]),
});

export const RemoveLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeLikedDish" }, { request }],
    [UserTastePreferences.removeLikedDish, {}, {}], // Concept returns Empty on success
  ),
  then: actions([Requesting.respond, { request, ...successResponse("Dish unliked successfully.") }]),
});

export const RemoveLikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeLikedDish" }, { request }],
    [UserTastePreferences.removeLikedDish, {}, { error }], // Concept returns { error: string } on failure
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ===============================================
// 3. addDislikedDish Syncs
// ===============================================
export const AddDislikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/addDislikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences.addDislikedDish, { user, dish }]),
});

export const AddDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addDislikedDish" }, { request }],
    [UserTastePreferences.addDislikedDish, {}, {}], // Concept returns Empty on success
  ),
  then: actions([Requesting.respond, { request, ...successResponse("Dish disliked successfully.") }]),
});

export const AddDislikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addDislikedDish" }, { request }],
    [UserTastePreferences.addDislikedDish, {}, { error }], // Concept returns { error: string } on failure
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ===============================================
// 4. removeDislikedDish Syncs
// ===============================================
export const RemoveDislikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/removeDislikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences.removeDislikedDish, { user, dish }]),
});

export const RemoveDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeDislikedDish" }, { request }],
    [UserTastePreferences.removeDislikedDish, {}, {}], // Concept returns Empty on success
  ),
  then: actions([Requesting.respond, { request, ...successResponse("Dish un-disliked successfully.") }]),
});

export const RemoveDislikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeDislikedDish" }, { request }],
    [UserTastePreferences.removeDislikedDish, {}, { error }], // Concept returns { error: string } on failure
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ===============================================
// 5. _getLikedDishes Query Syncs
// ===============================================
export const GetLikedDishesRequest: Sync = (
  { request, session, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/getLikedDishes", session },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences._getLikedDishes, { user }]),
});

export const GetLikedDishesResponse: Sync = (
  { request, likedDishes, user, dish },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/getLikedDishes" }, { request }],
    // Match on _getLikedDishes returning actual dishes (each result will create a frame with 'dishes: dish')
    [UserTastePreferences._getLikedDishes, { user }, { dishes: dish }],
  ),
  where: async (frames) => {
    // Collect all 'dish' IDs into a simple array
    const dishIds = frames.map(frame => frame[dish]);
    // Create a new frame with the collected array
    return new Frames({ ...frames[0], [likedDishes]: dishIds });
  },
  then: actions([Requesting.respond, { request, likedDishes }]),
});

export const GetLikedDishesResponseEmpty: Sync = ( // Handles user exists but has no liked dishes, or new user
  { request, user },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/getLikedDishes" }, { request }],
  ),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Authenticate user session
    frames = await frames.query(Sessioning._getUser, { session: originalFrame.session }, { user });

    // Attempt to query _getLikedDishes. Use a temporary symbol for the output to avoid conflicts
    const queryResults = await frames.query(UserTastePreferences._getLikedDishes, { user }, { dishes: Symbol("tempDish") });

    // This sync should only fire if _getLikedDishes returned an empty array (no dishes).
    // The concept _getLikedDishes will never return an explicit error object, it upserts new users and returns empty list.
    if (queryResults.length === 0) {
      // Return a frame with the original request and an empty array for likedDishes
      return new Frames({ ...originalFrame, [user]: frames[0][user], [Symbol("likedDishes")]: [] });
    }
    // If queryResults is NOT empty, it means there ARE liked dishes, so this sync should NOT fire.
    return new Frames();
  },
  then: actions([Requesting.respond, { request, likedDishes: [] }]),
});
// Note: GetLikedDishesResponseError is not needed because _getLikedDishes never returns { error: string }.

// ===============================================
// 6. _getDislikedDishes Query Syncs
// ===============================================
export const GetDislikedDishesRequest: Sync = (
  { request, session, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/getDislikedDishes", session },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences._getDislikedDishes, { user }]),
});

export const GetDislikedDishesResponse: Sync = (
  { request, dislikedDishes, user, dish },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/getDislikedDishes" }, { request }],
    // Match on _getDislikedDishes returning actual dishes
    [UserTastePreferences._getDislikedDishes, { user }, { dishes: dish }],
  ),
  where: async (frames) => {
    // Collect all 'dish' IDs into a simple array
    const dishIds = frames.map(frame => frame[dish]);
    // Create a new frame with the collected array
    return new Frames({ ...frames[0], [dislikedDishes]: dishIds });
  },
  then: actions([Requesting.respond, { request, dislikedDishes }]),
});

export const GetDislikedDishesResponseEmpty: Sync = ( // Handles user exists but has no disliked dishes
  { request, user },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/getDislikedDishes" }, { request }],
  ),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Authenticate user session
    frames = await frames.query(Sessioning._getUser, { session: originalFrame.session }, { user });

    // Attempt to query _getDislikedDishes.
    const queryResults = await frames.query(UserTastePreferences._getDislikedDishes, { user }, { dishes: Symbol("tempDish") });

    // This sync should only fire if _getDislikedDishes returned an empty array (no dishes).
    // It should NOT fire if it returned an error (that's for GetDislikedDishesResponseError)
    // It should NOT fire if it returned actual dishes (that's for GetDislikedDishesResponse)
    if (queryResults.length === 0) {
      // Return a frame with the original request and an empty array for dislikedDishes
      return new Frames({ ...originalFrame, [user]: frames[0][user], [Symbol("dislikedDishes")]: [] });
    }
    return new Frames(); // Do not respond here if results were found or an error occurred
  },
  then: actions([Requesting.respond, { request, dislikedDishes: [] }]),
});

export const GetDislikedDishesResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/getDislikedDishes" }, { request }],
    [UserTastePreferences._getDislikedDishes, {}, { error }], // Concept returns [{ error: string }] if user doesn't exist
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
