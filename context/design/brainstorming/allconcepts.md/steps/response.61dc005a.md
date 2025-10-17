---
timestamp: 'Thu Oct 16 2025 20:31:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_203121.20a54483.md]]'
content_id: 61dc005a863f7206aa3e80f83a353a2db4a7011971631a64dd1a39d8b4da0168
---

# response:

You're asking a very insightful and crucial question for Concept Design! This is where the rubber meets the road in understanding the difference between a concept's core functionality and how concepts are composed.

**The recommendation should absolutely be its own concept (`DishRecommendation`)**, not a sync.

Here's why, breaking it down by the principles of Concept Design:

1. **User-Facing Functionality:** The act of *getting a recommendation* is a direct, user-initiated piece of functionality. The user asks, "What should I order?", and the system *responds* with a dish. This is a primary interaction, making it a strong candidate for an action within a concept.

2. **Completeness of Functionality:** The `DishRecommendation` concept is *complete* with respect to its specific functionality: generating a dish recommendation. It contains the *logic* (algorithm) for how to score and select dishes based on various inputs. A sync's purpose is not to contain complex logic or algorithms; it's to *orchestrate* actions between concepts.

3. **Maintenance of Own State:** The `DishRecommendation` concept can (and should) maintain its own state, such as `RecommendationEvents`. This history of what was recommended to whom, and when, is vital for understanding, logging, and potentially refining the recommendation system itself. A sync does not have its own state.

4. **Atomic Actions:** The `generateRecommendation` is a distinct, atomic action. When this action is called, the concept performs all necessary internal steps (queries, calculations) and returns a result.

5. **Independence (and Queries vs. Actions):** This is the key differentiator.

   * A concept is *independent* in its *behavior*. It doesn't *call actions* on other concepts as part of its core logic.
   * However, concepts *can (and often do) query* the state of other concepts to get the data they need.

   In the `DishRecommendation.generateRecommendation` action:

   * It **queries** `UserTasteProfile` for `user`'s `tasteScores` and `triedDishes`.
   * It **queries** `MenuItem` for `restaurant`'s `Dish`es and their `tags` and `averageRating`.
   * It then uses *its own internal logic* (the recommendation algorithm) to process this queried data and determine the `recommendedDish`.
   * Finally, it updates *its own state* (`RecommendationEvents`).

   It does *not* call actions like `UserTasteProfile.updateTasteProfile` or `MenuItem.updateDishDetails` as part of its *core recommendation generation*. Those updates (like updating taste profile) happen via *separate syncs* triggered by other concepts (like `Feedback`).

**When would a sync be used in relation to recommendations?**

A sync would be used to **trigger** the `DishRecommendation.generateRecommendation` action based on an event in another concept. For example:

* **When a user views a restaurant's menu for the first time:**
  ```
  sync TriggerInitialRecommendation
  when
      UserInteraction.viewRestaurantMenu (user: u, restaurant: r) // Assuming a UserInteraction concept
  then
      DishRecommendation.generateRecommendation (user: u, restaurant: r)
  ```
* **When a user asks for a new recommendation:** (This could be a direct UI call to the `generateRecommendation` action, or a sync could interpret a `Request` concept action):
  ```
  sync ProcessRecommendationRequest
  when
      Request.requestRecommendation (user: u, restaurant: r) // Assuming a Request concept
  then
      DishRecommendation.generateRecommendation (user: u, restaurant: r)
  ```

**In summary:**

* **`DishRecommendation` Concept:** Encapsulates the *logic* and *state* related to generating and tracking dish recommendations. It's the "brain" that figures out *what* to recommend.
* **Syncs:** Act as the "nervous system" connecting concepts, deciding *when* a recommendation should be generated or *how* feedback should influence the recommendation's inputs, but they don't perform the complex calculation themselves.

Your design for `DishRecommendation` as a concept, querying other concepts for data, is perfectly aligned with Concept Design principles.
