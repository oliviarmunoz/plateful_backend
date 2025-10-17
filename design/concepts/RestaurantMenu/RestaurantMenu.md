[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@application-pitch](../../brainstorming/conceptpitch.md)

# concept: RestaurantMenu

```markdown
concept RestaurantMenu [Restaurant, Context]

purpose allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices to inform their choices

principle when a restaurant owner adds new seasonal dishes or removes unavailable items, customers can always view an up-to-date and accurate menu to inform their ordering choices

state
  a set of MenuItems with
    a restaurant Restaurant
    a name String
    a description String
    a price Number

actions
  addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
    requires: menu item does not exist
    effects: returns a newly created menu item with this restaurant, name, description, and price

  updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (menuItem: MenuItem)
    requires: a menu item exists
    effects: updates the description and/or price of the existing menu item and returns the updated menu item

  removeMenuItem (menuItem: menuItem): (success: Boolean)
    requires: menu item exists 
    effects: returns true and deletes the menu item

  /_getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
    requires: true
    effects: returns a set of all menu items associated with the given restaurant

  /_getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
    requires: menuItem exists
    effects: returns the name, description, and price of the specified menu item
```