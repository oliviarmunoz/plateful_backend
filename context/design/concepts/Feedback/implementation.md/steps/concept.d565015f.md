---
timestamp: 'Wed Oct 15 2025 23:43:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_234325.fae5e0f3.md]]'
content_id: d565015fe2190e06590ddfc83bfce3c0e0c5b80e82f92515786fabc7efbd4881
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
    effects: updates the message of the specified item to newRating
  
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
