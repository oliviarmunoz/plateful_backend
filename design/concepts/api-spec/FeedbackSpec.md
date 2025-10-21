
# API Specification: Feedback Concept

**Purpose:** provide quantitative (0-5) feedback about a specific item

---

## API Endpoints

### POST /api/Feedback/submitFeedback

**Description:** Creates a new feedback entry, associating an author, item, and a quantitative rating.

**Requirements:**
- item doesn't already have feedback from this user
- rating is between 0-5

**Effects:**
- creates a new Feedback, associating the author, target, and rating

**Request Body:**
```json
{
  "author": "User",
  "item": "Item",
  "rating": "Number"
}
```

**Success Response Body (Action):**
```json
{
  "feedback": "Feedback"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Feedback/updateFeedback

**Description:** Updates the rating of an existing feedback entry for a specific item by a given user.

**Requirements:**
- feedback for this item from this user exists
- newRating is between 0-5

**Effects:**
- updates the rating of the specified item to newRating

**Request Body:**
```json
{
  "author": "User",
  "item": "Item",
  "newRating": "Number"
}
```

**Success Response Body (Action):**
```json
{
  "feedback": "Feedback"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Feedback/deleteFeedback

**Description:** Removes an existing feedback entry for a specific item from a given user.

**Requirements:**
- feedback for this item from this user exists

**Effects:**
- returns True if the feedback from this user for this item is removed

**Request Body:**
```json
{
  "author": "User",
  "item": "Item"
}
```

**Success Response Body (Action):**
```json
{
  "successful": "Boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Feedback/_getFeedback

**Description:** Retrieves a specific feedback entry given an author and an item.

**Requirements:**
- feedback for this item from this user exists

**Effects:**
- returns the feedback from this user for this item

**Request Body:**
```json
{
  "author": "User",
  "item": "Item"
}
```

**Success Response Body (Query):**
```json
[
  {
    "feedback": "Feedback"
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