---
timestamp: 'Tue Oct 14 2025 21:34:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_213453.df156896.md]]'
content_id: 6fd30a164d4471fbc69ac37b73e618df227fa66ee5864148a03242786acc0ecc
---

# concept: UserAuthentication \[User]

```
concept UserAuthentication
purpose limit access to known users
principle if a user registers with a username and password, they can then use that same username and password to successfully authenticate themselves as that user
state
  a set of Users with
    username String
    password String

actions
  register (username: String, password: String): (user: User)
      requires: the username is unique from the currently existing usernames.
      effects: creates and returns a new User that is associated with the username and password.

  authenticate (username: String, password: String): (user: User)
      requires: a valid username and password combination that exists
      effects: returns the User with the associated username.
```
