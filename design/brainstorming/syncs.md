[@architecture](../background/architecture.md)

[@concept-def](concept_def.md)

[@implementing-syncs](../background/implementing-syncs.md)

# generate syncs for this
# response:

```typescript
// src/syncs/auth.sync.ts
import { actions, Sync, Frames } from "@engine";
import { Requesting, UserAuthentication, Sessioning } from "@concepts"; // Assuming Sessioning concept exists

// --- Register User ---

/**
 * Handles incoming HTTP requests to register a new user.
 *
 * Catches: Requesting.request with path "/auth/register" and provides username, password.
 * Triggers: UserAuthentication.register action.
 */
export const RegisterUserRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/auth/register", username, password },
    { request },
  ]),
  then: actions([UserAuthentication.register, { username, password }]),
});

/**
 * Responds to a successful user registration.
 *
 * Catches: The original Requesting.request for registration and a successful UserAuthentication.register.
 * Triggers: Sessioning.createSession to establish a user session, then Requesting.respond with user and new session.
 */
export const RegisterUserResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/auth/register" }, { request }],
    [UserAuthentication.register, {}, { user }], // Successful registration returns 'user'
  ),
  then: actions(
    [Sessioning.createSession, { user }, { session: "session" }], // Create a session for the new user
    [Requesting.respond, { request, user, session: "session" }], // Respond with user and new session
  ),
});

/**
 * Responds to a failed user registration.
 *
 * Catches: The original Requesting.request for registration and a failed UserAuthentication.register.
 * Triggers: Requesting.respond with the error.
 */
export const RegisterUserResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/auth/register" }, { request }],
    [UserAuthentication.register, {}, { error }], // Failed registration returns 'error'
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Authenticate User (Login) ---

/**
 * Handles incoming HTTP requests to authenticate a user.
 *
 * Catches: Requesting.request with path "/auth/login" and provides username, password.
 * Triggers: UserAuthentication.authenticate action.
 */
export const AuthenticateUserRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/auth/login", username, password },
    { request },
  ]),
  then: actions([UserAuthentication.authenticate, { username, password }]),
});

/**
 * Responds to a successful user authentication (login).
 *
 * Catches: The original Requesting.request for login and a successful UserAuthentication.authenticate.
 * Triggers: Sessioning.createSession to establish a user session, then Requesting.respond with user and new session.
 */
export const AuthenticateUserResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/auth/login" }, { request }],
    [UserAuthentication.authenticate, {}, { user }], // Successful authentication returns 'user'
  ),
  then: actions(
    [Sessioning.createSession, { user }, { session: "session" }], // Create a session for the authenticated user
    [Requesting.respond, { request, user, session: "session" }], // Respond with user and new session
  ),
});

/**
 * Responds to a failed user authentication.
 *
 * Catches: The original Requesting.request for login and a failed UserAuthentication.authenticate.
 * Triggers: Requesting.respond with the error.
 */
export const AuthenticateUserResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/auth/login" }, { request }],
    [UserAuthentication.authenticate, {}, { error }], // Failed authentication returns 'error'
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
```typescript
// src/syncs/feedback.sync.ts
import { actions, Sync, Frames } from "@engine";
import { Requesting, Feedback, Sessioning } from "@concepts";

// Common pattern for session-based authorization within a 'where' clause.
// Returns an object indicating if authorized and the resulting frames (either authorized with user or error with message).
const checkSessionAuthorization = async (frames: Frames, requestVar: symbol, sessionVar: symbol, userVar: symbol, missingSessionMessage: string, invalidSessionMessage: string): Promise<{ authorized: boolean, frames: Frames }> => {
  const originalFrame = frames[0]; // Assuming single frame input to where
  
  if (!originalFrame[sessionVar]) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: missingSessionMessage }) };
  }
  
  let userFrames = await frames.query(Sessioning._getUser, { session: originalFrame[sessionVar] }, { user: userVar });
  if (userFrames.length === 0) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: invalidSessionMessage }) };
  }
  return { authorized: true, frames: userFrames };
};

