---
timestamp: 'Thu Oct 16 2025 21:33:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_213337.4b3be642.md]]'
content_id: f5740ce094967f5768d27e7d8df1aea497fc87a11ab8cd50e08ae6007f6017e6
---

# concept: RestaurantMenu

```markdown
concept RestaurantMenu [Restaurant]

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

  addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (error: String)
    requires: a menu item already exists
    effects: returns an error message indicating that the menu item already exists
  
  updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (menuItem: MenuItem)
    requires: a menu item exists
    effects: updates the description and/or price of the existing menu item and returns the updated menu item

  updateMenuItem (menuItem: MenuItem, newDescription: String, newPrice: Number): (error: String)
    requires: menu item does not exist
    effects: returns an error message indicating that no menu item exists to update

  removeMenuItem (menuItem: menuItem): (success: Boolean)
    requires: menu item exists 
    effects: returns true and deletes the menu item

  removeMenuItem (menuItem: menuItem): (error: String)
    requires: menu item does not exist
    effects: returns an error message indicating that no menu item exists to delete

  /_getMenuItems (restaurant: Restaurant): (menuItem: MenuItem)
    requires: true
    effects: returns a set of all menu items associated with the given restaurant

  /_getMenuItemDetails (menuItem: MenuItem): (name: String, description: String, price: Number)
    requires: menuItem exists
    effects: returns the name, description, and price of the specified menu item
```
