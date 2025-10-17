---
timestamp: 'Thu Oct 16 2025 22:11:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_221121.6d093d7a.md]]'
content_id: 821ed170ca320a11f2bee44fcd70fe87758f264d027d4efe59000cd5dec6d6d5
---

# concept: UserProfile \[User, Dish]

**purpose** enable personalized dish recommendations and tracking of past dining experiences by storing user taste preferences and historical dish feedback

**principle** If a user rates a dish as liked, their profile is updated to reflect this preference, and subsequent dish recommendations will be more tailored based on this and their other past expressed preferences. This also allows the user to review their personal history of liked and disliked dishes at any time.

**state**
a set of Users with
a likedDishes map from Dish to Date // Records which dishes a user liked and when
a dislikedDishes map from Dish to Date // Records which dishes a user disliked and when
a preferredCuisines set of String // e.g., "Italian", "Mexican", "Japanese"
a avoidedIngredients set of String // e.g., "cilantro", "nuts", "shellfish"

**actions**
likeDish (user: User, dish: Dish)
**requires** user exists and dish exists
**effects**
if dish is in dislikedDishes of user, remove it
likedDishes of user := update likedDishes of user by associating dish with current date

dislikeDish (user: User, dish: Dish)
**requires** user exists and dish exists
**effects**
if dish is in likedDishes of user, remove it
dislikedDishes of user := update dislikedDishes of user by associating dish with current date

addPreferredCuisine (user: User, cuisine: String)
**requires** user exists
**effects** preferredCuisines of user := add cuisine to preferredCuisines of user

removePreferredCuisine (user: User, cuisine: String)
**requires** user exists and cuisine is in preferredCuisines of user
**effects** preferredCuisines of user := remove cuisine from preferredCuisines of user

addAvoidedIngredient (user: User, ingredient: String)
**requires** user exists
**effects** avoidedIngredients of user := add ingredient to avoidedIngredients of user

removeAvoidedIngredient (user: User, ingredient: String)
**requires** user exists and ingredient is in avoidedIngredients of user
**effects** avoidedIngredients of user := remove ingredient from avoidedIngredients of user
