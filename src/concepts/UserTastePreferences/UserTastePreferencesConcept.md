# Console Output for UserTastePreferencesConcept Tests

``` 

running 7 tests from ./src/concepts/UserTastePreferencesConcept/UserTastePreferencesConcept.test.ts
Principle: User preferences are recorded and updated, influencing recommendations (via internal state) ...
------- output -------
--- Principle Test: User preferences are recorded and updated ---
Action: user:Alice adds dish:Pasta to liked dishes.
Query: Get liked dishes for user:Alice.
Action: user:Alice adds dish:Salad to liked dishes.
Query: Get liked dishes for user:Alice.
Action: user:Alice adds dish:Pasta to disliked dishes (should move from liked).
Query: Get liked dishes for user:Alice.
Query: Get disliked dishes for user:Alice.
Principle demonstrated: User preferences are recorded and can be moved between liked/disliked lists, forming a profile that would influence recommendations.
----- output end -----
Principle: User preferences are recorded and updated, influencing recommendations (via internal state) ... ok (822ms)
Action: addLikedDish - new user, existing user, existing disliked dish ...
------- output -------
--- addLikedDish Test ---
Action: user:Alice adds dish:Pasta as liked (new user).
Action: user:Alice adds dish:Salad as liked (existing user).
Action: user:Bob adds dish:Sushi as disliked.
Action: user:Bob adds dish:Sushi as liked (was disliked).
Action: user:Alice adds dish:Pasta as liked again (already liked).
----- output end -----
Action: addLikedDish - new user, existing user, existing disliked dish ... ok (706ms)
Action: removeLikedDish - existing, non-existent dish, non-existent user ...
------- output -------
--- removeLikedDish Test ---
Action: user:Alice removes dish:Pasta from liked.
Action: user:Alice removes dish:Sushi from liked (not liked).
Action: user:NonExistent removes dish:Pasta from liked (non-existent user).
----- output end -----
Action: removeLikedDish - existing, non-existent dish, non-existent user ... ok (647ms)
Action: addDislikedDish - new user, existing user, existing liked dish ...
------- output -------
--- addDislikedDish Test ---
Action: user:Alice adds dish:Pasta as disliked (new user).
Action: user:Alice adds dish:Salad as disliked (existing user).
Action: user:Bob adds dish:Sushi as liked.
Action: user:Bob adds dish:Sushi as disliked (was liked).
Action: user:Alice adds dish:Pasta as disliked again (already disliked).
----- output end -----
Action: addDislikedDish - new user, existing user, existing liked dish ... ok (785ms)
Action: removeDislikedDish - existing, non-existent dish, non-existent user ...
------- output -------
--- removeDislikedDish Test ---
Action: user:Alice removes dish:Pasta from disliked.
Action: user:Alice removes dish:Sushi from disliked (not disliked).
Action: user:NonExistent removes dish:Pasta from disliked (non-existent user).
----- output end -----
Action: removeDislikedDish - existing, non-existent dish, non-existent user ... ok (678ms)
Query: _getLikedDishes - existing user with dishes, existing user no dishes, non-existent user ...
------- output -------
--- _getLikedDishes Test ---
Query: Get liked dishes for user:Alice.
Action: user:Alice dislikes dish:Salad.
Action: user:Alice removes dish:Pasta from liked.
Query: Get liked dishes for user:Alice (now empty).
Query: Get liked dishes for user:Ghost (non-existent).
----- output end -----
Query: _getLikedDishes - existing user with dishes, existing user no dishes, non-existent user ... ok (669ms)
Query: _getDislikedDishes - existing user with dishes, existing user no dishes, non-existent user ...
------- output -------
--- _getDislikedDishes Test ---
Query: Get disliked dishes for user:Alice.
Action: user:Alice likes dish:Salad.
Action: user:Alice removes dish:Pasta from disliked.
Query: Get disliked dishes for user:Alice (now empty).
Query: Get disliked dishes for user:Phantom (non-existent).
----- output end -----
Query: _getDislikedDishes - existing user with dishes, existing user no dishes, non-existent user ... ok (650ms)

ok | 7 passed | 0 failed (4s)
```