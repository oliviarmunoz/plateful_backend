---
timestamp: 'Wed Oct 15 2025 22:52:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_225238.a1d4cfe0.md]]'
content_id: 35b4d013e48f18e62e4f8d3e4bf0b0b7e99f2c14a2dd898d211b73a982579972
---

# response:

Let's critique both `LikertSurvey` and `Feedback` concepts against the principles and structure defined in the "Why Concept Design?" document.

## General Observations for Both Concepts:

Both concepts generally follow the specified structure well, including:

* A descriptive `concept` name with appropriate `type parameters`.
* A concise `purpose` statement.
* An `archetypal principle` scenario.
* A `state` definition that describes the entities and their relationships.
* `actions` with input/output arguments and pre/post conditions.

They both demonstrate good adherence to key concept design principles:

* **Modularity and Independence:** Neither concept refers to other specific concepts internally, upholding the principle of independence. `Author`, `Respondent`, `User`, and `Item` are treated polymorphically.
* **Separation of Concerns:** Each concept focuses on a single, coherent aspect of functionality (Likert surveys or general feedback) without conflating unrelated functionalities (e.g., user authentication, item storage).
* **Completeness of Functionality (within their scope):** Each concept provides the actions necessary to manage its core functionality (creating, adding, submitting, updating, deleting). Any interaction with other concepts (like notifying an author) would occur via `synchronizations`.
* **Concepts are not objects:** They define a `set` of entities (Surveys/Questions/Responses, Feedbacks), not properties of a single object. Actions are not constructors in the OO sense.
* **Reusability:** Both concepts are highly reusable across different applications.

Now, let's look at each concept individually for more specific points.

***

## Critique of `LikertSurvey`

**concept**: `LikertSurvey [Author, Respondent]`

**purpose**: "To measure attitudes or opinions by asking respondents to rate their level of agreement with a series of statements on a predefined scale."

* **Good:** This purpose is need-focused ("measure attitudes or opinions"), specific ("Likert-style rating"), and evaluable (you can tell if the design achieves this).

**principle**: "If an author creates a survey with several questions on a 1-5 scale, and a respondent submits their answers to those questions, then the author can view the collected responses to analyze the respondent's opinions."

* **Good:** This is goal-focused, demonstrating how the purpose is fulfilled. It's archetypal and describes a full, typical scenario.
* **Minor Point:** The phrase "author can view the collected responses" implies a query, which is not explicitly defined in the actions section. While the document states that queries are "often defined implicitly by the state and do not need to be explicitly specified" at the design level, for an implementation specification, an explicit query (e.g., `getResponses(survey: Survey): (responses: Set<{respondent: Respondent, question: Question, value: Number}>)`) would be beneficial to fully support the principle. For a *design* document, this is acceptable.

**state**:

* `A set of Surveys with an author of type Author, a title of type String, a scaleMin of type Number, a scaleMax of type Number`
* `A set of Questions with a survey of type Survey, a text of type String`
* `A set of Responses with a respondent of type Respondent, a question of type Question, a value of type Number`
* **Good:** The state is well-structured, clearly defining the entities and their relationships. It seems "rich enough" to support the behavior (e.g., `scaleMin`/`scaleMax` for validation), but "no richer" than necessary. The use of generic `Author` and `Respondent` types ensures polymorphism.

**actions**:

* `createSurvey (author: Author, title: String, scaleMin: Number, scaleMax: Number): (survey: Survey)`
  * **requires**: `scaleMin < scaleMax` - Good, ensures a valid scale.
  * **effects**: "Creates a new survey with the given author, title, and scale." - Clear.
* `addQuestion (survey: Survey, text: String): (question: Question)`
  * **requires**: "The survey must exist." - Good, prevents orphaned questions.
  * **effects**: "Adds a new question to the specified survey." - Clear.
