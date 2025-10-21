---
timestamp: 'Sun Oct 19 2025 15:45:17 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_154517.6cec81b6.md]]'
content_id: f133591c3d85d15929265f85dd6182a39a8d95287c943a07630657942800d4a0
---

# API Specification: UserAuthentication Concept

**Purpose:** manage user identities and access control

***

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**

* username is not already taken

**Effects:**

* creates a new User with the given username and password
* sets loggedIn to false
* returns the new user

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

**Description:** Authenticates a user with their username and password, logging them into the system.

**Requirements:**

* a User with the given username and password exists
* that User is not already logged in

**Effects:**

* sets the User's loggedIn status to true
* returns the User

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

**Description:** Logs out an authenticated user, marking them as not logged in.

**Requirements:**

* user exists and is logged in

**Effects:**

* sets the User's loggedIn status to false

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

### POST /api/UserAuthentication/\_getLoggedInUsers

**Description:** Retrieves a list of all users currently logged into the system.

**Requirements:**

* true

**Effects:**

* returns the set of all users that are currently logged in

**Request Body:**

```json
{}
```

**Success Response Body (Query):**

```json
[
  {
    "user": "User"
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

### POST /api/UserAuthentication/\_getUserByUsername

**Description:** Retrieves a specific user by their username.

**Requirements:**

* a User with the given username exists

**Effects:**

* returns the User with the specified username

**Request Body:**

```json
{
  "username": "String"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": "User"
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
