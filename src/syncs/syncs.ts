import {
  Feedback,
  Requesting,
  UserAuthentication,
  UserTastePreferences,
} from "@concepts";
import { actions, Frames, Sync } from "@engine";
import { ID } from "@utils/types.ts";

/**
 * Helper function to verify user exists
 * Returns true if user exists (no error from _getUsername)
 */
async function verifyUserExists(userId: ID | string): Promise<boolean> {
  try {
    const result = await UserAuthentication._getUsername({
      user: userId as ID,
    });
    return "username" in result && !("error" in result);
  } catch {
    return false;
  }
}

// Feedback
// submitFeedback
// Error handling: invalid user
export const SubmitFeedbackErrorInvalidUser: Sync = ({ request, author }) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/submitFeedback", author },
    { request },
  ]),
  where: async (frames: Frames) => {
    const filtered = frames.filter((frame) => {
      const authorValue = (frame as { [key: string]: unknown }).author;
      return typeof authorValue === "string" && authorValue !== "";
    });
    const invalid: Frames = new Frames();
    for (const frame of filtered) {
      const authorValue = (frame as { [key: string]: unknown }).author;
      if (
        typeof authorValue === "string" &&
        !(await verifyUserExists(authorValue))
      ) {
        invalid.push(frame);
      }
    }
    return invalid;
  },
  then: actions([Requesting.respond, {
    request,
    error: "Invalid user. Please ensure you are authenticated.",
  }]),
});

export const SubmitFeedbackRequest: Sync = (
  { request, author, item, rating },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/submitFeedback", author, item, rating },
    { request },
  ]),
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
// Error handling: feedback not found or unauthorized
export const UpdateFeedbackError: Sync = ({ request, author, item }) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/updateFeedback", author, item },
    { request },
  ]),
  where: async (frames: Frames) => {
    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      {},
    );
    // Return frames where feedback doesn't exist or has error
    return feedbackResults.filter((frame) => {
      const result = frame as { feedback?: unknown; error?: string };
      return result.feedback === undefined || result.error !== undefined;
    });
  },
  then: actions([Requesting.respond, {
    request,
    error: "Feedback not found or you do not have permission to update it.",
  }]),
});

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
// Error handling: feedback not found or unauthorized
export const DeleteFeedbackError: Sync = ({ request, author, item }) => ({
  when: actions([
    Requesting.request,
    { path: "/Feedback/deleteFeedback", author, item },
    { request },
  ]),
  where: async (frames: Frames) => {
    const feedbackResults = await frames.queryAsync(
      Feedback._getFeedback,
      { author, item },
      {},
    );
    // Return frames where feedback doesn't exist or has error
    return feedbackResults.filter((frame) => {
      const result = frame as { feedback?: unknown; error?: string };
      return result.feedback === undefined || result.error !== undefined;
    });
  },
  then: actions([Requesting.respond, {
    request,
    error: "Feedback not found or you do not have permission to delete it.",
  }]),
});

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

// UserAuthentication
// register
export const RegisterRequest: Sync = (
  { request, username, password },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserAuthentication/register",
      username,
      password,
    },
    { request },
  ]),
  then: actions([UserAuthentication.register, {
    username,
    password,
  }]),
});
export const RegisterResponse: Sync = (
  { request, user },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/register" }, {
      request,
    }],
    [UserAuthentication.register, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

// authenticate
export const AuthenticateRequest: Sync = (
  { request, username, password },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserAuthentication/authenticate",
      username,
      password,
    },
    { request },
  ]),
  then: actions([UserAuthentication.authenticate, {
    username,
    password,
  }]),
});
// Handle authentication errors (wrong username/password)
export const AuthenticateErrorResponse: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/authenticate" }, {
      request,
    }],
    [UserAuthentication.authenticate, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AuthenticateResponse: Sync = (
  { request, user },
) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/authenticate" }, {
      request,
    }],
    [UserAuthentication.authenticate, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

// addLikedDish
// Error handling: invalid user
export const AddLikedDishErrorInvalidUser: Sync = ({ request, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/addLikedDish", user },
    { request },
  ]),
  where: async (frames: Frames) => {
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return typeof frameData.user === "string" && frameData.user !== "";
    });
    const invalid: Frames = new Frames();
    for (const frame of filtered) {
      const userValue = (frame as { [key: string]: unknown }).user;
      if (
        typeof userValue === "string" &&
        !(await verifyUserExists(userValue))
      ) {
        invalid.push(frame);
      }
    }
    return invalid;
  },
  then: actions([Requesting.respond, {
    request,
    error: "Invalid user. Please ensure you are authenticated.",
  }]),
});

