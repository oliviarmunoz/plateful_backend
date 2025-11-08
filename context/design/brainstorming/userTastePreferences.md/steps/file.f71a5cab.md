---
timestamp: 'Fri Nov 07 2025 14:07:12 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_140712.d25493bd.md]]'
content_id: f71a5cabd06ae679201c74b6561069a3d34b62a54430bd476e30ced61132e9e0
---

# file: src/syncs/feedback.sync.ts

```typescript
import { actions, Sync } from "@engine";
import { Feedback, Requesting, Sessioning } from "@concepts";

// Feedback syncs with user authentication checks

// submit feedback syncs
export const SubmitFeedbackRequest: Sync = (
  { request, session, item, rating, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/submitFeedback", session, item, rating },
    { request },
  ]),
  where: async (frames) => {
    // only allow the user to submit feedback for themselves if they are authenticated
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback.submitFeedback, { author: user, item, rating }]),
});
export const SubmitFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/submitFeedback" }, { request }],
    [Feedback.submitFeedback, {}, { feedback }],
  ),
  then: actions([Requesting.respond, { request, feedback }]),
});
export const SubmitFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/submitFeedback" }, { request }],
    [Feedback.submitFeedback, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// update feedback syncs
export const UpdateFeedbackRequest: Sync = (
  { request, session, item, newRating, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/updateFeedback", session, item, newRating },
    { request },
  ]),
  where: async (frames) => {
    // only allow the user to update feedback for themselves if they are authenticated
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback.updateFeedback, { author: user, item, newRating }]),
});
export const UpdateFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/updateFeedback" }, { request }],
    [Feedback.updateFeedback, {}, { feedback }],
  ),
  then: actions([Requesting.respond, { request, feedback }]),
});

export const UpdateFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/updateFeedback" }, { request }],
    [Feedback.updateFeedback, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// delete feedback
export const DeleteFeedbackRequest: Sync = (
  { request, session, item, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/deleteFeedback", session, item },
    { request },
  ]),
  where: async (frames) => {
    // only allow the user to delete feedback for themselves if they are authenticated
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback.deleteFeedback, { author: user, item }]),
});

export const DeleteFeedbackResponse: Sync = ({ request, successful }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/deleteFeedback" }, { request }],
    [Feedback.deleteFeedback, {}, { successful }],
  ),
  then: actions([Requesting.respond, { request, successful }]),
});

export const DeleteFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/deleteFeedback" }, { request }],
    [Feedback.deleteFeedback, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

```
