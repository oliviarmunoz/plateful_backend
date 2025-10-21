# API Specification: UserAuthentication Concept

**Purpose:** authenticate users with a username and password

---

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**

- no user with `username` exists

**Effects:**

- creates a new user
- associates `username` and `password` with the new user
- returns the new `user` identifier

**Request Body:**

```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "user": "User"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/authenticate

**Description:** Authenticates an existing user with their username and password, marking them as logged in.

**Requirements:**

- a user exists with `username` and `password`

**Effects:**

- returns the `user` identifier

**Request Body:**

```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "user": "User"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/_getUsername

**Description:** Checks if a specified user is currently logged in.

**Requirements:**

- the specified `user` exists

**Effects:**

- returns the current `username` of the user

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "username": "String"
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