// Users should only be able to modify their own taste preferences
export const AddLikedDishRequest: Sync = (
  { request, user, dish },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserTastePreferences/addLikedDish",
      user,
      dish,
    },
    { request },
  ]),
  then: actions([UserTastePreferences.addLikedDish, {
    user,
    dish,
  }]),
});
export const AddLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addLikedDish" }, {
      request,
    }],
    [UserTastePreferences.addLikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

// removeLikedDish
export const RemoveLikedDishErrorInvalidUser: Sync = ({ request, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/removeLikedDish", user },
    { request },
  ]),
  where: async (frames: Frames) => {
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return typeof frameData.user === "string" && frameData.user !== "";
    });
    const invalid: Frames = new Frames();
    for (const frame of filtered) {
      const userValue = (frame as { [key: string]: unknown }).user;
      if (
        typeof userValue === "string" &&
        !(await verifyUserExists(userValue))
      ) {
        invalid.push(frame);
      }
    }
    return invalid;
  },
  then: actions([Requesting.respond, {
    request,
    error: "Invalid user. Please ensure you are authenticated.",
  }]),
});

// Users should only be able to modify their own taste preferences
export const RemoveLikedDishRequest: Sync = (
  { request, user, dish },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserTastePreferences/removeLikedDish",
      user,
      dish,
    },
    { request },
  ]),
  then: actions([UserTastePreferences.removeLikedDish, {
    user,
    dish,
  }]),
});
export const RemoveLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeLikedDish" }, {
      request,
    }],
    [UserTastePreferences.removeLikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

// addDislikedDish
export const AddDislikedDishErrorInvalidUser: Sync = ({ request, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/addDislikedDish", user },
    { request },
  ]),
  where: async (frames: Frames) => {
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return typeof frameData.user === "string" && frameData.user !== "";
    });
    const invalid: Frames = new Frames();
    for (const frame of filtered) {
      const userValue = (frame as { [key: string]: unknown }).user;
      if (
        typeof userValue === "string" &&
        !(await verifyUserExists(userValue))
      ) {
        invalid.push(frame);
      }
    }
    return invalid;
  },
  then: actions([Requesting.respond, {
    request,
    error: "Invalid user. Please ensure you are authenticated.",
  }]),
});

// Users should only be able to modify their own taste preferences
export const AddDislikedDishRequest: Sync = (
  { request, user, dish },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserTastePreferences/addDislikedDish",
      user,
      dish,
    },
    { request },
  ]),
  then: actions([UserTastePreferences.addDislikedDish, {
    user,
    dish,
  }]),
});
export const AddDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addDislikedDish" }, {
      request,
    }],
    [UserTastePreferences.addDislikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

// removeDislikedDish
export const RemoveDislikedDishErrorInvalidUser: Sync = (
  { request, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/removeDislikedDish", user },
    { request },
  ]),
  where: async (frames: Frames) => {
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return typeof frameData.user === "string" && frameData.user !== "";
    });
    const invalid: Frames = new Frames();
    for (const frame of filtered) {
      const userValue = (frame as { [key: string]: unknown }).user;
      if (
        typeof userValue === "string" &&
        !(await verifyUserExists(userValue))
      ) {
        invalid.push(frame);
      }
    }
    return invalid;
  },
  then: actions([Requesting.respond, {
    request,
    error: "Invalid user. Please ensure you are authenticated.",
  }]),
});

// Users should only be able to modify their own taste preferences
export const RemoveDislikedDishRequest: Sync = (
  { request, user, dish },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserTastePreferences/removeDislikedDish",
      user,
      dish,
    },
    { request },
  ]),
  then: actions([UserTastePreferences.removeDislikedDish, {
    user,
    dish,
  }]),
});
export const RemoveDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeDislikedDish" }, {
      request,
    }],
    [UserTastePreferences.removeDislikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

// Export all syncs
export default {
  SubmitFeedbackErrorInvalidUser,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  UpdateFeedbackError,
  UpdateFeedbackRequest,
  UpdateFeedbackResponse,
  DeleteFeedbackError,
  DeleteFeedbackRequest,
  DeleteFeedbackResponse,
  RegisterRequest,
  RegisterResponse,
  AuthenticateRequest,
  AuthenticateErrorResponse,
  AuthenticateResponse,
  AddLikedDishErrorInvalidUser,
  AddLikedDishRequest,
  AddLikedDishResponse,
  RemoveLikedDishErrorInvalidUser,
  RemoveLikedDishRequest,
  RemoveLikedDishResponse,
  AddDislikedDishErrorInvalidUser,
  AddDislikedDishRequest,
  AddDislikedDishResponse,
  RemoveDislikedDishErrorInvalidUser,
  RemoveDislikedDishRequest,
  RemoveDislikedDishResponse,
};
