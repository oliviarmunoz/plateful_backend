---
timestamp: 'Wed Oct 15 2025 20:34:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_203407.c1fdf646.md]]'
content_id: 1a5f1a36cade7efd0581a4f86a1de72417d96088c19dee3ff0db952925b564b5
---

# concept: UserAuthentication \[User]

```markdown
concept UserAuthentication [User]
purpose limit access to known users
principle if a user registers with a unique username and password, they can later log in using those same credentials to prove their identity and gain access.
state
    a set of Credentials with
        a username String
        a password String
actions
    register (username: String, password: String): (user: User)
        requires: no User exists with the given username.
        effects: creates and returns a new User and associates it with the provided username and password
    
    login (username: String, password: String): (user: User)
        requires: a User exists with the given username, and the password matches the stored password for that User
        effects: returns the User associated with the credentials

    \_getPassword (user: User) : (password: String)
        requires: user exists
        effects: returns password of user
```
