---
timestamp: 'Thu Oct 16 2025 19:24:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_192425.9ba44eb8.md]]'
content_id: 39634297daf6db2d5aafe642ea5eccd0dbbd08d7426a88976bb09fa93b964846
---

# response:

Based on the provided guidelines for concept testing, here are the most common reasons why your tests might be failing:

Given that I don't have your specific test code or concept specification, these are general pitfalls derived directly from your "Concept Testing" rules and "Test implementation" approach.

***

### Common Reasons for Test Failures

**1. Failures Related to `requires` (Preconditions/Validation)**

* **Invalid Input Passes Unexpectedly**:
  * **Problem**: Your concept's action is not correctly validating its input according to the `requires` specification. A test case designed to fail (because it doesn't meet requirements) might unexpectedly succeed, or process invalid data without error.
  * **Test Failure**: The assertion in your test for an invalid input scenario (`assertThrows`, checking for an `error:` key) would fail because the action didn't throw an error or didn't return the expected error format.
* **Incorrect Error Handling/Return Format**:
  * **Problem**: Even if the action correctly identifies an invalid input, it might not return a record with an `error:` key, or the structure/content of that error key might not match what your test expects.
  * **Test Failure**: `assertEquals` on the returned object (e.g., `assertEquals(result.error, { code: 'INVALID_INPUT' })`) would fail if the error property is missing or has the wrong value.
* **Insufficient Test Coverage for `requires`**:
  * **Problem**: You might not have enough test cases for inputs that *should* fail. Testing only "happy paths" means you haven't fully verified the robustness of your `requires` logic.
  * **Consequence**: The concept might be failing in production or during integration, but your concept tests pass because they don't cover the broken scenarios.

**2. Failures Related to `effects` (Postconditions/State Changes)**

* **Incorrect State Modification**:
  * **Problem**: After an action is performed, the database state (or the action's return value) does not match the `effects` specification. This could mean:
    * Data is written incorrectly (wrong values, wrong fields).
    * Data is not written at all (record missing).
    * Unexpected data is written or existing data is inadvertently modified.
    * The action returns an incorrect value, or misses required properties.
  * **Test Failure**: Your post-action `db.get()` queries or assertions on the return value would not match the expected `assertEquals` values.
* **Flawed Verification Logic in Test**:
  * **Problem**: Your test might be checking the wrong field, or asserting on a value that isn't actually part of the `effects`. Forgetting to `await` database operations before asserting is a common async mistake.
  * **Test Failure**: The test itself is incorrect, leading to a false negative (test fails even if the action is correct) or a false positive (test passes even if the action is incorrect).

**3. Failures Related to `principle` Modeling**

* **Sequence of Actions Does Not Achieve Overall Goal**:
  * **Problem**: While individual actions might pass their `requires` and `effects` tests, the *combination* of actions described in the `principle` (your `trace:`) does not lead to the specified final behavior or state. This indicates a gap in how the actions compose or a flaw in the principle's definition itself.
  * **Test Failure**: The final assertions after the entire `trace` is executed would not match the expected `assertEquals` for the principle's outcome.
* **Incorrect Initial/Intermediate State Assumptions**:
  * **Problem**: The `trace` might assume a certain initial database state, or intermediate states that are not correctly set up or maintained by the preceding actions in the trace.
  * **Test Failure**: An action in the middle of the `trace` might fail its `requires` check because the necessary preconditions weren't met by a previous action, or the final state is off because the starting point was wrong.

**4. Implementation-Specific Issues (from "Test implementation")**

* **Forgetting `await client.close()`**:
  * **Problem**: While `Deno.test.beforeAll` drops the database, an open client connection can lead to resource leaks, warnings, or in some cases, unexpected behavior in long-running test suites or if the test runner doesn't fully clean up processes. It's crucial for resource management.
  * **Test Failure**: Might not directly fail an assertion, but could lead to process crashes, "too many open files" errors, or warnings during test execution.
* **Incorrect `assertEquals` Usage**:
  * **Problem**: Forgetting to `await` asynchronous calls before asserting. Attempting to compare complex objects where property order or specific deep equality behavior is critical, and `assertEquals` might not behave as expected for *all* deep equality scenarios (though Deno's `assertEquals` is generally good for this). Comparing `null` vs `undefined` mistakenly.
  * **Test Failure**: The assertion itself fails because the comparison is not correctly configured for the values being tested.
* **Asynchronous Issues**:
  * **Problem**: Not `await`ing database calls (`db.insert`, `db.get`) or other asynchronous operations. This can lead to assertions running *before* the state has actually been updated, resulting in false negatives.
  * **Test Failure**: Assertions fail because the data being checked is stale or not yet present.

**5. General Logic Errors in Your Concept/Action Code**

* **Problem**: Fundamentally, the code implementing your actions or the concept logic itself has bugs (e.g., incorrect calculations, faulty conditional logic, off-by-one errors).
* **Test Failure**: Any assertion (for `requires`, `effects`, or `principle`) could fail because the underlying code simply doesn't produce the correct output or state change.

**How to Debug and Prevent Failures (Leveraging "Legible Testing")**

* **Detailed Output**: Your guidelines emphasize "Each test should output what it is doing and the trace of any actions." *Use this heavily!* Print the input to actions, the state *before* an action, the state *after* an action, and the actual return value. This is invaluable for pinpointing exactly where the discrepancy lies.
* **Clear Assertions**: Make sure your `assertEquals` calls are very specific. Instead of `assertEquals(result, expectedResult)`, sometimes it's better to break it down: `assertEquals(result.id, expectedResult.id)`, `assertEquals(result.name, expectedResult.name)`.
* **Isolate Failures**: If a `principle` test fails, first ensure all individual actions within that principle pass their `requires` and `effects` tests in isolation. This helps narrow down if the problem is in a single action or in their composition.
* **Step-by-Step Verification**: For principle traces, after each action in the trace, you could add intermediate assertions or print statements to confirm the state is as expected *at that point*, rather than just checking the final state.

By meticulously following your own guidelines for defining `requires`, `effects`, and `principle` (and ensuring your tests rigorously verify them), you'll gain high confidence in your concepts and easily identify where the implementation deviates from the specification.
