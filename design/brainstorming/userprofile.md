[@concept-design-overview](../background/concept-design-overview.md)

[@rubric](../background/detailed/concept-rubric.md)

[@concept-specifications](../background/concept-specifications.md)

[@implementing-concepts](../background/implementing-concepts.md)

[@Concept-Pitch](conceptpitch.md)

# do I need a userProfile concept? what would it include? I imagine it stored the user preferences, but is that just a data structure?
# response:

Yes, you absolutely need a "user profile" in some form for your "What Should I Order?" app. However, based on the principles of Concept Design, it's highly recommended to break down the traditional monolithic `UserProfile` into several distinct, independent concepts to achieve better modularity, reusability, and separation of concerns.

The rubric explicitly warns against conflating concerns in a `User` class:

> In a traditional design, in contrast, concerns are often conflated, especially around objects (or classes). For example, it is common for a *User* class to handle all kinds of functions associated with users: authentication, profiles, naming, choice of communication channels for notification, and more. In a concept design, these would be separated into different concepts: one for authentication, one for profiles, one for naming, one for notification, and so on.

Let's break down what a `UserProfile` might typically include and how it maps to Concept Design principles for your "What Should I Order?" app:

---

### Why a single `UserProfile` concept might fail the rubric:

If you tried to create a single `UserProfile` concept that contained *everything* about a user (authentication details, display name, avatar, dietary restrictions, liked cuisines, meal history, etc.), it would likely violate several criteria:

