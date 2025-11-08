// not intended to be used directly but don't want to have public endpoints for these

import { actions, Sync } from "@engine";
import { Requesting, RestaurantMenu } from "@concepts";

// add menu item syncs
export const AddMenuItemRequest: Sync = (
  { request, restaurant, name, description, price },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/RestaurantMenu/addMenuItem",
      restaurant,
      name,
      description,
      price,
    },
    { request },
  ]),
  then: actions([
    RestaurantMenu.addMenuItem,
    { restaurant, name, description, price },
  ]),
});
export const AddMenuItemResponse: Sync = ({ request, menuItem }) => ({
  when: actions(
    [Requesting.request, { path: "/RestaurantMenu/addMenuItem" }, { request }],
    [RestaurantMenu.addMenuItem, {}, { menuItem }],
  ),
  then: actions([Requesting.respond, { request, menuItem }]),
});
export const AddMenuItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RestaurantMenu/addMenuItem" }, { request }],
    [RestaurantMenu.addMenuItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// update menu item syncs
export const UpdateMenuItemRequest: Sync = (
  { request, menuItem, newDescription, newPrice },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/RestaurantMenu/updateMenuItem",
      menuItem,
      newDescription,
      newPrice,
    },
    { request },
  ]),
  then: actions([
    RestaurantMenu.updateMenuItem,
    { menuItem, newDescription, newPrice },
  ]),
});

export const UpdateMenuItemResponse: Sync = ({ request, menuItem }) => ({
  when: actions(
    [Requesting.request, { path: "/RestaurantMenu/updateMenuItem" }, {
      request,
    }],
    [RestaurantMenu.updateMenuItem, {}, { menuItem }],
  ),
  then: actions([Requesting.respond, { request, menuItem }]),
});

export const UpdateMenuItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RestaurantMenu/updateMenuItem" }, {
      request,
    }],
    [RestaurantMenu.updateMenuItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// remove menu item syncs
export const RemoveMenuItemRequest: Sync = (
  { request, menuItem },
) => ({
  when: actions([
    Requesting.request,
    { path: "/RestaurantMenu/removeMenuItem", menuItem },
    { request },
  ]),
  then: actions([RestaurantMenu.removeMenuItem, { menuItem }]),
});

export const RemoveMenuItemResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/RestaurantMenu/removeMenuItem" }, {
      request,
    }],
    [RestaurantMenu.removeMenuItem, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

export const RemoveMenuItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/RestaurantMenu/removeMenuItem" }, {
      request,
    }],
    [RestaurantMenu.removeMenuItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