* `submitResponse (respondent: Respondent, question: Question, value: Number)`
  * **requires**: "The question must exist. The respondent must not have already submitted a response for this question. The value must be within the survey's scale."
    * **Excellent:** These preconditions make the action robust, ensuring data integrity and preventing double-submission. They act as firing conditions as prescribed.
  * **effects**: "Records the respondent's answer for the given question." - Clear.
* `updateResponse (respondent: Respondent, question: Question, value: Number)`
  * **requires**: "The question must exist. The respondent must have already submitted a response for this question. The value must be within the survey's scale."
    * **Excellent:** Similar to `submitResponse`, these are robust preconditions for updating.
  * **effects**: "Updates the respondent's existing answer for the given question." - Clear.

**Overall for `LikertSurvey`:** This is a very strong concept design that aligns well with the provided documentation. The separation of concerns, independence, and detailed action specifications are commendable. The implicit query for viewing results is the only minor aspect, but again, acceptable for a design specification.

***

## Critique of `Feedback`

**concept**: `Feedback [User, Item]`

**purpose**: "provide qualitative comments/suggestions/reports about a specific item"

* **Good:** This is need-focused ("provide comments/suggestions"), specific ("qualitative... about a specific item"), and evaluable.

**principle**: "after an author has provided feedback about an item, they can view past comments"

* **Good:** Goal-focused, showing how the purpose is fulfilled. It's archetypal.
* **Minor Point:** Similar to `LikertSurvey`, "view past comments" implies an explicit query which is not listed. This is fine for a design spec, but worth noting for implementation. An action like `getFeedback(item: Item, user: User): (message: String)` or `getAllFeedbackOnItem(item: Item): (feedbacks: Set<{author: User, message: String}>)` would clarify.

**state**:

* `A set of Feedbacks with an author User, a target Item, a message String`
* **Good:** The state clearly defines what the concept remembers. The implicit key for `Feedbacks` would be the combination of `author` and `target`. This implies that a `User` can only provide *one* `Feedback` entry per `Item`.
  * **Consideration:** Is this the desired behavior? If a user should be able to provide multiple, distinct feedback entries on the *same item* over time, the `Feedback` entity would need an additional identifier (like a `timestamp` or a generated `feedbackId`) to make each entry unique. The current design (and its `submitFeedback` precondition) enforces one feedback per user per item, which is a valid design choice, but important to be aware of.

**actions**:

* `submitFeedback (author: User, item: Item, message: String):`
  * **requires**: "item doesn't already have feedback from this user, message is not empty"
    * **Good:** These preconditions align with the one-feedback-per-user-per-item model implied by the state. "message is not empty" is a good data integrity check.
  * **effects**: "creates a new Feedback, associating the author, target, and message" - Clear.
* `updateFeedback (author: User, item: Item, newMessage: String)`
  * **requires**: "feedback for this item from this user exists, newMessage is not empty"
    * **Good:** Ensures that only existing feedback can be updated and that updates are meaningful.
  * **effects**: "updates the message of the specified item to newMessage" - Clear.
* `deleteFeedback (author: User, item: Item)`
  * **requires**: "feedback for this item from this user exists"
    * **Good:** Prevents deletion of non-existent feedback.
  * **effects**: "removes the feedback for this specified item." - Clear.

**Overall for `Feedback`:** This is also a strong concept design. It's concise, focuses clearly on its purpose, and the actions are well-defined. The main point of discussion is the implication of the state design: one feedback entry per user per item. If this is the intended semantic, then the concept is consistent and robust. If multiple feedback entries were desired, the state and actions would need to be adjusted (e.g., by adding a `feedbackId` or `timestamp` to `Feedback` to make each entry unique).

***

## Conclusion

Both `LikertSurvey` and `Feedback` are excellent examples of concept design according to the provided documentation. They adhere to the principles of modularity, independence, separation of concerns, and have well-defined structures. The minor suggestions regarding explicit queries or potential state model variations are more about clarification for implementation or exploring alternative design choices rather than fundamental flaws in their concept design approach.
