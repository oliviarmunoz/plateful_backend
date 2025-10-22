# Console Output for FeedbackConcept Tests

```
running 11 tests from ./src/concepts/Feedback/FeedbackConcept.test.ts
principle test: submit, view, update, delete ...
------- output -------
Action 1: Submitting initial feedback of rating 3...
Action 2: Viewing submitted feedback...
Action 3: Updating feedback to rating 5...
Action 4: Viewing updated feedback...
Retrieved updated feedback: [
  {
    feedback: {
      _id: "0199ef82-99a0-74f3-96c9-7ce0f9174b59",
      author: "user:PrincipleTester",
      target: "item:PrincipleProduct",
      rating: 5
    }
  }
]
Action 5: Deleting feedback...
Delete result: { successful: true }
Action 6: Verifying feedback is deleted...
Submitted, viewed, updated, and deleted Feedback successfully.
----- output end -----
principle test: submit, view, update, delete ... ok (3s)
Action submitFeedback: should successfully submit feedback ...
------- output -------
Submitting Feedback:  { feedback: "0199ef82-bbf0-7e23-818e-122755154c69" }
Retrieved feedback: [
  {
    feedback: {
      _id: "0199ef82-bbf0-7e23-818e-122755154c69",
      author: "user:Alice",
      target: "item:ProductX",
      rating: 4
    }
  }
]
Feedback successfully received.
----- output end -----
Action submitFeedback: should successfully submit feedback ... ok (8s)
Action submitFeedback: invalid rating ...
------- output -------
Action submitFeedback: Validating rating 0 (should succeed)...
Successfully submitted feedback with rating 0.
Action submitFeedback: Invalid rating -1 (should fail)...
Successfully returned error message for rating -1.
Action submitFeedback: Invalid rating 6 (should fail)...
Successfully returned error message for rating 6.
----- output end -----
Action submitFeedback: invalid rating ... ok (4s)
Action submitFeedback: duplicate feedback ...
------- output -------
Submitting first feedback...
Feedback successfully received.
Submitting second feedback (duplicate)...
Successfully returned error message.
----- output end -----
Action submitFeedback: duplicate feedback ... ok (9s)
Action updateFeedback: update existing feedback ...
------- output -------
Submitting Feedback...
Feedback submitted successfully.
Updating Feedback...
Feedback updated successfully.
----- output end -----
Action updateFeedback: update existing feedback ... ok (622ms)
Action updateFeedback: update feedback with invalid rating ...
------- output -------
Submitting Feedback for update invalid rating test...
Attempting to update with invalid rating -1...
Attempting to update with invalid rating 6...
Successfully returned errors for invalid updates, original rating untouched.
----- output end -----
Action updateFeedback: update feedback with invalid rating ... ok (576ms)
Action: updateFeedback: non-existent feedback update ...
------- output -------
Updating Feedback...
Successfully returned error.
----- output end -----
Action: updateFeedback: non-existent feedback update ... ok (552ms)
Action: deleteFeedback: delete existing feedback ...
------- output -------
Submitting Feedback...
Successfully deleted Feedback.
----- output end -----
Action: deleteFeedback: delete existing feedback ... ok (1s)
Action: deleteFeedback: non-existent feedback deletion ...
------- output -------
Deleting Feedback...
Successfully returned error.
----- output end -----
Action: deleteFeedback: non-existent feedback deletion ... ok (1s)
Query _getFeedback: non-existent feedback ...
------- output -------
Retrieved non-existent feedback: [
  {
    error: "No feedback found for item item:NonExistent from user user:Alice."
  }
]
----- output end -----
Query _getFeedback: non-existent feedback ... ok (1s)
Query _getFeedback: retrieve existing feedback ...
------- output -------
Submitting Feedback...
Successfully received feedback.
----- output end -----
Query _getFeedback: retrieve existing feedback ... ok (610ms)

ok | 11 passed | 0 failed (31s)
```