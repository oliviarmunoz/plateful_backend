---
timestamp: 'Thu Oct 16 2025 22:52:19 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225219.75871b68.md]]'
content_id: 226bc89447407621252ab782c63cf03815c2876c77bd6565715c1419ecd0b390
---

# concept: UserTastePreferences \[User]

```markdown
concept UserTastePreferences [User, Dish]

purpose enable users to mark dishes as liked or disliked to build a profile of their binary taste preferences.

principle when a user adds a dish to their liked list, that preference is recorded, influencing future recommendations and allowing them to quickly recall their positive dining choices.

state
  // These are relations, not properties of a User object
  a relation from User to set of Dish likedDishes
  a relation from User to set of Dish dislikedDishes

actions
  addLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is not in dislikedDishes for user
    effects: add dish to likedDishes for user

  removeLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is in likedDishes for user
    effects: remove dish from likedDishes for user

  addDislikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is not in likedDishes for user
    effects: add dish to dislikedDishes for user

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
