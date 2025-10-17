---
timestamp: 'Thu Oct 16 2025 20:45:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_204559.27cd9013.md]]'
content_id: 62dceb33ab1ee5966cb44a8d765047f3ed23b2d96aa417ad2a3fa2f1ebf79be9
---

# response:

Here's the definition of the `RestaurantMenu` concept following the Concept Design framework:

***

**concept** RestaurantMenu \[Restaurant]

**purpose** define and manage the list of dishes offered by a restaurant, including their descriptions, prices, and availability, for presentation to customers.

**principle** after a restaurant owner adds various dishes with their descriptions, prices, and categories to their menu, customers can then browse these items and their details to decide what to order.

**state**
  a set of MenuItems with
    a name String
    a description String
    a price Number // (e.g., in cents to avoid floating point issues)
    a restaurant Restaurant // References the external Restaurant identifier
    a category Category // References an internal Category entity
    isAvailable Boolean = true
  a set of Categories with
    a name String

**actions**

  createCategory (name: String): (category: Category)
    **requires**
      not exists (c in Categories where c.name is name)
    **effects**
      create category: Category
      category.name := name

  deleteCategory (category: Category)
    **requires**
      exists (category: Category)
      not exists (m in MenuItems where m.category is category) // Cannot delete if items still use it
    **effects**
      delete category

  addMenuItem (restaurant: Restaurant, name: String, description: String, price: Number, categoryName: String): (menuItem: MenuItem)
    **requires**
      not exists (m in MenuItems where m.restaurant is restaurant and m.name is name) // Menu item name must be unique per restaurant
    **effects**
      // Ensure category exists, create if not
      let c = (the Category where Category.name is categoryName) or (create Category where Category.name := categoryName)
      create menuItem: MenuItem
      menuItem.restaurant := restaurant
      menuItem.name := name
      menuItem.description := description
      menuItem.price := price
      menuItem.category := c
      menuItem.isAvailable := true

  updateMenuItem (menuItem: MenuItem, newName: String?, newDescription: String?, newPrice: Number?, newCategoryName: String?, newIsAvailable: Boolean?)
    **requires**
      exists (menuItem: MenuItem)
      if newName is not null then
        not exists (m in MenuItems where m is not menuItem and m.restaurant is menuItem.restaurant and m.name is newName)
    **effects**
      if newName is not null then menuItem.name := newName
      if newDescription is not null then menuItem.description := newDescription
      if newPrice is not null then menuItem.price := newPrice
      if newCategoryName is not null then
        let c = (the Category where Category.name is newCategoryName) or (create Category where Category.name := newCategoryName)
        menuItem.category := c
      if newIsAvailable is not null then menuItem.isAvailable := newIsAvailable

  removeMenuItem (menuItem: MenuItem)
    **requires**
      exists (menuItem: MenuItem)
    **effects**
      delete menuItem

***