// --- Submit Feedback ---

/**
 * Handles incoming HTTP requests to submit feedback, and responds with an authorization error if session is missing or invalid.
 *
 * Catches: Requesting.request with path "/item/:item/feedback".
 * Where: Checks for valid session. If session is missing or invalid, an error frame is created.
 * Then: Responds with the authorization error.
 */
export const SubmitFeedback_RespondUnauthorized: Sync = ({ request, item, rating, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/item/:item/feedback" },
    { request, item },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to submit feedback.",
      "Unauthorized: Invalid session for submitting feedback."
    );
    return authorized ? new Frames() : resultFrames; // If authorized, this sync does nothing. If unauthorized, returns the error frame.
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to submit feedback, proceeding if authorized.
 *
 * Catches: Requesting.request with path "/item/:item/feedback" and a session.
 * Where: Checks for valid session. If valid, proceeds with frames bound with `user`.
 * Triggers: Feedback.submitFeedback action.
 */
export const SubmitFeedback_Authorized: Sync = ({ request, item, rating, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/item/:item/feedback", rating, session },
    { request, item },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", "" // Error messages not needed for authorized path here
    );
    return authorized ? resultFrames : new Frames(); // If authorized, returns user frames. If unauthorized, this sync does nothing.
  },
  then: actions(
    [Feedback.submitFeedback, { author: user, item, rating }],
  ),
});

/**
 * Responds to a successful feedback submission.
 *
 * Catches: The original Requesting.request for feedback submission and a successful Feedback.submitFeedback.
 * Triggers: Requesting.respond with the created feedback.
 */
export const SubmitFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/item/:item/feedback" }, { request }],
    [Feedback.submitFeedback, {}, { feedback }],
  ),
  then: actions([Requesting.respond, { request, feedback }]),
});

/**
 * Responds to a failed feedback submission.
 *
 * Catches: The original Requesting.request for feedback submission and a failed Feedback.submitFeedback.
 * Triggers: Requesting.respond with the error.
 */
export const SubmitFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/item/:item/feedback" }, { request }],
    [Feedback.submitFeedback, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Update Feedback ---

/**
 * Handles incoming HTTP requests to update feedback, and responds with an authorization error if session is missing or invalid.
 */
export const UpdateFeedback_RespondUnauthorized: Sync = ({ request, item, newRating, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/item/:item/feedback" },
    { request, item },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to update feedback.",
      "Unauthorized: Invalid session for updating feedback."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to update feedback, proceeding if authorized.
 * Triggers: Feedback.updateFeedback action.
 */
export const UpdateFeedback_Authorized: Sync = ({ request, item, newRating, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/item/:item/feedback", newRating, session },
    { request, item },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", ""
    );
    return authorized ? resultFrames : new Frames();
  },
  then: actions(
    [Feedback.updateFeedback, { author: user, item, newRating }],
  ),
});

/**
 * Responds to a successful feedback update.
 */
export const UpdateFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/item/:item/feedback" }, { request }],
    [Feedback.updateFeedback, {}, { feedback }],
  ),
  then: actions([Requesting.respond, { request, feedback }]),
});

/**
 * Responds to a failed feedback update.
 */
