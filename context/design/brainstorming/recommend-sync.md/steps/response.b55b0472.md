---
timestamp: 'Fri Nov 07 2025 14:16:49 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_141649.ded58f9c.md]]'
content_id: b55b04720a55c4d51077d5b6190a9a24134d1d028b6264dc6ca30acbaf585a77
---

# response:

To recommend a dish based on a restaurant's menu and a user's taste preferences, we will create a synchronization that leverages the `Requesting`, `Sessioning`, and `RestaurantMenu` concepts.

The `RestaurantMenu` concept already provides a `_getRecommendation` query which internally handles using an LLM and considering taste preferences. Our synchronization will primarily orchestrate the authentication and the call to this query, then respond to the initial request.

Here's the plan for the synchronization:

1. **Listen for a Request:** The sync will trigger when `Requesting.request` is called with a specific path (e.g., `/RestaurantMenu/recommendation`) and includes a `session` ID and a `restaurantId`.
2. **Authenticate User:** In the `where` clause, it will first use `Sessioning._getUser` to retrieve the `user` associated with the provided `session`.
3. **Handle Authentication Errors:** If `Sessioning._getUser` fails to find a user (e.g., invalid session), the sync will construct an error response frame directly and respond.
4. **Get Recommendation:** If authentication is successful, it will call `RestaurantMenu._getRecommendation` with the `restaurantId` and the authenticated `user`.
5. **Handle Recommendation Errors:** `RestaurantMenu._getRecommendation` might return an error if the restaurant is invalid, has no menu items, or the LLM encounters an issue. The sync will capture this error if present.
6. **Respond to Request:** Finally, the `then` clause will use `Requesting.respond` to send back either the successful `recommendation` or the `error` message (from authentication or the recommendation query itself).

Place this code in a new file: `src/syncs/restaurantMenu.sync.ts`.

```typescript
// src/syncs/restaurantMenu.sync.ts

import { actions, Sync, Frames } from "@engine";
import { Requesting, Sessioning, RestaurantMenu } from "@concepts";

/**
 * Synchronization: ProcessDishRecommendationRequest
 *
 * Purpose: Handles an incoming HTTP request to get a dish recommendation for a user
 * at a specific restaurant, including authentication and error handling.
 *
 * Flow:
 * 1. Catches a Requesting.request for the '/RestaurantMenu/recommendation' path.
 * 2. Authenticates the user by querying Sessioning._getUser with the provided session.
 * 3. If authentication fails (no user found for session), it constructs an error frame
 *    and directly responds with an authentication error.
 * 4. If authentication succeeds, it calls RestaurantMenu._getRecommendation with the
 *    restaurant ID and the authenticated user.
 * 5. Captures either the successful recommendation or any error returned by
 *    RestaurantMenu._getRecommendation.
 * 6. Responds to the original request with either the recommendation or the error message.
 */
export const ProcessDishRecommendationRequest: Sync = (
  { request, session, restaurantId, user, recommendation, error }, // Declare all variables that will be bound or used
) => ({
  when: actions([
    Requesting.request,
    // Match requests to '/RestaurantMenu/recommendation' and extract 'session' and 'restaurantId'
    { path: "/RestaurantMenu/recommendation", session, restaurantId },
    { request }, // Bind the original request object for later response
  ]),
  where: async (frames) => {
    // Capture the original request frame. This is crucial for responding to the request
    // even if earlier steps (like authentication) fail and new frames are generated.
    const originalRequestFrame = frames[0];

    // 1. Attempt to authenticate the user by querying Sessioning._getUser.
    // If successful, 'user' will be bound in `userFrames`.
    // If the session is invalid or no user is found, `userFrames` will be empty.
    let userFrames = await frames.query(Sessioning._getUser, { session }, { user });

    if (userFrames.length === 0) {
      // Authentication failed: Sessioning._getUser did not return a user for the given session.
      // Construct a new frame containing the original request and an authentication error message.
      const authErrorResponse = {
        ...originalRequestFrame, // Preserve the original request binding
        [Symbol("error")]: "Authentication required: Invalid or expired session.", // Bind a specific error message
      };
      // Return a new Frames object containing this single error response.
      return new Frames(authErrorResponse);
    }

    // 2. If authentication succeeded, proceed to get the dish recommendation.
    // `userFrames` now contains the authenticated 'user' binding.
    // Call RestaurantMenu._getRecommendation, mapping `restaurantId` from the request
    // to the `restaurant` parameter of the concept action, and using the authenticated `user`.
    // We attempt to bind both `recommendation` (for success) and `error` (for failure)
    // from the `_getRecommendation` query. The engine will only bind one if they are mutually exclusive.
    const recommendationResultFrames = await userFrames.query(
      RestaurantMenu._getRecommendation,
      { restaurant: restaurantId, user }, // Map request's 'restaurantId' to concept's 'restaurant' parameter
      { recommendation, error }, // Attempt to bind either the recommendation or an error
    );

    // This `recommendationResultFrames` will now contain frames that either have:
    // - `[Symbol("recommendation")]` (along with `user`, `request`, etc.) for a successful recommendation.
    // - `[Symbol("error")]` (along with `user`, `request`, etc.) for an error originating from `_getRecommendation`.
    // It will not contain frames with both `recommendation` and `error` simultaneously.
    return recommendationResultFrames;
  },
  then: actions(
    // This `then` clause will fire for each frame produced by the `where` clause.
    // If a frame contains a `recommendation` binding, the first `Requesting.respond` action is triggered.
    [Requesting.respond, { request, recommendation }],

    // If a frame contains an `error` binding (either from the authentication step or
    // from `RestaurantMenu._getRecommendation`), the second `Requesting.respond` action is triggered.
    [Requesting.respond, { request, error }],
  ),
});
```
