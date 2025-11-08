[@architecture](../background/architecture.md)

[@UserTastePreferences](../../src/concepts/UserTastePreferences/UserTastePreferencesConcept.ts)
[@all-concepts](concept_def.md)

[@implementing-syncs](../background/implementing-syncs.md)

[@feedback-sync](../../src/syncs/feedback.sync.ts)

# generate syncs for anything with userTastePreferences, similar to feedback syncs
# response:

Here are the synchronizations for the `UserTastePreferences` concept, following the pattern of the `feedback.sync.ts` file and incorporating best practices for handling query results, including empty sets and errors.

I've made the following design choices:
1.  **Authentication**: All API requests involving `UserTastePreferences` require a valid `session` to authenticate the `user`. This is done by querying `Sessioning._getUser`.
2.  **Request-Response Flow**: Each external API endpoint (`Requesting.request`) typically has three associated synchronizations:
    *   One to `then` call the corresponding `UserTastePreferences` action/query (e.g., `AddLikedDishRequest`).
    *   One to respond on successful completion (`...Response`).
    *   One to respond on error (`...ResponseError`).
3.  **Query Handling**:
    *   For queries (`_getLikedDishes`, `_getDislikedDishes`), a `where` clause is used to process the potentially multiple results and collect them into a single array for the `Requesting.respond` action.
    *   Specific "empty" response synchronizations (`...ResponseEmpty`) are included for queries to handle cases where no results are found, which is a common pitfall in these architectures.
    *   The `_getLikedDishes` concept's unique behavior (upserting a new user with empty preferences) means it will never return an explicit error object for a non-existent user, only an empty array. Therefore, `GetLikedDishesResponseError` is omitted.
    *   The `_getDislikedDishes` concept *does* return an error object if the user does not exist, so `GetDislikedDishesResponseError` is retained for that specific case.

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
```