export const UpdateFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/item/:item/feedback" }, { request }],
    [Feedback.updateFeedback, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Delete Feedback ---

/**
 * Handles incoming HTTP requests to delete feedback, and responds with an authorization error if session is missing or invalid.
 */
export const DeleteFeedback_RespondUnauthorized: Sync = ({ request, item, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/item/:item/feedback" },
    { request, item },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to delete feedback.",
      "Unauthorized: Invalid session for deleting feedback."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to delete feedback, proceeding if authorized.
 * Triggers: Feedback.deleteFeedback action.
 */
export const DeleteFeedback_Authorized: Sync = ({ request, item, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/item/:item/feedback", session },
    { request, item },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", ""
    );
    return authorized ? resultFrames : new Frames();
  },
  then: actions(
    [Feedback.deleteFeedback, { author: user, item }],
  ),
});

/**
 * Responds to a successful feedback deletion.
 */
export const DeleteFeedbackResponse: Sync = ({ request, successful }) => ({
  when: actions(
    [Requesting.request, { path: "/item/:item/feedback" }, { request }],
    [Feedback.deleteFeedback, {}, { successful }],
  ),
  then: actions([Requesting.respond, { request, successful }]),
});

/**
 * Responds to a failed feedback deletion.
 */
export const DeleteFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/item/:item/feedback" }, { request }],
    [Feedback.deleteFeedback, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
```typescript
// src/syncs/menu_items.sync.ts
import { actions, Sync, Frames } from "@engine";
import { Requesting, RestaurantMenu, Sessioning, Restaurant, UserTastePreferences } from "@concepts"; // Assuming Restaurant and UserTastePreferences concepts exist

// Common authorization helper for restaurant ownership.
// Returns an object indicating if authorized and the resulting frames (either authorized with user/owner or error with message).
const checkRestaurantOwnership = async (frames: Frames, requestVar: symbol, restaurantVar: symbol, sessionVar: symbol, userVar: symbol, ownerVar: symbol, missingSessionMessage: string, invalidSessionMessage: string, unauthorizedOwnerMessage: string): Promise<{ authorized: boolean, frames: Frames }> => {
  const originalFrame = frames[0];

  // 1. Check for missing session
  if (!originalFrame[sessionVar]) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: missingSessionMessage }) };
  }
  
  // 2. Try to get user from session
  let userFrames = await frames.query(Sessioning._getUser, { session: originalFrame[sessionVar] }, { user: userVar });
  if (userFrames.length === 0) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: invalidSessionMessage }) };
  }

  // 3. Try to get restaurant owner
  let ownerFrames = await userFrames.query(Restaurant._getOwner, { restaurant: originalFrame[restaurantVar] }, { owner: ownerVar });
  if (ownerFrames.length === 0) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: "Restaurant not found or owner information missing." }) };
  }

  // 4. Check if user is the owner
  const authorizedFrames = ownerFrames.filter(($) => $[userVar] === $[ownerVar]);
  if (authorizedFrames.length === 0) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: unauthorizedOwnerMessage }) };
  }

  return { authorized: true, frames: authorizedFrames };
};

// --- Add Menu Item ---

/**
 * Handles incoming HTTP requests to add a menu item, and responds with an authorization error.
 * Catches: Requesting.request for menu item addition.
 * Where: Checks for session and restaurant ownership. If unauthorized, an error frame is created.
 * Then: Responds with the authorization error.
 */
export const AddMenuItem_RespondUnauthorized: Sync = ({ request, restaurant, name, description, price, session, user, owner }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu" },
    { request, restaurant },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkRestaurantOwnership(
      frames, request, restaurant, session, user, owner,
      "Unauthorized: A session is required to add menu items.",
      "Unauthorized: Invalid session for adding menu items.",
      "Unauthorized: Only restaurant owner can add menu items."
    );
    return authorized ? new Frames() : resultFrames; // If authorized, this sync does nothing. If unauthorized, returns the error frame.
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to add a menu item, proceeding if authorized.
 * Catches: Requesting.request for menu item addition.
 * Where: Checks for session and restaurant ownership. If authorized, proceeds with frames bound with `user` and `owner`.
 * Triggers: RestaurantMenu.addMenuItem action.
 */
export const AddMenuItem_Authorized: Sync = ({ request, restaurant, name, description, price, session, user, owner }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu", name, description, price, session },
    { request, restaurant },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkRestaurantOwnership(
      frames, request, restaurant, session, user, owner, "", "", "" // Error messages not needed for authorized path here
    );
    return authorized ? resultFrames : new Frames(); // If authorized, returns authorized frames. If unauthorized, this sync does nothing.
  },
  then: actions(
    [RestaurantMenu.addMenuItem, { restaurant, name, description, price }],
  ),
});

/**
 * Responds to a successful menu item addition.
 * Catches: The original Requesting.request and a successful RestaurantMenu.addMenuItem.
 * Triggers: Requesting.respond with the new menuItem.
 */
export const AddMenuItemResponse: Sync = ({ request, menuItem }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu" }, { request }],
    [RestaurantMenu.addMenuItem, {}, { menuItem }],
  ),
  then: actions([Requesting.respond, { request, menuItem }]),
});

/**
 * Responds to a failed menu item addition.
 * Catches: The original Requesting.request and a failed RestaurantMenu.addMenuItem.
 * Triggers: Requesting.respond with the error.
 */
export const AddMenuItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu" }, { request }],
    [RestaurantMenu.addMenuItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Update Menu Item ---

/**
 * Handles incoming HTTP requests to update a menu item, and responds with an authorization error.
 */
export const UpdateMenuItem_RespondUnauthorized: Sync = ({ request, menuItem, newDescription, newPrice, session, user, owner, restaurant }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu/:menuItem" },
    { request, menuItem, restaurant },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkRestaurantOwnership(
      frames, request, restaurant, session, user, owner,
      "Unauthorized: A session is required to update menu items.",
      "Unauthorized: Invalid session for updating menu items.",
      "Unauthorized: Only restaurant owner can update menu items."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to update a menu item, proceeding if authorized.
 * Triggers: RestaurantMenu.updateMenuItem action.
 */
export const UpdateMenuItem_Authorized: Sync = ({ request, menuItem, newDescription, newPrice, session, user, owner, restaurant }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu/:menuItem", newDescription, newPrice, session },
    { request, menuItem, restaurant },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkRestaurantOwnership(
      frames, request, restaurant, session, user, owner, "", "", ""
    );
    return authorized ? resultFrames : new Frames();
  },
  then: actions(
    [RestaurantMenu.updateMenuItem, { menuItem, newDescription, newPrice }],
  ),
});

/**
 * Responds to a successful menu item update.
 */
export const UpdateMenuItemResponse: Sync = ({ request, menuItem }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu/:menuItem" }, { request }],
    [RestaurantMenu.updateMenuItem, {}, { menuItem }],
  ),
  then: actions([Requesting.respond, { request, menuItem }]),
});

/**
 * Responds to a failed menu item update.
 */
export const UpdateMenuItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu/:menuItem" }, { request }],
    [RestaurantMenu.updateMenuItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Remove Menu Item ---

/**
 * Handles incoming HTTP requests to remove a menu item, and responds with an authorization error.
 */
export const RemoveMenuItem_RespondUnauthorized: Sync = ({ request, menuItem, session, user, owner, restaurant }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu/:menuItem" },
    { request, menuItem, restaurant },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkRestaurantOwnership(
      frames, request, restaurant, session, user, owner,
      "Unauthorized: A session is required to remove menu items.",
      "Unauthorized: Invalid session for removing menu items.",
      "Unauthorized: Only restaurant owner can remove menu items."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to remove a menu item, proceeding if authorized.
 * Triggers: RestaurantMenu.removeMenuItem action.
 */
export const RemoveMenuItem_Authorized: Sync = ({ request, menuItem, session, user, owner, restaurant }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu/:menuItem", session },
    { request, menuItem, restaurant },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkRestaurantOwnership(
      frames, request, restaurant, session, user, owner, "", "", ""
    );
    return authorized ? resultFrames : new Frames();
  },
  then: actions(
    [RestaurantMenu.removeMenuItem, { menuItem }],
  ),
});

/**
 * Responds to a successful menu item removal.
 */
export const RemoveMenuItemResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu/:menuItem" }, { request }],
    [RestaurantMenu.removeMenuItem, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

/**
 * Responds to a failed menu item removal.
 */
export const RemoveMenuItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu/:menuItem" }, { request }],
    [RestaurantMenu.removeMenuItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Get Menu Items --- (Publicly accessible, no auth required)

/**
 * Handles incoming HTTP requests to get all menu items for a restaurant.
 * Catches: Requesting.request for menu items.
 * Where: Queries RestaurantMenu._getMenuItems. Handles empty results.
 * Then: Responds with collected menu items.
 */
export const GetMenuItemsRequest: Sync = ({ request, restaurant, results }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu" },
    { request, restaurant },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(RestaurantMenu._getMenuItems, { restaurant: originalFrame[restaurant] }, { menuItem: "menuItem", name: "name", description: "description", price: "price" });
    
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [results]: [] }); // Return empty array if no items
    }
    return frames.collectAs(["menuItem", "name", "description", "price"], results);
  },
  then: actions(
    [Requesting.respond, { request, results }],
  ),
});

/**
 * Responds to a failed request to get menu items.
 */
export const GetMenuItemsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu" }, { request }],
    [RestaurantMenu._getMenuItems, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});


// --- Get Menu Item Details --- (Publicly accessible)

/**
 * Handles incoming HTTP requests to get details for a specific menu item.
 * Catches: Requesting.request for menu item details.
 * Where: Queries RestaurantMenu._getMenuItemDetails. Handles not found.
 * Then: Responds with menu item details.
 */
export const GetMenuItemDetailsRequest: Sync = ({ request, menuItem, name, description, price, restaurant }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/menu/:menuItem" }, // restaurant from path
    { request, menuItem, restaurant },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(RestaurantMenu._getMenuItemDetails, { menuItem: originalFrame[menuItem] }, { name, description, price });
    
    if (frames.length === 0) {
        return new Frames({ ...originalFrame, ["error" as symbol]: "Menu item not found or does not belong to this restaurant." });
    }
    return frames;
  },
  then: actions(
    [Requesting.respond, { request, name, description, price }],
  ),
});

/**
 * Responds to a failed request to get menu item details.
 */
export const GetMenuItemDetailsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/menu/:menuItem" }, { request }],
    [RestaurantMenu._getMenuItemDetails, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});


// --- Get Recommendation --- (Session optional)

/**
 * Handles incoming HTTP requests to get a dish recommendation for a restaurant.
 * Catches: Requesting.request for recommendation.
 * Where: Attempts to get user from session (if provided). Passes restaurant and optional user to _getRecommendation.
 * Then: Responds with the recommendation.
 */
export const GetRecommendationRequest: Sync = ({ request, restaurant, session, user, recommendation }) => ({
  when: actions([
    Requesting.request,
    { path: "/restaurant/:restaurant/recommendation" },
    { request, restaurant },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    let processedFrames = frames;

    if (originalFrame[session]) {
      processedFrames = await processedFrames.query(Sessioning._getUser, { session: originalFrame[session] }, { user });
      if (processedFrames.length === 0) {
        // Invalid session, proceed with generic recommendation by setting user to undefined
        processedFrames = new Frames({ ...originalFrame, [user]: undefined });
      }
    } else {
      // No session, set user to undefined for generic recommendation
      processedFrames = new Frames({ ...originalFrame, [user]: undefined });
    }

    processedFrames = await processedFrames.query(RestaurantMenu._getRecommendation, { restaurant: originalFrame[restaurant], user: processedFrames[0][user] }, { recommendation });

    if (processedFrames.length === 0) {
      return new Frames({ ...originalFrame, ["error" as symbol]: "Could not generate a recommendation for this restaurant." });
    }
    return processedFrames;
  },
  then: actions(
    [Requesting.respond, { request, recommendation }],
  ),
});

/**
 * Responds to a failed request to get a recommendation.
 */
export const GetRecommendationResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/restaurant/:restaurant/recommendation" }, { request }],
    [RestaurantMenu._getRecommendation, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
```typescript
// src/syncs/taste_preferences.sync.ts
import { actions, Sync, Frames } from "@engine";
import { Requesting, UserTastePreferences, Sessioning } from "@concepts";

// Common pattern for session-based authorization in a 'where' clause.
// Returns an object indicating if authorized and the resulting frames (either authorized with user or error with message).
const checkSessionAuthorization = async (frames: Frames, requestVar: symbol, sessionVar: symbol, userVar: symbol, missingSessionMessage: string, invalidSessionMessage: string): Promise<{ authorized: boolean, frames: Frames }> => {
  const originalFrame = frames[0];
  
  if (!originalFrame[sessionVar]) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: missingSessionMessage }) };
  }
  
  let userFrames = await frames.query(Sessioning._getUser, { session: originalFrame[sessionVar] }, { user: userVar });
  if (userFrames.length === 0) {
    return { authorized: false, frames: new Frames({ ...originalFrame, ["error" as symbol]: invalidSessionMessage }) };
  }
  return { authorized: true, frames: userFrames };
};

