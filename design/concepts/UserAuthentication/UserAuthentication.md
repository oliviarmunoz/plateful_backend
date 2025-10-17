[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@LikertSurvey](../LikertSurvey/LikertSurvey.md)

# concept: UserAuthentication [User]

``` markdown
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
