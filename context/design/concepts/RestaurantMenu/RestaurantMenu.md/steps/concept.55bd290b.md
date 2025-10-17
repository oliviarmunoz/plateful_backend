---
timestamp: 'Thu Oct 16 2025 21:05:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_210552.60978ed9.md]]'
content_id: 55bd290b395242b054fe6bb6140701a7351e8c6804e5a73dc8aa4c2f4bdd4b59
---

# concept: RestaurantMenu

```markdown
concept RestaurantMenu [Restaurant]

purpose organize and manage the list of dishes offered by a restaurant to present/ discover a restaurant's offerings

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