// --- Add Liked Dish ---

/**
 * Handles incoming HTTP requests to add a liked dish, and responds with an authorization error.
 */
export const AddLikedDish_RespondUnauthorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/liked/:dish" },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to add liked dishes.",
      "Unauthorized: Invalid session for adding liked dishes."
    );
    return authorized ? new Frames() : resultFrames; // If authorized, this sync does nothing. If unauthorized, returns the error frame.
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to add a liked dish, proceeding if authorized.
 * Triggers: UserTastePreferences.addLikedDish action.
 */
export const AddLikedDish_Authorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/liked/:dish", session },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", "" // Error messages not needed for authorized path
    );
    return authorized ? resultFrames : new Frames(); // If authorized, returns user frames. If unauthorized, this sync does nothing.
  },
  then: actions(
    [UserTastePreferences.addLikedDish, { user, dish }],
  ),
});

/**
 * Responds to a successful addition of a liked dish.
 */
export const AddLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/liked/:dish" }, { request }],
    [UserTastePreferences.addLikedDish, {}, {}], // No return value specified for success
  ),
  then: actions([Requesting.respond, { request, success: true }]), // Respond with a generic success
});

/**
 * Responds to a failed addition of a liked dish.
 */
export const AddLikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/liked/:dish" }, { request }],
    [UserTastePreferences.addLikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Remove Liked Dish ---

/**
 * Handles incoming HTTP requests to remove a liked dish, and responds with an authorization error.
 */
export const RemoveLikedDish_RespondUnauthorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/liked/:dish" },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to remove liked dishes.",
      "Unauthorized: Invalid session for removing liked dishes."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to remove a liked dish, proceeding if authorized.
 * Triggers: UserTastePreferences.removeLikedDish action.
 */
export const RemoveLikedDish_Authorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/liked/:dish", session },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", ""
    );
    return authorized ? resultFrames : new Frames();
  },
  then: actions(
    [UserTastePreferences.removeLikedDish, { user, dish }],
  ),
});