1.  **Separation of Concerns:** It would mix authentication, display information, and core recommendation logic. The state would admit factoring into many independent parts.
2.  **Completeness:** It would be too large and unwieldy to feel "complete" for a single purpose.
3.  **Independence:** A concept consuming this `UserProfile` would need to know about *all* aspects, even if it only cared about one (e.g., a notification system doesn't need to know food preferences).
4.  **Reusability:** Such a concept would be highly specific to your app, making it hard to reuse parts of it elsewhere.

---

### Recommended Concepts for "User Profile" Functionality in "What Should I Order?"

Given your application's needs, here's a breakdown into several concepts, along with what they would include:

#### 1. `UserAuthentication` Concept

This is a fundamental concept for almost any application.

*   **Concept Name:** `UserAuthentication` \[User]
*   **Purpose:** Securely identify and verify users, enabling access control and personalization.
*   **Principle:** If a user registers with a unique username and password, they can later log in with those credentials to confirm their identity.
*   **State:**
    *   A set of `User` IDs with:
        *   `username`: String (unique)
        *   `passwordHash`: String (securely stored hash)
*   **Actions:**
    *   `register(username: String, password: String): (user: User)`
    *   `login(username: String, password: String): (user: User)`
    *   `logout(user: User)`
    *   `changePassword(user: User, oldPassword: String, newPassword: String)`
*   **Why it's distinct:** It's solely focused on identifying *who* a user is, not *what* their preferences are or *what* their public profile looks like. This is highly reusable across many apps.

#### 2. `UserDisplayProfile` Concept (or simply `Profile`)

This handles user-facing display information.

*   **Concept Name:** `UserDisplayProfile` \[User]
*   **Purpose:** Provide a customizable, public (or semi-public) representation of a user.
*   **Principle:** After a user sets their display name and avatar, other users (or the system) can retrieve this information to show who they are.
*   **State:**
    *   A set of `User` IDs with:
        *   `displayName`: String (e.g., "Alice Smith")
        *   `avatarUrl`: String (URL to their profile picture)
        *   `bio`: String (optional, short description)
*   **Actions:**
    *   `updateDisplayName(user: User, newName: String)`
    *   `updateAvatar(user: User, newAvatarUrl: String)`
    *   `updateBio(user: User, newBio: String)`
*   **Why it's distinct:** It's about how a user *appears*, separate from their identity or core application logic (recommendations). A chat app might use this without caring about food preferences.

#### 3. `UserTasteProfile` Concept (This is central to "What Should I Order?")

This concept would house the specific data needed for your recommendation engine.

*   **Concept Name:** `UserTasteProfile` \[User, Cuisine, Ingredient, Dish]
*   **Purpose:** Maintain a personalized profile of a user's culinary tastes, dietary needs, and preferences to enable tailored dish recommendations.
*   **Principle:** As a user marks dishes they like or dislike, their taste profile is updated, leading to smarter, more relevant dish suggestions in the future.
*   **State:**
    *   A set of `User` IDs with:
        *   `likedCuisines`: Set of `Cuisine` IDs
        *   `dislikedCuisines`: Set of `Cuisine` IDs
        *   `likedIngredients`: Set of `Ingredient` IDs
        *   `dislikedIngredients`: Set of `Ingredient` IDs
        *   `dietaryRestrictions`: Set of Strings (e.g., "Vegetarian", "Gluten-Free", "Nut Allergy")
        *   `spiceTolerance`: Enum/Number (e.g., "Mild", "Medium", "Hot")
        *   `dishRatings`: Map from `Dish` ID to Integer (e.g., 1-5 stars)
*   **Actions:**
    *   `addLikedCuisine(user: User, cuisine: Cuisine)`
    *   `removeDislikedIngredient(user: User, ingredient: Ingredient)`
    *   `setDietaryRestriction(user: User, restriction: String)`
    *   `rateDish(user: User, dish: Dish, rating: Integer)`
    *   `clearTasteProfile(user: User)` (resets all preferences)
*   **Why it's distinct:** This is the *intelligence* of your app. It's solely focused on food preferences. It needs `User` as a type parameter but doesn't care *how* that user is authenticated or what their avatar looks like. It also needs `Cuisine`, `Ingredient`, and `Dish` type parameters, which would likely come from other concepts (e.g., a `MenuCatalog` concept).

#### 4. `UserMealHistory` Concept

This concept tracks the user's actual ordering behavior and explicit feedback.

*   **Concept Name:** `UserMealHistory` \[User, Restaurant, Dish]
*   **Purpose:** Record a user's past dining experiences and their explicit feedback on specific dishes and restaurants.
*   **Principle:** A user can review their past orders, see the recommendations they received, and how they rated the actual dishes, building a personal culinary journal.
*   **State:**
    *   A set of `User` IDs with:
        *   `pastMeals`: List of records, each containing:
            *   `restaurantId`: `Restaurant` ID
            *   `dishId`: `Dish` ID
            *   `orderDate`: DateTime
            *   `recommendedDishId`: `Dish` ID (what the app recommended, if any)
            *   `userRating`: Integer (1-5 stars, nullable initially)
            *   `notes`: String (optional, e.g., "too salty")
*   **Actions:**
    *   `recordMeal(user: User, restaurant: Restaurant, orderedDish: Dish, recommendedDish: Dish | null)`
    *   `updateMealRating(user: User, mealId: MealID, newRating: Integer)`
    *   `addMealNote(user: User, mealId: MealID, note: String)`
*   **Queries:**
    *   `_getMealHistory(user: User): (meals: {restaurant: Restaurant, dish: Dish, ...})[]`
*   **Why it's distinct:** This is about historical *actions* and *feedback* on real meals, which is different from the abstract *preferences* in `UserTasteProfile`. The ratings provided here would often *feed into* the `UserTasteProfile` via synchronizations.

---

### Is it just a data structure?

No, none of these concepts are "just a data structure" according to the rubric's warning:

> Concept is a data structure with CRUD actions when purpose calls for richer behavior (eg, concept holds contact info for a user but doesn’t include any notification behaviors).

Each of the proposed concepts has:

*   **A rich, compelling purpose:** Not just "store data," but "securely identify users," "represent a user publicly," "enable tailored recommendations," or "track dining experiences."
*   **Meaningful actions beyond basic CRUD:** `login`, `changePassword`, `rateDish`, `recordMeal` involve specific logic and state transitions that are more complex than simple create/read/update/delete of individual fields.
*   **State that supports specific behaviors:** The state is designed *specifically* to enable the actions and fulfill the purpose. For `UserTasteProfile`, `likedCuisines` directly supports recommending dishes.

By decomposing the "user profile" functionality in this way, your application will be much more modular, easier to understand, test, and evolve. You can also imagine reusing `UserAuthentication` and `UserDisplayProfile` in almost any other app you build.