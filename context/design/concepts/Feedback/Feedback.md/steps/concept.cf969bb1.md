---
timestamp: 'Wed Oct 15 2025 22:52:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_225207.0b229cbf.md]]'
content_id: cf969bb1cd462db2d9965740c6cbcaeec9671805639b1c9d6e26a41af02a31a1
---

# concept: Feedback

```markdown
concept Feedback [User, Item]
purpose provide qualitative comments/suggestions/reports about a specific item
principle after an author has provided feedback about an item, they can view past comments

state
  A set of Feedbacks with
    an author User
    a target Item
    a message String

actions
  submitFeedback (author: User, item: Item, message: String): 
    requires: item doesn't already have feedback from this user, message is not empty
    effects: creates a new Feedback, associating the author, target, and message
  
  updateFeedback (author: User, item: Item, newMessage: String)
    requires: feedback for this item from this user exists, newMessage is not empty
    effects: updates the message of the specified item to newMessage
  
  deleteFeedback (author: User, item: Item)`
    requires: feedback for this item from this user exists
    effects: removes the feedback for this specified item.
```
