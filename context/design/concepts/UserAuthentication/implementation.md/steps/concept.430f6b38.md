---
timestamp: 'Tue Oct 14 2025 21:55:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_215516.613dc928.md]]'
content_id: 430f6b38d526a791d578835fdc2bc89015ebb0cd8b8f334ae4285985b09f9ac0
---

# concept: UserAuthentication \[User]

```markdown
concept UserAuthentication [User]
purpose limit access to known users
principle if a user registers with a unique username and password, they can later log in using those same credentials to prove their identity and gain access.
state
    a set of Users with
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
