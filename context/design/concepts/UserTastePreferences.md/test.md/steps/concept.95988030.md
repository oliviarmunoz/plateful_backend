---
timestamp: 'Thu Oct 16 2025 23:17:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_231753.c694b450.md]]'
content_id: 95988030d06fae055eeffbe51f1907aa0a26aa17e71bdbfa72574ddde38ccc05
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