/**
 * Responds to a successful removal of a liked dish.
 */
export const RemoveLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/liked/:dish" }, { request }],
    [UserTastePreferences.removeLikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, { request, success: true }]),
});

/**
 * Responds to a failed removal of a liked dish.
 */
export const RemoveLikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/liked/:dish" }, { request }],
    [UserTastePreferences.removeLikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Add Disliked Dish ---

/**
 * Handles incoming HTTP requests to add a disliked dish, and responds with an authorization error.
 */
export const AddDislikedDish_RespondUnauthorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/disliked/:dish" },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to add disliked dishes.",
      "Unauthorized: Invalid session for adding disliked dishes."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to add a disliked dish, proceeding if authorized.
 * Triggers: UserTastePreferences.addDislikedDish action.
 */
export const AddDislikedDish_Authorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/disliked/:dish", session },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", ""
    );
    return authorized ? resultFrames : new Frames();
  },
  then: actions(
    [UserTastePreferences.addDislikedDish, { user, dish }],
  ),
});

/**
 * Responds to a successful addition of a disliked dish.
 */
export const AddDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/disliked/:dish" }, { request }],
    [UserTastePreferences.addDislikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, { request, success: true }]),
});

/**
 * Responds to a failed addition of a disliked dish.
 */
export const AddDislikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/disliked/:dish" }, { request }],
    [UserTastePreferences.addDislikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Remove Disliked Dish ---

/**
 * Handles incoming HTTP requests to remove a disliked dish, and responds with an authorization error.
 */
export const RemoveDislikedDish_RespondUnauthorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/disliked/:dish" },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to remove disliked dishes.",
      "Unauthorized: Invalid session for removing disliked dishes."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to remove a disliked dish, proceeding if authorized.
 * Triggers: UserTastePreferences.removeDislikedDish action.
 */
export const RemoveDislikedDish_Authorized: Sync = ({ request, dish, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/disliked/:dish", session },
    { request, dish },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", ""
    );
    return authorized ? resultFrames : new Frames();
  },
  then: actions(
    [UserTastePreferences.removeDislikedDish, { user, dish }],
  ),
});

