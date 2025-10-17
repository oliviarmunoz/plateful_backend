---
timestamp: 'Thu Oct 16 2025 00:03:31 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_000331.35be51a5.md]]'
content_id: a02de690e1bcf51e38fbd8cdffb14abfbeef0f7b32a537e4231591e934ea12df
---

# concept: Feedback

```markdown
concept Feedback [User, Item]
purpose provide quantitative (1-5) feedback about a specific item
principle after a user submits feedback about an item, they can later update, delete, or view the feedback to analyze their opinions

state
  A set of Feedbacks with
    an author User
    a target Item
    a rating Number

actions
  submitFeedback (author: User, item: Item, rating: Number): (feedback: Feedback)
    requires: item doesn't already have feedback from this user, rating is between 1-5
    effects: creates a new Feedback, associating the author, target, and rating
  
  updateFeedback (author: User, item: Item, newRating: Number): (feedback: Feedback)
    requires: feedback for this item from this user exists, newRating is between 1-5
    effects: updates the rating of the specified item to newRating
  
  deleteFeedback (author: User, item: Item): (successful: Boolean)
    requires: feedback for this item from this user exists
    effects: returns True if the feedback from this user for this item is removed

  /_getFeedback (author: User, item: Item): (feedback: Feedback)
    requires: feedback for this item from this user exists
    effects: returns the feedback from this user for this item
  
  /_getFeedback (author: User, item: Item): (error: String)
    requires: feedback for this item from this user does not exist
    effects: returns an error message indicating that feedback for this item from this user does not exist
```
