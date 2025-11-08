import { actions, Sync } from "@engine";
import { Requesting, Sessioning, UserTastePreferences } from "@concepts";

const successResponse = (message: string) => ({ message });
const errorResponse = (error: string) => ({ error });

// add liked dish syncs
export const AddLikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/addLikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },

  then: actions([UserTastePreferences.addLikedDish, { user, dish }]),
});

export const AddLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addLikedDish" }, {
      request,
    }],
    [UserTastePreferences.addLikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, {
    request,
    ...successResponse("Dish liked successfully."),
  }]),
});

export const AddLikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addLikedDish" }, {
      request,
    }],
    [UserTastePreferences.addLikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// remove liked dish syncs
export const RemoveLikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/removeLikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    // only allow the user to remove a liked dish for themselves if they are authenticated
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences.removeLikedDish, { user, dish }]),
});

export const RemoveLikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeLikedDish" }, {
      request,
    }],
    [UserTastePreferences.removeLikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, {
    request,
    ...successResponse("Dish unliked successfully."),
  }]),
});

export const RemoveLikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeLikedDish" }, {
      request,
    }],
    [UserTastePreferences.removeLikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// add disliked dish syncs
export const AddDislikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/addDislikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    // only allow the user to add a disliked dish for themselves if they are authenticated
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences.addDislikedDish, { user, dish }]),
});

export const AddDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addDislikedDish" }, {
      request,
    }],
    [UserTastePreferences.addDislikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, {
    request,
    ...successResponse("Dish disliked successfully."),
  }]),
});

export const AddDislikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/addDislikedDish" }, {
      request,
    }],
    [UserTastePreferences.addDislikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// remove disliked dish syncs
export const RemoveDislikedDishRequest: Sync = (
  { request, session, dish, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserTastePreferences/removeDislikedDish", session, dish },
    { request },
  ]),
  where: async (frames) => {
    // only allow the user to remove a disliked dish for themselves if they are authenticated
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([UserTastePreferences.removeDislikedDish, { user, dish }]),
});

export const RemoveDislikedDishResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeDislikedDish" }, {
      request,
    }],
    [UserTastePreferences.removeDislikedDish, {}, {}],
  ),
  then: actions([Requesting.respond, {
    request,
    ...successResponse("Dish un-disliked successfully."),
  }]),
});

export const RemoveDislikedDishResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserTastePreferences/removeDislikedDish" }, {
      request,
    }],
    [UserTastePreferences.removeDislikedDish, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
