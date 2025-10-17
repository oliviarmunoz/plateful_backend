---
timestamp: 'Thu Oct 16 2025 20:59:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_205949.da5e9e9e.md]]'
content_id: 73c429f129fc7e3f609e32cdd21eee41c7bad506043c56e5761c846361b58e04
---

# concept: RestaurantMenu

```markdown
concept RestaurantMenu [Restaurant]

purpose organize and manage the list of dishes offered by a restaurant

principle after a restaurant owner adds various dishes with their descriptions and prices, customers can then browse these items and their details to decide what to order

state
  a set of MenuItems with
    a restaurant Restaurant
    a name String
    a description String
    a price Number

actions
  addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
    requires: menu item does not exist
    effects: returns a newly created menu item for this restaurant with name, description, and price

  addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (error: String)
    requires: menu item already exists
    effects: returns an error message indicating that the menu item already exists 
  
  updateMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (menuItem: MenuItem)
    requires: a menu item exists for this restaurant 
    effects: updates and returns the menu item with the new name, description, or price

  updateMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (error: String)
    requires: a menu item does not exist for this restaurant 
    effects: returns an error message indicating that the menu item doesn't exist

  removeMenuItem (restaurant: Restaurant, name: String, description: String, price: Number): (success: Boolean)
    requires: menu item exists
    effects: returns true if menuItem is deleted successfully, false otherwise

```
