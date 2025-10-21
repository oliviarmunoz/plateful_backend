---
timestamp: 'Sun Oct 19 2025 16:07:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_160716.2b68bd44.md]]'
content_id: d8e7e4c2f7c72bb600b8c05cb07a5a5a44e0a84510338f2bdc655abf72391379
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
    requires: 
    effects: add dish to likedDishes for user. If user record does not exist, create it first with empty lists. If dish was previously in dislikedDishes, it is removed from there.

  removeLikedDish (user: User, dish: Dish)
    requires: user exists, dish exists, dish is in likedDishes for user
    effects: remove dish from likedDishes for user

  addDislikedDish (user: User, dish: Dish)
    requires: 
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
