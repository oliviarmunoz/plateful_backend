# API Specification: RestaurantMenu Concept

**Purpose:** allow users to reliably view an up-to-date and comprehensive list of a restaurant's dishes, descriptions, and prices to inform their choices

---

## API Endpoints

### POST /api/RestaurantMenu/addMenuItem

**Description:** Adds a new menu item to a restaurant.

**Requirements:**
- menu item does not exist

**Effects:**
- returns a newly created menu item with this restaurant, name, description, and price

**Request Body:**
```json
{
  "restaurant": "Restaurant",
  "name": "String",
  "description": "String",
  "price": "Number"
}
```

**Success Response Body (Action):**
```json
{
  "menuItem": "MenuItem"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/RestaurantMenu/updateMenuItem

**Description:** Updates the description and/or price of an existing menu item.

**Requirements:**
- a menu item exists

**Effects:**
- updates the description and/or price of the existing menu item and returns the updated menu item

**Request Body:**
```json
{
  "menuItem": "MenuItem",
  "newDescription": "String",
  "newPrice": "Number"
}
```

**Success Response Body (Action):**
```json
{
  "menuItem": "MenuItem"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/RestaurantMenu/removeMenuItem

**Description:** Removes an existing menu item.

**Requirements:**
- menu item exists

**Effects:**
- returns true and deletes the menu item

**Request Body:**
```json
{
  "menuItem": "MenuItem"
}
```

**Success Response Body (Action):**
```json
{
  "success": "Boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/RestaurantMenu/_getMenuItems

**Description:** Retrieves a set of all menu items associated with the given restaurant.

**Requirements:**
- true

**Effects:**
- returns a set of all menu items associated with the given restaurant

**Request Body:**
```json
{
  "restaurant": "Restaurant"
}
```

**Success Response Body (Query):**
```json
[
  {
    "menuItem": "MenuItem"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/RestaurantMenu/_getMenuItemDetails

**Description:** Retrieves the name, description, and price of a specified menu item.

**Requirements:**
- menuItem exists

**Effects:**
- returns the name, description, and price of the specified menu item

**Request Body:**
```json
{
  "menuItem": "MenuItem"
}
```

**Success Response Body (Query):**
```json
[
  {
    "name": "String",
    "description": "String",
    "price": "Number"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---
