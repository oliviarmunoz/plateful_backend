---
timestamp: 'Fri Nov 07 2025 13:45:02 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_134502.14091206.md]]'
content_id: dfb81d7567757b6c2485297b9f473f75971e213a98f6cd889d6a6aaed73a3291
---

# response:

```typescript
// src/syncs/feedback.sync.ts

import { actions, Sync, Frames } from "@engine";
import { Requesting, Sessioning, Feedback } from "@concepts"; // Assuming Sessioning concept exists

/**
 * Synchronizations for the Feedback Concept
 *
 * These syncs handle incoming HTTP requests via `Requesting`,
 * authenticate the user via `Sessioning`, and then trigger
 * the appropriate actions or queries on the `Feedback` concept.
 * They also handle responding to the client with success or error messages.
 */

// --- Submit Feedback ---

export const SubmitFeedbackRequest: Sync = ({ request, session, item, rating, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/feedback/submit", session, item, rating },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user using the session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback.submitFeedback, { author: user, item, rating }]),
});

export const SubmitFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/submit" }, { request }],
    [Feedback.submitFeedback, {}, { feedback }], // Capture the successful feedback ID
  ),
  then: actions([Requesting.respond, { request, feedback }]),
});

export const SubmitFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/submit" }, { request }],
    [Feedback.submitFeedback, {}, { error }], // Capture the error message
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Update Feedback ---

export const UpdateFeedbackRequest: Sync = ({ request, session, item, newRating, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/feedback/update", session, item, newRating },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user using the session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback.updateFeedback, { author: user, item, newRating }]),
});

export const UpdateFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/update" }, { request }],
    [Feedback.updateFeedback, {}, { feedback }], // Capture the successful feedback ID
  ),
  then: actions([Requesting.respond, { request, feedback }]),
});

export const UpdateFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/update" }, { request }],
    [Feedback.updateFeedback, {}, { error }], // Capture the error message
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Delete Feedback ---

export const DeleteFeedbackRequest: Sync = ({ request, session, item, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/feedback/delete", session, item },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user using the session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback.deleteFeedback, { author: user, item }]),
});

export const DeleteFeedbackResponse: Sync = ({ request, successful }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/delete" }, { request }],
    [Feedback.deleteFeedback, {}, { successful }], // Capture the success boolean
  ),
  then: actions([Requesting.respond, { request, successful }]),
});

export const DeleteFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/delete" }, { request }],
    [Feedback.deleteFeedback, {}, { error }], // Capture the error message
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Get Single Feedback ---

export const GetSingleFeedbackRequest: Sync = ({ request, session, item, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/feedback/get-single", session, item },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user using the session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback._getFeedback, { author: user, item }]),
});

export const GetSingleFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/get-single" }, { request }],
    [Feedback._getFeedback, {}, { feedback }], // Capture the successful feedback document array: [{ feedback: FeedbackDocument }]
  ),
  // The concept method returns an array, so we pass it directly.
  // The client will receive: { feedback: [{ _id: "...", author: "...", ... }] }
  then: actions([Requesting.respond, { request, feedback }]),
});

export const GetSingleFeedbackResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/get-single" }, { request }],
    [Feedback._getFeedback, {}, { error }], // Capture the error object array: [{ error: "..." }]
  ),
  // The concept method returns an array containing an error object.
  // The client will receive: { error: [{ error: "..." }] }
  then: actions([Requesting.respond, { request, error }]),
});

// --- Get All User Ratings ---

export const GetAllUserRatingsRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/feedback/get-all-user", session },
    { request },
  ]),
  where: async (frames) => {
    // Authenticate user using the session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([Feedback._getAllUserRatings, { author: user }]),
});

export const GetAllUserRatingsResponse: Sync = ({ request, feedbacks, originalFrame }) => ({
  when: actions(
    [Requesting.request, { path: "/feedback/get-all-user" }, { request: originalFrame }],
    [Feedback._getAllUserRatings, {}, { feedbacks }], // Capture the array of feedback documents
  ),
  where: async (frames) => {
    // The concept method returns an array of { feedback: FeedbackDocument } objects.
    // We collect these into a 'results' array for the response.
    // If there are no feedbacks, `feedbacks` will be an empty array, which is fine for `collectAs`
    // and correctly results in `results: []`.
    return frames.collectAs([feedbacks], { results: feedbacks });
  },
  // The client will receive: { results: [{ feedback: { ... } }, { feedback: { ... } }] }
  then: actions([Requesting.respond, { request: originalFrame, results: feedbacks }]),
});

// Note: _getAllUserRatings does not return a separate 'error' object.
// It returns an empty array if no ratings are found or on internal error,
// which is handled by the successful response above.
```
