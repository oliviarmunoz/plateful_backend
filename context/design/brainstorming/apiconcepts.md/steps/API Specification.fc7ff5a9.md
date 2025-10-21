---
timestamp: 'Sun Oct 19 2025 15:47:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_154738.50dc861b.md]]'
content_id: fc7ff5a98e0b10cee06f9b9693f2eb1c807c1bdf1150f53b7c618373a2c39a45
---

# API Specification: UserAuthentication Concept

**Purpose:** authenticate users with a username and password

***

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**

* no user with `username` exists

**Effects:**

* creates a new user
* associates `username` and `password` with the new user
* sets `loggedIn` status of the new user to `false`
* returns the new `user` identifier

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

***

### POST /api/UserAuthentication/login

**Description:** Authenticates an existing user with their username and password, marking them as logged in.

**Requirements:**

* a user exists with `username` and `password`
* that user is not currently `loggedIn`

**Effects:**

* sets the `loggedIn` status of the matching user to `true`
* returns the `user` identifier

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

***

### POST /api/UserAuthentication/logout

**Description:** Logs out an authenticated user.

**Requirements:**

* the specified `user` exists
* the specified `user` is currently `loggedIn`

**Effects:**

* sets the `loggedIn` status of the `user` to `false`

**Request Body:**

```json
{
  "user": "User"
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

***

### POST /api/UserAuthentication/\_isLoggedIn

**Description:** Checks if a specified user is currently logged in.

**Requirements:**

* the specified `user` exists

**Effects:**

* returns the current `loggedIn` status of the user

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
    "loggedIn": "Boolean"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
