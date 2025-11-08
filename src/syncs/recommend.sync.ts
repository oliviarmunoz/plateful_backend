import { actions, Sync } from "@engine";
import {
  Requesting,
  RestaurantMenu,
  Sessioning,
  UserTastePreferences,
} from "@concepts";

// get recommendation sync
export const GetRecommendationRequest: Sync = ({
  request,
  session,
  restaurant,
  user,
  userLikedDishes,
  userDislikedDishes,
  recommendation,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/recommendation",
      session,
      restaurant,
    },
    { request },
  ]),
  where: async (frames) => {
    // only allow recommendation if the user is authenticated
    const authenticatedFrames = await frames.query(
      Sessioning._getUser,
      { session },
      { user },
    );

    console.log("[GetRecommendationRequest] frame counts", {
      initial: frames.length,
      authenticated: authenticatedFrames.length,
    });

    const likedDishBinding = Symbol("likedDish");
    const dislikedDishBinding = Symbol("dislikedDish");

    // get the user's liked dishes
    const likedDishFrames = await authenticatedFrames.query(
      UserTastePreferences._getLikedDishes,
      { user },
      { dishes: likedDishBinding },
    );

    // get the user's disliked dishes
    const dislikedDishFrames = await authenticatedFrames.query(
      UserTastePreferences._getDislikedDishes,
      { user },
      { dishes: dislikedDishBinding },
    );

    console.log("[GetRecommendationRequest] preference frames", {
      liked: likedDishFrames.length,
      disliked: dislikedDishFrames.length,
    });

    const likedByUser = new Map<unknown, unknown[]>();
    for (const frame of likedDishFrames) {
      const userValue = frame[user];
      const likedDish = frame[likedDishBinding];
      if (userValue === undefined || likedDish === undefined) continue;
      const list = likedByUser.get(userValue) ?? [];
      list.push(likedDish);
      likedByUser.set(userValue, list);
    }

    const dislikedByUser = new Map<unknown, unknown[]>();
    for (const frame of dislikedDishFrames) {
      const userValue = frame[user];
      const dislikedDish = frame[dislikedDishBinding];
      if (userValue === undefined || dislikedDish === undefined) continue;
      const list = dislikedByUser.get(userValue) ?? [];
      list.push(dislikedDish);
      dislikedByUser.set(userValue, list);
    }

    return authenticatedFrames.map((frame) => {
      const userValue = frame[user];
      const enrichedFrame = { ...frame } as Record<symbol, unknown>;
      enrichedFrame[userLikedDishes] = likedByUser.get(userValue) ?? [];
      enrichedFrame[userDislikedDishes] = dislikedByUser.get(userValue) ?? [];
      return enrichedFrame as
        & typeof frame
        & { [userLikedDishes]: unknown[]; [userDislikedDishes]: unknown[] };
    }).filter((frame) => frame[user] !== undefined);
  },
  then: actions(
    [RestaurantMenu.getRecommendation, {
      restaurant,
      userLikedDishes,
      userDislikedDishes,
      request,
    }, { recommendation }],
  ),
});

export const GetRecommendationRequestWithoutSession: Sync = ({
  request,
  restaurant,
  user,
  userLikedDishes,
  userDislikedDishes,
  recommendation,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/recommendation",
      restaurant,
      user,
    },
    { request },
  ]),
  where: async (frames) => {
    const likedDishBinding = Symbol("likedDish");
    const dislikedDishBinding = Symbol("dislikedDish");

    const likedDishFrames = await frames.query(
      UserTastePreferences._getLikedDishes,
      { user },
      { dishes: likedDishBinding },
    );

    const dislikedDishFrames = await frames.query(
      UserTastePreferences._getDislikedDishes,
      { user },
      { dishes: dislikedDishBinding },
    );

    const likedDishes = likedDishFrames.reduce<string[]>(
      (acc, frame) => {
        const dish = frame[likedDishBinding];
        if (typeof dish === "string") acc.push(dish);
        return acc;
      },
      [],
    );

    const dislikedDishes = dislikedDishFrames.reduce<string[]>(
      (acc, frame) => {
        const dish = frame[dislikedDishBinding];
        if (typeof dish === "string") acc.push(dish);
        return acc;
      },
      [],
    );

    return frames.map((frame) => {
      const enrichedFrame = { ...frame } as Record<symbol, unknown>;
      enrichedFrame[userLikedDishes] = likedDishes;
      enrichedFrame[userDislikedDishes] = dislikedDishes;
      return enrichedFrame as
        & typeof frame
        & { [userLikedDishes]: string[]; [userDislikedDishes]: string[] };
    });
  },
  then: actions(
    [RestaurantMenu.getRecommendation, {
      restaurant,
      userLikedDishes,
      userDislikedDishes,
      request,
    }, { recommendation }],
  ),
});

export const GetRecommendationResponse: Sync = (
  { request, recommendation },
) => ({
  when: actions(
    [Requesting.request, { path: "/recommendation" }, { request }],
    [RestaurantMenu.getRecommendation, { request }, { recommendation }],
  ),
  then: actions([Requesting.respond, { request, recommendation }]),
});

export const GetRecommendationResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/recommendation" }, { request }],
    [RestaurantMenu.getRecommendation, { request }, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
