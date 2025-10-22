# Console Output for RestaurantMenuConcept Tests

```
running 7 tests from ./src/concepts/RestaurantMenu/RestaurantMenuConcept.test.ts
Query _getRecommendation: Fallback to first item when no user preferences ...
------- output -------
Setting up restaurant 019a0989-4e3e-7620-b1ff-1e50046f6605 with menu items.
Setting up user 019a0989-4e3e-7c63-8a2d-8e98c8331666 without preferences.
Querying recommendation for user with no preferences (should return first item)...
[RestaurantMenu._getRecommendation] Menu for '019a0989-4e3e-7620-b1ff-1e50046f6605': [ "Pasta Primavera", "Chicken Stir-fry" ]
Recommendation result: [ { recommendation: "Pasta Primavera" } ]
----- output end -----
Query _getRecommendation: Fallback to first item when no user preferences ... ok (861ms)
Query _getRecommendation: Successful recommendation with user preferences ...
------- output -------
Setting up restaurant 019a0989-5103-794a-b174-ee898ad39ee1 with menu items.
Setting up user 019a0989-5103-724a-b0ee-dc123105e14b with preferences.
Querying recommendation for user with preferences (LLM mocked)...
[RestaurantMenu._getRecommendation] Menu for '019a0989-5103-794a-b174-ee898ad39ee1': [ "Spicy Thai Curry", "Pad See Ew", "Tom Yum Soup" ]
[RestaurantMenu._getRecommendation] LLM raw response: {"recommendation": "Spicy Thai Curry"}...
Recommendation result: [ { recommendation: "Spicy Thai Curry" } ]
----- output end -----
Query _getRecommendation: Successful recommendation with user preferences ... ok (745ms)
Query _getRecommendation: Error for non-existent restaurant ...
------- output -------
Setting up user 019a0989-53be-782d-bfbf-764ab5258efb with preferences.
Querying recommendation for non-existent restaurant (should error)...
[RestaurantMenu._getRecommendation] Menu for '019a0989-53be-78ad-8c9a-a9b513d47914': []
Recommendation result: [
  {
    error: "No menu items found for restaurant '019a0989-53be-78ad-8c9a-a9b513d47914'."
  }
]
----- output end -----
Query _getRecommendation: Error for non-existent restaurant ... ok (532ms)
Query _getRecommendation: Error for non-existent user ...
------- output -------
Setting up restaurant 019a0989-5636-7572-bd62-aa38c35d5668 with menu items.
Querying recommendation for non-existent user (should error)...
[RestaurantMenu._getRecommendation] Menu for '019a0989-5636-7572-bd62-aa38c35d5668': [ "Burger" ]
Recommendation result: [
  {
    error: "User with ID '019a0989-5636-70e1-a74e-2af706620fec' not found in the UserTastePreferences collection."
  }
]
----- output end -----
Query _getRecommendation: Error for non-existent user ... ok (681ms)
Query _getRecommendation: Error for restaurant with no menu items ...
------- output -------
Setting up user 019a0989-58c7-7b5f-9bb2-28c24ceccd53 with preferences.
Querying recommendation for restaurant with no menu items (should error)...
[RestaurantMenu._getRecommendation] Menu for '019a0989-58c7-7747-8450-b011c1b963c2': []
Recommendation result: [
  {
    error: "No menu items found for restaurant '019a0989-58c7-7747-8450-b011c1b963c2'."
  }
]
----- output end -----
Query _getRecommendation: Error for restaurant with no menu items ... ok (597ms)
Query _getRecommendation: Error when LLM returns invalid JSON ...
------- output -------
Querying recommendation when LLM returns invalid JSON (should error)...
[RestaurantMenu._getRecommendation] Menu for '019a0989-5b32-7573-abde-85b6e3326489': [ "Valid Dish" ]
[RestaurantMenu._getRecommendation] LLM raw response: THIS IS NOT JSON...
Recommendation result: [ { error: "Failed to parse LLM response as JSON." } ]
----- output end -----
Query _getRecommendation: Error when LLM returns invalid JSON ... ok (687ms)
Query _getRecommendation: Error when LLM recommendation is not on the menu ...
------- output -------
Querying recommendation when LLM recommends non-existent dish (should error)...
[RestaurantMenu._getRecommendation] Menu for '019a0989-5e02-76e9-9b55-7c9d505d4619': [ "Existing Dish" ]
[RestaurantMenu._getRecommendation] LLM raw response: {"recommendation": "NonExistent Dish"}...
Recommendation result: [
  {
    error: "The recommended dish 'NonExistent Dish' is not on the menu."
  }
]
----- output end -----
Query _getRecommendation: Error when LLM recommendation is not on the menu ... ok (734ms)

ok | 7 passed | 0 failed (4s)
```