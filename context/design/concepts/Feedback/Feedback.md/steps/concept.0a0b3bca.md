---
timestamp: 'Wed Oct 15 2025 22:29:51 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_222951.1afe6739.md]]'
content_id: 0a0b3bcac423e3237fe2a2a1cc0ac1c3fa5357e2e2d270a0651054bd89796e93
---

# concept: Feedback

* **concept**: Feedback \[Author, Target]
* **purpose**: To enable users to provide qualitative comments, suggestions, or reports about a specific target.
* **principle**: If an author submits a textual comment regarding a specific target, then the target's owner or an administrator can later review this comment.
* **state**:
  * A set of `Feedback` with
    * an `author` of type `Author`
    * a `target` of type `Target`
    * a `message` of type `String`
    * a `timestamp` of type `Timestamp`
* **actions**:
  * `submitFeedback (author: Author, target: Target, message: String): (feedback: Feedback)`
    * **requires**: The `target` must exist. The `message` must not be empty.
    * **effects**: Creates a new `Feedback` entry, associating the `author`, `target`, `message`, and the current `timestamp`.
  * `updateFeedback (feedback: Feedback, newMessage: String)`
    * **requires**: The `feedback` item must exist. The `newMessage` must not be empty.
    * **effects**: Updates the `message` of the specified `feedback` item to `newMessage`.
  * `deleteFeedback (feedback: Feedback)`
    * **requires**: The `feedback` item must exist.
    * **effects**: Removes the specified `feedback` item.
