---
timestamp: 'Tue Oct 21 2025 21:22:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_212257.49d44239.md]]'
content_id: 0410d55fd60d6e370a7ec69f20169738a6167d29501b90386d98a6490550dd52
---

# concept: UserAuthentication \[User]

```markdown
  concept UserAuthentication [User]
  purpose limit access to known users
  principle if a user registers with a unique username and password, they can later log in using those
  same credentials to prove their identity and gain access.
  
  state
      a set of Credentials with
          a username String
          a password String

  actions
      register (username: String, password: String): (user: User)
          requires: no User exists with the given username
          effects: creates and returns a new User and associates it with the provided username and password

      authenticate (username: String, password: String): (user: User)
          requires: a User exists with the given username, and the password matches the stored password for that User
          effects: returns the User associated with the credentials

      _getUsername (user: User) : (username: String)
          requires: user exists
          effects: returns username of user
```
