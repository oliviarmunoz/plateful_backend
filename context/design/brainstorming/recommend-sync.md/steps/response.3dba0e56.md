---
timestamp: 'Fri Nov 07 2025 15:06:58 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_150658.8caba26e.md]]'
content_id: 3dba0e566bb3d92026272a7130d829f75a37cf23bc6f1251c6b0dbdb31550b0d
---

# response:

Okay, let's create the synchronizations for the `_getRecommendation` query, following the pattern of handling requests and responses.

First, ensure you have a `RestaurantMenu` concept defined (e.g., in `src/concepts/RestaurantMenu/RestaurantMenuConcept.ts`) that includes the `_getRecommendation` query. The brainstorming file provides the internal logic for this query, so the concept definition would look something like this:

```concept
// src/concepts/RestaurantMenu/RestaurantMenuConcept.ts (Conceptual outline)
concept RestaurantMenu [Restaurant, User]
// ... other actions and state ...

queries
  _getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
  // ... other queries ...
  _getRecommendation (restaurant: Restaurant, user: User): (recommendation: String)
    requires: a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
    effects: returns the name of a menu item from the specified restaurant that is recommended for the user via an LLM, based on their taste preferences and the current menu items. If no specific preferences are found, a generic recommendation may be provided.
```

Now, let's create the synchronization file.

**`src/syncs/restaurant_recommendations.sync.ts`**

```typescript
import { actions, Sync, Frames } from "@engine"; // Import Frames for potential zero-match handling
import { Requesting, Sessioning, RestaurantMenu } from "@concepts"; // Import necessary concepts

/**
 * Synchronization: GetRecommendationRequest
 * Purpose: Initiates the recommendation process based on an incoming HTTP request.
 *          It authenticates the user via the session and then triggers the
 *          _getRecommendation query from the RestaurantMenu concept.
 */
export const GetRecommendationRequest: Sync = (
  { request, session, restaurant, user, recommendation }, // Declare variables
) => ({
  when: actions([
    Requesting.request,
    { path: "/RestaurantMenu/getRecommendation", session, restaurant },
    { request }, // Capture the request object for later response
  ]),
  where: async (frames) => {
    // Make sure to grab the original frame to return to the response
    const originalFrame = frames[0];

    // 1. Authenticate the user by getting their ID from the session
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // If no user is found for the session, respond with an error immediately
    if (frames.length === 0) {
      const response = { ...originalFrame, error: "Authentication failed: Invalid session." };
      return new Frames(response);
    }
    
    // 2. Trigger the _getRecommendation query
    // The query itself will handle cases where the user/restaurant don't exist
    frames = await frames.query(
      RestaurantMenu._getRecommendation,
      { restaurant, user },
      { recommendation } // Expects an object with 'recommendation' or 'error' from the query
    );
    
    // If the _getRecommendation query returned no frames (e.g., no restaurant, no menu, LLM failed to produce a valid response without erroring out)
    // we need to ensure the request object is preserved for the response syncs.
    // This assumes the _getRecommendation query returns either [{ recommendation: "..." }] or [{ error: "..." }]
    // If it returns an empty array for some failure, we need to map that to an error.
    if (frames.length === 0 && originalFrame) {
      // This case might happen if _getRecommendation internally returns [] rather than [{ error: ... }]
      // or if there's a problem with the concept engine handling the query output.
      // For robustness, let's explicitly create an error frame if nothing came back.
      const errorFrame = { ...originalFrame, error: "Recommendation service did not return a valid response." };
      return new Frames(errorFrame);
    }
    
    return frames;
  },
  then: actions(
    // The query already returned either { recommendation: ... } or { error: ... }
    // These will be caught by the response syncs below.
    // We don't need a direct 'then' action here beyond the implicit flow.
    // If the frames from 'where' contain 'recommendation', it will match GetRecommendationResponse.
    // If the frames from 'where' contain 'error', it will match GetRecommendationResponseError.
  ),
});

/**
 * Synchronization: GetRecommendationResponse
 * Purpose: Responds to the original HTTP request with a successful dish recommendation.
 */
export const GetRecommendationResponse: Sync = (
  { request, recommendation },
) => ({
  when: actions(
    // Match the original request that initiated the process
    [Requesting.request, { path: "/RestaurantMenu/getRecommendation" }, { request }],
    // Match when the _getRecommendation query completes successfully
    // (Note: the `where` clause of GetRecommendationRequest already executed this query and bound 'recommendation')
    // We explicitly match on the presence of `recommendation` in the frame here.
    { type: Requesting.request.type, actionId: request }, // Match the *specific* request by its actionId
    { type: RestaurantMenu._getRecommendation.type, recommendation }, // Match the *specific* recommendation result
  ),
  then: actions([
    Requesting.respond,
    { request, recommendation }, // Respond with the captured request and the recommendation
  ]),
});

/**
 * Synchronization: GetRecommendationResponseError
 * Purpose: Responds to the original HTTP request with an error message
 *          if the recommendation process failed.
 */
export const GetRecommendationResponseError: Sync = ({ request, error }) => ({
  when: actions(
    // Match the original request
    [Requesting.request, { path: "/RestaurantMenu/getRecommendation" }, { request }],
    // Match when the _getRecommendation query (or authentication) resulted in an error
    { type: Requesting.request.type, actionId: request }, // Match the *specific* request by its actionId
    { type: RestaurantMenu._getRecommendation.type, error }, // Match the *specific* error result
  ),
  then: actions([
    Requesting.respond,
    { request, error }, // Respond with the captured request and the error
  ]),
});
```

**Explanation of the `GetRecommendationRequest` `where` clause:**

1. **`originalFrame = frames[0];`**: We store the initial frame because subsequent `query` calls might filter out frames, and we need the `request` variable from the original frame to send a response even if a query fails to produce results.
2. **`frames = await frames.query(Sessioning._getUser, { session }, { user });`**: This attempts to retrieve the `user` ID associated with the `session`.
3. **`if (frames.length === 0)`**: If `Sessioning._getUser` doesn't find a user for the given session (e.g., session doesn't exist or is invalid), `frames` becomes empty. In this case, we construct a new `Frames` object with the `originalFrame` (to keep the `request` binding) and an `error` message. This allows `GetRecommendationResponseError` to fire immediately.
4. **`frames = await frames.query(RestaurantMenu._getRecommendation, { restaurant, user }, { recommendation });`**: This calls the core recommendation logic. The `_getRecommendation` query from your brainstorming doc is designed to return `[{ recommendation: "..." }]` on success or `[{ error: "..." }]` on failure. The `query` method will unpack this and bind either `recommendation` or `error` into the frames.
5. **`if (frames.length === 0 && originalFrame)`**: This is a robust check. If the `_getRecommendation` query, for some reason, returns an empty array instead of an object with an `error` field when it fails, this ensures we still catch it and return a generic error.

**How the Response Syncs Work (Implicit Flow):**

The `then` clause of `GetRecommendationRequest` is intentionally empty of direct `RestaurantMenu._getRecommendation` calls. This is because the `RestaurantMenu._getRecommendation` action is already *fired and its result bound to the frames* within the `where` clause.

The response synchronizations (`GetRecommendationResponse` and `GetRecommendationResponseError`) will then match these resultant frames:

* If a frame contains `recommendation`, `GetRecommendationResponse` will trigger.
* If a frame contains `error`, `GetRecommendationResponseError` will trigger.

This decouples the initiation from the response handling, making the flow clearer and more modular.
