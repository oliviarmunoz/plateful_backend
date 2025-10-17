---
timestamp: 'Thu Oct 16 2025 20:35:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_203505.121f03e8.md]]'
content_id: 8f91047e408a679fc342b1d452f4ac2729d2fa484a68645b3b5e88f4d76f2558
---

# response:

This is an excellent application pitch! It clearly articulates a user problem and proposes features that directly address it. Let's break down the concepts you'd need, considering your existing ones and the principles of Concept Design.

## Analysis of Your Pitch and Existing Concepts

**App Name:** What Should I Order?
**Motivation:** Reduce stress in choosing restaurant dishes, make dining exciting.
**Key Features:**

1. **Personalized Recommendations:** Search restaurant, get curated dish suggestion. Recommendations grow smarter with likes/dislikes.
2. **User History:** See past recommended meals and how you rated them.

**Existing Concepts:**

* `UserAuthentication` (Good, handles user identity)
* `Feedback` (Good, handles user ratings/likes/dislikes for generic `Item`s)

## "Recommend" as a Concept or Sync?

Given the complexity and statefulness described, **"recommend" absolutely needs to be an action within a dedicated concept, not a sync.**

Here's why:

* **Complexity of Logic:** A sync is `when...where...then`. The "where" clause describes conditions in the state of various concepts. For recommendations, the "where" logic would involve sophisticated algorithms, user preference models, dish attribute lookups, and historical data analysis. This goes far beyond simple state checks.
* **State Management:** The recommendation system needs to maintain its own state about user taste profiles, dish features, and potentially past recommendation performance. Syncs don't manage complex internal state like this; concepts do.
* **Completeness:** A sync *triggers* actions in concepts. The core "recommendation" behavior is a *functionality in itself* that delivers value. It's not merely a side-effect or a cascade from another action.
* **Purpose-driven:** The core purpose of your app is to *provide recommendations*. This central functionality should be encapsulated in a concept.

Therefore, you will need a `RecommendationEngine` (or similar) concept with actions like `generateRecommendation`.

## Proposed Concepts for "What Should I Order?"

Let's apply the concept design principles to identify the necessary concepts:

### 1. `UserAuthentication` (Existing)

* **Purpose:** To securely identify and authenticate users, ensuring only authorized individuals can access personalized features.
* **State:** Maps user identifiers to credentials (username, password, etc.).
* **Actions:** `register`, `login`, `logout`.
* **Principle:** If a user registers with a username and password, then logs in with those same credentials, they will be authenticated as that user.

### 2. `Feedback` (Existing, but generic parameters clarified)

* **Purpose:** To allow users to express approval or disapproval of items, contributing to collective ranking or personal preferences.
* **Concept Name & Type Parameters:** `Feedback` \[User, Item, RatingValue]
  * `User`: The user providing feedback.
  * `Item`: The item being reviewed (in your app, this will often be a `Dish` ID).
  * `RatingValue`: The type of rating (e.g., `Number` from 1-5, or a `Boolean` for like/dislike).
* **State:** Records of feedback, associating a `User` with an `Item` and a `RatingValue` (and potentially a comment, timestamp).
* **Actions:** `submitFeedback`, `updateFeedback`, `deleteFeedback`.
* **Principle:** If a user submits feedback for an item, that feedback is recorded and can later be retrieved or updated by the user.

### 3. `Restaurant` \[AdminUser, Location, CuisineType]

* **Purpose:** To provide and manage structured information about a restaurant, including its identity, location, and type of cuisine.
* **State:**
  * A set of `Restaurants` with:
    * `name`: `String`
    * `address`: `String` (or a `Location` ID if `Location` is a separate concept)
    * `cuisine`: `CuisineType` (e.g., `String` or an enum)
    * `menu`: a set of `Dish` IDs (references to `Dish` concept)
    * `admin`: `AdminUser` (who can manage this restaurant)
