
# API Specification: UserTastePreferences Concept

**Purpose:** enable users to mark dishes as liked or disliked to build a profile of their taste preferences

---

## API Endpoints

### POST /api/UserTastePreferences/addLikedDish

**Description:** Records a user's preference for a specific dish, adding it to their liked list.

**Requirements:**

**Effects:**
- Add dish to likedDishes for user.
- If user record does not exist, create it first with empty lists.
- If dish was previously in dislikedDishes, it is removed from there.

**Request Body:**
```json
{
  "user": "String",
  "dish": "String"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserTastePreferences/removeLikedDish

**Description:** Removes a dish from a user's liked list.

**Requirements:**
- user exists
- dish exists
- dish is in likedDishes for user

**Effects:**
- Remove dish from likedDishes for user.

**Request Body:**
```json
{
  "user": "String",
  "dish": "String"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserTastePreferences/addDislikedDish

**Description:** Records a user's preference against a specific dish, adding it to their disliked list.

**Requirements:**
- (Implicit: no specific preconditions beyond the effects)

**Effects:**
- Add dish to dislikedDishes for user.
- If user record does not exist, create it first with empty lists.
- If dish was previously in likedDishes, it is removed from there.

**Request Body:**
```json
{
  "user": "String",
  "dish": "String"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserTastePreferences/removeDislikedDish

**Description:** Removes a dish from a user's disliked list.

**Requirements:**
- user exists
- dish exists
- dish is in dislikedDishes for user

**Effects:**
- Remove dish from dislikedDishes for user.

**Request Body:**
```json
{
  "user": "String",
  "dish": "String"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserTastePreferences/_getLikedDishes

**Description:** Retrieves all dishes that the specified user has marked as liked.

**Requirements:**
- user exists

**Effects:**
- Returns all dishes liked by the specified user.

**Request Body:**
```json
{
  "user": "String"
}
```

**Success Response Body (Query):**
```json
[
  {
    "dishes": ["String", "String"]
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

### POST /api/UserTastePreferences/_getDislikedDishes

**Description:** Retrieves all dishes that the specified user has marked as disliked.

**Requirements:**
- user exists

**Effects:**
- Returns all dishes disliked by the specified user.

**Request Body:**
```json
{
  "user": "String"
}
```

**Success Response Body (Query):**
```json
[
  {
    "dishes": ["String", "String"]
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