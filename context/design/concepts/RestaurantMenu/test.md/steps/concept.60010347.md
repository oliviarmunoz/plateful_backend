---
timestamp: 'Tue Oct 21 2025 21:22:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_212257.49d44239.md]]'
content_id: 60010347f5c85ea439ad973a5293b68a58f45494823b1fac90c710e0a48a223c
---

# concept: RestaurantMenu

```markdown
concept RestaurantMenu [Restaurant, User]

purpose allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices to inform their choices, and receive personalized recommendations

principle when a restaurant owner adds new dishes or removes unavailable ones, customers can always view an up-to-date menu to get a dish recommendation tailored to their preferences.

state
  a set of MenuItems with
    a restaurant Restaurant
    a name String
    a description String
    a price Number

actions
  addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
    requires: menu item with the given name does not already exist for this restaurant
    effects: returns a newly created menu item with this restaurant, name, description, and price

  updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (menuItem: MenuItem)
    requires: a menu item with the given ID exists
    effects: updates the description and/or price of the existing menu item and returns the updated menu item

  removeMenuItem (menuItem: MenuItem): (success: Boolean)
    requires: menu item with the given ID exists
    effects: returns true and deletes the menu item

  /_getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
    requires: true
    effects: returns a set of all menu items associated with the given restaurant, including their name, description, and price

  /_getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
    requires: menuItem with the given ID exists
    effects: returns the name, description, and price of the specified menu item

  /_getRecommendation (restaurant: Restaurant, user: User): (recommendation: String)
    requires: a restaurant with the given ID exists and has at least one menu item; a user with the given ID exists
    effects: returns the name of a menu item from the specified restaurant that is recommended for the user via an LLM, based on their taste preferences and the current menu items. If no specific preferences are found, a generic recommendation may be provided.
```
