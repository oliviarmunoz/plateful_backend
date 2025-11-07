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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const authorValue = frame[author];
      const itemValue = frame[item];
      const ratingValue = frame[rating];

      const hasAuthor = typeof authorValue === "string" &&
        authorValue.trim() !== "";
      const hasItem = typeof itemValue === "string" &&
        itemValue.trim() !== "";
      const hasRating = typeof ratingValue === "number" ||
        (typeof ratingValue === "string" && ratingValue.trim() !== "");

      return hasAuthor && hasItem && hasRating;
    }),
  then: actions([Feedback.submitFeedback, {
    author,
    item,
    rating,
  }]),
});
export const SubmitFeedbackValidation: Sync = (
  { request, author, item, rating },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/submitFeedback", author, item, rating },
    { request },
  ]),
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const authorValue = frame[author];
      const itemValue = frame[item];
      const ratingValue = frame[rating];

      const hasAuthor = typeof authorValue === "string" &&
        authorValue.trim() !== "";
      const hasItem = typeof itemValue === "string" &&
        itemValue.trim() !== "";
      const hasRating = typeof ratingValue === "number" ||
        (typeof ratingValue === "string" && ratingValue.trim() !== "");

      return !(hasAuthor && hasItem && hasRating);
    }),
  then: actions([Requesting.respond, {
    request,
    error: "Author, item, and rating are required to submit feedback.",
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
    const feedbackSymbol = Symbol("feedback");
    const errorSymbol = Symbol("error");

    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      { feedback: feedbackSymbol, error: errorSymbol },
    );

    return feedbackResults.filter((frame) => {
      const feedbackValue = frame[feedbackSymbol];
      const errorValue = frame[errorSymbol];

      const hasFeedback = feedbackValue !== undefined && feedbackValue !== null;
      const hasError = typeof errorValue === "string" &&
        (errorValue as string).trim() !== "";

      return hasFeedback && !hasError;
    });
  },
  then: actions([Feedback.updateFeedback, {
    author,
    item,
    newRating,
  }]),
});
export const UpdateFeedbackValidation: Sync = (
  { request, author, item, newRating },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/updateFeedback", author, item, newRating },
    { request },
  ]),
  where: async (frames: Frames) => {
    const feedbackSymbol = Symbol("feedback");
    const errorSymbol = Symbol("error");

    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      { feedback: feedbackSymbol, error: errorSymbol },
    );

    return feedbackResults.filter((frame) => {
      const feedbackValue = frame[feedbackSymbol];
      const errorValue = frame[errorSymbol];

      const hasFeedback = feedbackValue !== undefined && feedbackValue !== null;
      const hasError = typeof errorValue === "string" &&
        (errorValue as string).trim() !== "";

      return !hasFeedback || hasError;
    });
  },
  then: actions([Requesting.respond, {
    request,
    error: "Existing feedback not found for the specified author and item.",
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
    const feedbackSymbol = Symbol("feedback");
    const errorSymbol = Symbol("error");

    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      { feedback: feedbackSymbol, error: errorSymbol },
    );

    return feedbackResults.filter((frame) => {
      const feedbackValue = frame[feedbackSymbol];
      const errorValue = frame[errorSymbol];

      const hasFeedback = feedbackValue !== undefined && feedbackValue !== null;
      const hasError = typeof errorValue === "string" &&
        (errorValue as string).trim() !== "";

      return hasFeedback && !hasError;
    });
  },
  then: actions([Feedback.deleteFeedback, {
    author,
    item,
  }]),
});
export const DeleteFeedbackValidation: Sync = (
  { request, author, item },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/deleteFeedback", author, item },
    { request },
  ]),
  where: async (frames: Frames) => {
    const feedbackSymbol = Symbol("feedback");
    const errorSymbol = Symbol("error");

    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      { feedback: feedbackSymbol, error: errorSymbol },
    );

    return feedbackResults.filter((frame) => {
      const feedbackValue = frame[feedbackSymbol];
      const errorValue = frame[errorSymbol];

      const hasFeedback = feedbackValue !== undefined && feedbackValue !== null;
      const hasError = typeof errorValue === "string" &&
        (errorValue as string).trim() !== "";

      return !hasFeedback || hasError;
    });
  },
  then: actions([Requesting.respond, {
    request,
    error:
      "Feedback to delete was not found for the specified author and item.",
  }]),
});
export const DeleteFeedbackResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/Feedback/deleteFeedback" }, { request }],
    [Feedback.deleteFeedback, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});
