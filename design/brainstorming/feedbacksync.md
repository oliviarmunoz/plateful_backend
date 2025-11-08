[@architecture](../background/architecture.md)

[@feedback](../../src/concepts/Feedback/FeedbackConcept.ts)
[@all-concepts](concept_def.md)

[@implementing-syncs](../background/implementing-syncs.md)

# generate syncs for anything with feedback


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

```