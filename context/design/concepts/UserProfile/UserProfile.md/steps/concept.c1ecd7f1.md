---
timestamp: 'Thu Oct 16 2025 22:48:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_224845.aaeed819.md]]'
content_id: c1ecd7f16afeb918431db4622ef24736daa609e878bfc215110249d993048cf4
---

# concept: UserProfile \[User]

```markdown
concept UserProfile [User, Dish]

purpose enable tracking of past dining experiences by storing user taste preferences and historical dish feedback

principle when a user rates a dish, their preference is recorded, creating a comprehensive and evolving history of their dining feedback. This stored information forms their personal taste profile, allowing them to review past choices.

state
  a set of Users with
    a set of likedDishes Dish
    a set of dislikedDishes Dish
    a set of dishHistorys

  a dishHistory with
    a user User
    a dish Dish
    a rating Number

actions
  addLikedDish (user: User, dish: Dish)
    requires: user and dish exists, dish does not exist in dislikedDish
    effects: update likedDishes of user by associating dish

  removeLikedDish (user: User, dish: Dish)
    requires: user and dish exists, dish exists in likedDishes
    effects: update likedDishes of user by associating dish

  addDislikedDish (user: User, dish: Dish)
    requires: user and dish exists, dish does not exist in likedDish
    effects: update dislikedDishes of user by associating dish

  removeDislikedDish (user: User, dish: Dish)
    requires: user and dish exists, dish exists in dislikedDishes
    effects: update likedDishes of user by associating dish

  /_getLikedDishes (user: User): (dishes: set(Dish))
    requires: user exists
    effects: returns the map of liked dishes and their dates for the specified user

  /_getDislikedDishes (user: User): (dishes: set(Dish))
    requires: user exists
    effects: returns the disliked dishes for the specified user

  /_getDishHistory (user: User): (dishHistory: DishHistory)
    requires: user exists
    effects: returns all the dishes a user has tried

```
