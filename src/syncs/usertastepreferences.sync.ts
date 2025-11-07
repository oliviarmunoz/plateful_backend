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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return hasUser && hasDish;
    }),
  then: actions([UserTastePreferences.addLikedDish, {
    user,
    dish,
  }]),
});
export const AddLikedDishValidation: Sync = (
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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return !(hasUser && hasDish);
    }),
  then: actions([Requesting.respond, {
    request,
    error: "User and dish are required to add a liked dish.",
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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return hasUser && hasDish;
    }),
  then: actions([UserTastePreferences.removeLikedDish, {
    user,
    dish,
  }]),
});
export const RemoveLikedDishValidation: Sync = (
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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return !(hasUser && hasDish);
    }),
  then: actions([Requesting.respond, {
    request,
    error: "User and dish are required to remove a liked dish.",
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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return hasUser && hasDish;
    }),
  then: actions([UserTastePreferences.addDislikedDish, {
    user,
    dish,
  }]),
});
export const AddDislikedDishValidation: Sync = (
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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return !(hasUser && hasDish);
    }),
  then: actions([Requesting.respond, {
    request,
    error: "User and dish are required to add a disliked dish.",
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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return hasUser && hasDish;
    }),
  then: actions([UserTastePreferences.removeDislikedDish, {
    user,
    dish,
  }]),
});
export const RemoveDislikedDishValidation: Sync = (
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
  where: (frames: Frames) =>
    frames.filter((frame) => {
      const userValue = frame[user];
      const dishValue = frame[dish];

      const hasUser = typeof userValue === "string" && userValue.trim() !== "";
      const hasDish = typeof dishValue === "string" && dishValue.trim() !== "";

      return !(hasUser && hasDish);
    }),
  then: actions([Requesting.respond, {
    request,
    error: "User and dish are required to remove a disliked dish.",
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