* **Actions:**
  * `createRestaurant(name, address, cuisine, admin: AdminUser)`
  * `updateRestaurantDetails(restaurant: Restaurant, newDetails: ...)`
  * `addDishToMenu(restaurant: Restaurant, dish: Dish)`
  * `removeDishFromMenu(restaurant: Restaurant, dish: Dish)`
* **Principle:** After a restaurant's details and menu are defined, users can discover the restaurant and view its offerings.

### 4. `Dish` \[Restaurant]

* **Purpose:** To define and describe individual food items that can be ordered at a restaurant, enabling detailed information for users and the recommendation engine.
* **State:**
  * A set of `Dishes` with:
    * `name`: `String`
    * `description`: `String`
    * `price`: `Number`
    * `allergens`: `Set<String>` (e.g., "gluten", "nuts")
    * `attributes`: `Set<String>` (e.g., "spicy", "vegetarian", "comfort food")
    * `restaurant`: `Restaurant` (ID of the restaurant this dish belongs to)
* **Actions:**
  * `createDish(restaurant: Restaurant, name, description, price, ...)`
  * `updateDishDetails(dish: Dish, newDetails: ...)`
  * `deleteDish(dish: Dish)`
* **Principle:** A dish, once defined for a restaurant, can be found on its menu and its details examined by users.

### 5. `RecommendationEngine` \[User, Restaurant, Dish]

* **Purpose:** To provide personalized dish suggestions to users based on their learned preferences, restaurant context, and available menu items, reducing decision fatigue.
* **State:**
  * `UserTasteProfiles`: A mapping from `User` to a profile of learned preferences (e.g., attribute weights, preferred cuisines, liked/disliked dishes).
  * `DishFeatureVectors`: A mapping from `Dish` to its extracted features relevant for recommendation.
  * `RecommendationHistory`: A record of which `User` was `recommended` which `Dish` at which `Restaurant` and `when`. (This directly supports your "User History" feature).
* **Actions:**
  * `generateRecommendation(user: User, restaurant: Restaurant): (dish: Dish)`
    * `requires`: `user` and `restaurant` exist, `restaurant` has dishes.
    * `effects`: Selects a `Dish` from the `restaurant`'s menu using `UserTasteProfiles` and `DishFeatureVectors`. Records the recommendation in `RecommendationHistory`. Returns the chosen `Dish`.
  * `recordUserInteraction(user: User, dish: Dish, action: String)` (e.g., "viewed", "ordered") - This is a system action to refine profiles.
* **Principle:** If a user requests a recommendation for a restaurant, the engine will suggest a dish tailored to their tastes, and that recommendation will be logged for future reference and learning.

## How Concepts Compose (Synchronizations)

Here are examples of how these concepts would interact using synchronizations:

1. **Updating User Taste Profile based on Feedback:**
   ```
   sync UpdateTasteProfileFromFeedback
   when
       Feedback.submitFeedback (user: u, item: i, rating: r)
   where
       // Assuming 'i' is confirmed to be a Dish ID via context/type system
   then
       RecommendationEngine.recordFeedbackForLearning (user: u, dish: i, rating: r)
   ```
   * *(Note: `RecommendationEngine` would need an internal action like `recordFeedbackForLearning` to update its `UserTasteProfiles` based on incoming feedback.)*

2. **Displaying User History (Combination of Queries):**
   * This isn't a sync that modifies state, but a complex query that combines data from `Feedback` and `RecommendationEngine`.
   * A user interface layer would query `Feedback._getFeedback(user: U)` and `RecommendationEngine._getRecommendationHistory(user: U)` and combine the results to show "past recommended meals and how you rated them."

3. **Ensuring Dishes are available for Recommendation:**
   * The `RecommendationEngine.generateRecommendation` action would internally query the `Restaurant` concept to get the menu and the `Dish` concept to get dish details. This is an internal query, not a sync action.

This set of concepts provides a robust, modular, and extensible foundation for your "What Should I Order?" application, adhering strongly to the principles of concept design.