/**
 * Responds to a successful removal of a disliked dish.
 */
export const RemoveDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/disliked/:dish" }, { request }],
    [UserTastePreferences.removeDislikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, { request, success: true }]),
});

/**
 * Responds to a failed removal of a disliked dish.
 */
export const RemoveDislikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/disliked/:dish" }, { request }],
    [UserTastePreferences.removeDislikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Get Liked Dishes ---

/**
 * Handles incoming HTTP requests to get liked dishes, and responds with an authorization error.
 */
export const GetLikedDishes_RespondUnauthorized: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/liked" },
    { request },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to view liked dishes.",
      "Unauthorized: Invalid session for viewing liked dishes."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to get liked dishes, proceeding if authorized.
 * Triggers: UserTastePreferences._getLikedDishes query.
 */
export const GetLikedDishes_Authorized: Sync = ({ request, session, user, likedDish: "dish", results }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/liked", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const { authorized, frames: userFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", ""
    );
    if (!authorized) return new Frames(); // Should not happen if this sync is reached, but for safety.

    frames = await userFrames.query(UserTastePreferences._getLikedDishes, { user: userFrames[0][user] }, { likedDish: "dish" });
    
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [results]: [] });
    }
    return frames.collectAs(["dish"], results);
  },
  then: actions(
    [Requesting.respond, { request, results }],
  ),
});

