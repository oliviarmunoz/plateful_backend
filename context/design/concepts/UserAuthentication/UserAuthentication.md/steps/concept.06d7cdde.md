---
timestamp: 'Tue Oct 14 2025 21:10:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_211033.93c007d2.md]]'
content_id: 06d7cdde49ca2f1e86d1d0e803f9075b6e3e31d447910976e0928b79f30b0bb5
---

# concept: UserAuthentication \[User]

**purpose** allow users to prove their identity to the system

**principle** If a user registers with a username and password, they can then use that same username and password to successfully authenticate themselves as that user.

**state**
  a set of Credentials with
    username String (unique)
    password String // In a real implementation, this would store a hashed password
    user User // The external identifier for the user this credential belongs to

**actions**
  register (username: String, password: String): (user: User)
    **requires**
      no Credentials entry exists where `Credentials.username` is the input `username`
    **effects**
      A new `user_id` (of type `User`) is generated.
      A new `Credentials` entry is created:
        `Credentials.username` := input `username`
        `Credentials.password` := input `password`
        `Credentials.user` := `user_id`
      return `user_id`

  register (username: String, password: String): (error: String)
    **requires**
      a `Credentials` entry already exists where `Credentials.username` is the input `username`
    **effects**
      return "Username already taken."

  authenticate (username: String, password: String): (user: User)
    **requires**
      a `Credentials` entry exists where
        `Credentials.username` is the input `username` AND
        `Credentials.password` is the input `password`
    **effects**
      return the `user` associated with the matched `Credentials` entry

  authenticate (username: String, password: String): (error: String)
    **requires**
      NOT (a `Credentials` entry exists where
        `Credentials.username` is the input `username` AND
        `Credentials.password` is the input `password`)
    **effects**
      return "Invalid username or password."

***
