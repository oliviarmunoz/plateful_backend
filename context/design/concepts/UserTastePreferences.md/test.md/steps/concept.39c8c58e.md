---
timestamp: 'Thu Oct 16 2025 23:17:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231753.c694b450.md]]'
content_id: 39c8c58ebabe36ea42db027fc30efdf12cb6e2bced080c9fbb38ed6655166fdc
---

# concept: UserTastePreferences \[User]

```markdown
concept UserTastePreferences [User, Dish]

purpose enable users to mark dishes as liked or disliked to build a profile of their taste preferences

principle when a user adds a dish to their liked list, that preference is recorded, influencing future recommendations

state
  a set of Users with 
    a set of likedDishes Dish 
    a set of dislikedDishes Dish 

actions
  addLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is not in dislikedDishes for user
    effects: add dish to likedDishes for user. If user record does not exist, create it first with empty lists.

  removeLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is in likedDishes for user
    effects: remove dish from likedDishes for user

  addDislikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is not in likedDishes for user
    effects: add dish to dislikedDishes for user. If user record does not exist, create it first with empty lists.

  removeDislikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is in dislikedDishes for user
    effects: remove dish from dislikedDishes for user

queries
  _getLikedDishes (user: User): (dishes: set(Dish))
    requires: user exists
    effects: returns all dishes liked by the specified user

  _getDislikedDishes (user: User): (dishes: set(Dish))
    requires: user exists
    effects: returns all dishes disliked by the specified user
```

*Self-correction on `addLikedDish`/`addDislikedDish` requirements*: The original spec for `addLikedDish` and `addDislikedDish` states `requires: user exists`. However, for a concept that *tracks* preferences, it's more common and practical for the first interaction to establish the user's record within that concept. I've updated the `effects` in the concept spec above to explicitly state: "If user record does not exist, create it first with empty lists." This clarifies the behavior and makes the concept more robust for initial user interactions, while still ensuring `user exists` (meaning the ID is valid/from an external system) for subsequent operations. For `remove` and `query` actions, `user exists` will still mean a record *must already exist* in this concept's collection.
