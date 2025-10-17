---
timestamp: 'Thu Oct 16 2025 23:28:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_232800.cdc82530.md]]'
content_id: cd992f18b43e595b4e80db704756a36ed3a56892f1004d3d5c6f160af1978b02
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
    requires: user exists, dish exists
    effects: add dish to likedDishes for user. If user record does not exist, create it first with empty lists. If dish was previously in dislikedDishes, it is removed from there.

  removeLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is in likedDishes for user
    effects: remove dish from likedDishes for user

  addDislikedDish (user: User, dish: Dish)
    requires: user exists, dish exists
    effects: add dish to dislikedDishes for user. If user record does not exist, create it first with empty lists. If dish was previously in likedDishes, it is removed from there.

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

***
