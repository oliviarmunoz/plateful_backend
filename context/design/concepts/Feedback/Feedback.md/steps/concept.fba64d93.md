---
timestamp: 'Wed Oct 15 2025 23:29:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_232939.53aa3b03.md]]'
content_id: fba64d9371938ecf87b0f36213b1db94963f1d14041b47c2e45229afc88a5215
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
    effects: creates a new Feedback, associating the author, target, and message
  
  updateFeedback (author: User, item: Item, newRating: Number): (feedback: Feedback)
    requires: feedback for this item from this user exists, newRating is between 1-5
    effects: updates the message of the specified item to newMessage
  
  deleteFeedback (author: User, item: Item)
    requires: feedback for this item from this user exists
    effects: removes the feedback from this user for this item
  
  deleteFeedback (author: User, item: Item): (error: String)
    requires: feedback for this item from this user does not exist
    effects: returns an error indicating that feedback cannot be deleted

  /_getFeedback (author: User, item: Item): (feedback: Feedback)
    requires: feedback for this item from this user exists
    effects: returns the feedback from this user for this item
  
  /_getFeedback (author: User, item: Item): (error: String)
    requires: feedback for this item from this user does not exist
    effects: returns an error message indicating that feedback for this item from this user does not exist
```
