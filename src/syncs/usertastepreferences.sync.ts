import { Requesting, UserTastePreferences } from "@concepts";
import { actions, Frames, Sync } from "@engine";

// addLikedDish
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
  where: async (frames: Frames) => {
    // Verify user exists and required parameters are provided
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return frameData.user !== undefined &&
        frameData.user !== null &&
        frameData.user !== "" &&
        frameData.dish !== undefined &&
        frameData.dish !== null &&
        frameData.dish !== "";
    });
    // Verify each user exists
    const verified: Frames = new Frames();
    for (const frame of filtered) {
      const frameData = frame as { [key: string]: unknown };
      const userValue = frameData.user;
      if (typeof userValue === "string") {
        verified.push(frame);
      }
    }
    return verified;
  },
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
  where: async (frames: Frames) => {
    // Verify user exists and required parameters are provided
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return frameData.user !== undefined &&
        frameData.user !== null &&
        frameData.user !== "" &&
        frameData.dish !== undefined &&
        frameData.dish !== null &&
        frameData.dish !== "";
    });
    // Verify each user exists
    const verified: Frames = new Frames();
    for (const frame of filtered) {
      const frameData = frame as { [key: string]: unknown };
      const userValue = frameData.user;
      if (typeof userValue === "string") {
        verified.push(frame);
      }
    }
    return verified;
  },
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
  where: async (frames: Frames) => {
    // Verify user exists and required parameters are provided
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return frameData.user !== undefined &&
        frameData.user !== null &&
        frameData.user !== "" &&
        frameData.dish !== undefined &&
        frameData.dish !== null &&
        frameData.dish !== "";
    });
    // Verify each user exists
    const verified: Frames = new Frames();
    for (const frame of filtered) {
      const frameData = frame as { [key: string]: unknown };
      const userValue = frameData.user;
      if (typeof userValue === "string") {
        verified.push(frame);
      }
    }
    return verified;
  },
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
  where: async (frames: Frames) => {
    // Verify user exists and required parameters are provided
    const filtered = frames.filter((frame) => {
      const frameData = frame as { [key: string]: unknown };
      return frameData.user !== undefined &&
        frameData.user !== null &&
        frameData.user !== "" &&
        frameData.dish !== undefined &&
        frameData.dish !== null &&
        frameData.dish !== "";
    });
    // Verify each user exists
    const verified: Frames = new Frames();
    for (const frame of filtered) {
      const frameData = frame as { [key: string]: unknown };
      const userValue = frameData.user;
      if (typeof userValue === "string") {
        verified.push(frame);
      }
    }
    return verified;
  },
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