/**
 * Responds to a failed request to get liked dishes.
 */
export const GetLikedDishesResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/liked" }, { request }],
    [UserTastePreferences._getLikedDishes, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Get Disliked Dishes ---

/**
 * Handles incoming HTTP requests to get disliked dishes, and responds with an authorization error.
 */
export const GetDislikedDishes_RespondUnauthorized: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/disliked" },
    { request },
  ]),
  where: async (frames) => {
    const { authorized, frames: resultFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "Unauthorized: A session is required to view disliked dishes.",
      "Unauthorized: Invalid session for viewing disliked dishes."
    );
    return authorized ? new Frames() : resultFrames;
  },
  then: actions([Requesting.respond, { request, error: "error" }]),
});

/**
 * Handles incoming HTTP requests to get disliked dishes, proceeding if authorized.
 * Triggers: UserTastePreferences._getDislikedDishes query.
 */
export const GetDislikedDishes_Authorized: Sync = ({ request, session, user, dislikedDish: "dish", results }) => ({
  when: actions([
    Requesting.request,
    { path: "/user/taste/disliked", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const { authorized, frames: userFrames } = await checkSessionAuthorization(
      frames,
      request,
      session,
      user,
      "", ""
    );
    if (!authorized) return new Frames();

    frames = await userFrames.query(UserTastePreferences._getDislikedDishes, { user: userFrames[0][user] }, { dislikedDish: "dish" });
    
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [results]: [] });
    }
    return frames.collectAs(["dish"], results);
  },
  then: actions(
    [Requesting.respond, { request, results }],
  ),
});

/**
 * Responds to a failed request to get disliked dishes.
 */
export const GetDislikedDishesResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/user/taste/disliked" }, { request }],
    [UserTastePreferences._getDislikedDishes, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```