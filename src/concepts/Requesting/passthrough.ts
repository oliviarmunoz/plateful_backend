/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Feedback
  "/api/Feedback/_getFeedback": "feedback is public",
  "/api/Feedback/_getAllUserRatings": "feedback is public",

  // RestaurantMenu
  "/api/RestaurantMenu/_getMenuItems": "menu is public",
  "/api/RestaurantMenu/_getMenuItemDetails": "menu is public",
  "/api/RestaurantMenu/_getRecommendation": "recommendation is public",
  "/api/RestaurantMenu/addMenuItem": "menu item is public",
  "/api/RestaurantMenu/updateMenuItem": "menu item is public",
  "/api/RestaurantMenu/removeMenuItem": "menu item is public",

  // UserAuthentication
  "/api/UserAuthentication/_getUsername": "usernames are public",

  // UserTastePreferences
  "/api/UserTastePreferences/_getLikedDishes": "liked dishes are public",
  "/api/UserTastePreferences/_getDislikedDishes": "disliked dishes are public",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // Feedback
  "/api/Feedback/submitFeedback",
  "/api/Feedback/updateFeedback",
  "/api/Feedback/deleteFeedback",

  // UserAuthentication
  "/api/UserAuthentication/register",
  "/api/UserAuthentication/authenticate",

  // UserTastePreferences
  "/api/UserTastePreferences/addLikedDish",
  "/api/UserTastePreferences/removeLikedDish",
  "/api/UserTastePreferences/addDislikedDish",
  "/api/UserTastePreferences/removeDislikedDish",
];
