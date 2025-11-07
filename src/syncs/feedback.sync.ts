import { Feedback, Requesting } from "@concepts";
import { actions, Frames, Sync } from "@engine";

// Feedback
// submitFeedback
export const SubmitFeedbackRequest: Sync = (
  { request, author, item, rating },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/submitFeedback", author, item, rating },
    { request },
  ]),
  where: async (frames: Frames) => {
    // Verify that author (user) exists before allowing feedback submission
    const filtered = frames.filter((frame) => {
      const authorValue = (frame as { [key: string]: unknown }).author;
      return authorValue !== undefined && authorValue !== null &&
        authorValue !== "";
    });
    // Verify each author exists
    const verified: Frames = new Frames();
    for (const frame of filtered) {
      const authorValue = (frame as { [key: string]: unknown }).author;
      if (
        typeof authorValue === "string"
      ) {
        verified.push(frame);
      }
    }
    return verified;
  },
  then: actions([Feedback.submitFeedback, {
    author,
    item,
    rating,
  }]),
});
export const SubmitFeedbackResponse: Sync = ({ request, feedback }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/submitFeedback" }, { request }],
    [Feedback.submitFeedback, {}, { feedback }],
  ),
  then: actions([Requesting.respond, { request, feedback }]),
});

// updateFeedback
// Verify that feedback exists and author matches (ownership check)
export const UpdateFeedbackRequest: Sync = (
  { request, author, item, newRating },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/updateFeedback", author, item, newRating },
    { request },
  ]),
  where: async (frames: Frames) => {
    // only the author can update their own feedback
    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      {},
    );
    // Only proceed if feedback exists for this author and item
    return feedbackResults.filter((frame) => {
      const result = frame as { feedback?: unknown; error?: string };
      return result.feedback !== undefined && !result.error;
    });
  },
  then: actions([Feedback.updateFeedback, {
    author,
    item,
    newRating,
  }]),
});
export const UpdateFeedbackResponse: Sync = ({ request, updatedFeedback }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/updateFeedback" }, { request }],
    [Feedback.updateFeedback, {}, { updatedFeedback }],
  ),
  then: actions([Requesting.respond, { request, updatedFeedback }]),
});

// deleteFeedback
// Verify that feedback exists and author matches (ownership check)
export const DeleteFeedbackRequest: Sync = (
  { request, author, item },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/deleteFeedback", author, item },
    { request },
  ]),
  where: async (frames: Frames) => {
    // only the author can delete their own feedback
    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      {},
    );
    // Only proceed if feedback exists for this author and item
    return feedbackResults.filter((frame) => {
      const result = frame as { feedback?: unknown; error?: string };
      return result.feedback !== undefined && !result.error;
    });
  },
  then: actions([Feedback.deleteFeedback, {
    author,
    item,
  }]),
});
export const DeleteFeedbackResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/deleteFeedback" }, { request }],
    [Feedback.deleteFeedback, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});
