---
timestamp: 'Thu Oct 16 2025 19:25:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_192558.15897857.md]]'
content_id: c554bd75c8614dec6ffa726c067f3e6c3191dfc1871614dc4b46128cf913faa5
---

# response:

Based on the comprehensive guidelines you've provided for concept testing, here are the most common reasons why your tests might be failing. These reasons stem directly from the explicit requirements for `requires`, `effects`, and `principle` satisfaction, as well as the prescribed testing approach.

***

### Common Reasons for Test Failures

**1. Failures Related to `requires` (Precondition / Input Validation)**

* **Invalid Inputs Are Not Rejected (or not with `error:`):**
  * **Problem:** Your action is designed to have preconditions (`requires`). If you feed it input that *does not* meet these requirements, but the action *still proceeds* (e.g., inserts incomplete data, performs an operation it shouldn't, or returns a successful record) instead of failing or returning a record with an `error:` key, then your `requires` logic is flawed.
  * **Test Failure Manifestation:** A test case specifically designed to provide invalid input (e.g., missing a required field, out-of-range value) will `assertEquals` expecting an `error:` key, but instead receives a successful result or an unexpected return, causing the assertion to fail. Conversely, `assertThrows` might not catch an error if the action silently fails or returns a non-error object.
* **Incorrect `error:` Key Format/Content:**
  * **Problem:** Even if the action correctly identifies an invalid input, the returned record might not strictly contain an `error:` key, or the value associated with that key might not match the expected structure or content (e.g., `{ error: "Invalid data" }` instead of `{ error: { code: "INVALID_INPUT", message: "..." } }`).
  * **Test Failure Manifestation:** Your `assertEquals` against the `result.error` property will fail because the property is missing, `undefined`, or its value is not deeply equal to what you expect.

**2. Failures Related to `effects` (Postcondition / State Change)**

* **State Not Modified According to Specification:**
  * **Problem:** After an action is performed, the database state (or the immediate return value of the action) does not accurately reflect what the `effects` section describes. This could mean:
    * A record was *not* created/updated when it should have been.
    * A record was created/updated, but with *incorrect values* in certain fields.
    * Only a *subset* of the specified state changes occurred.
  * **Test Failure Manifestation:** Your post-action database queries (`db.get()`, `db.find()`) will return `null`, outdated data, or data with incorrect values, leading your `assertEquals` checks to fail.
* **Unexpected State Modifications:**
  * **Problem:** The action might inadvertently modify parts of the state that it shouldn't, or introduce side effects not described in `effects`.
  * **Test Failure Manifestation:** Assertions on other, unrelated parts of the database (to confirm they *haven't* changed) would fail, or queries for specific values might return unexpected results.
* **Incorrect Return Value:**
  * **Problem:** The action's immediate return value (if specified by `effects`) might be missing properties, contain incorrect data, or have an unexpected structure.
  * **Test Failure Manifestation:** `assertEquals` on the `result` object returned directly by the action will fail.
* **Asynchronous Operations Not Awaited:**
  * **Problem:** You're asserting on database state *before* an `async` database operation (like `db.insert`, `db.update`, `db.delete`) has actually completed.
  * **Test Failure Manifestation:** This is a classic race condition. The `db.get()` might return the *old* state, leading to a false negative failure, even if the operation would eventually succeed. Always `await` database operations before asserting on their effects.

**3. Failures Related to `principle` Modeling (Composition of Actions)**

* **Trace Does Not Achieve Overall Goal:**
  * **Problem:** While individual actions might pass their `requires` and `effects` tests in isolation, the sequence of actions outlined in your `trace:` (which models the `principle`) does not collectively produce the specified final behavior or update to the state. This points to a flaw in how the actions compose or a misunderstanding of the principle itself.
  * **Test Failure Manifestation:** The final `assertEquals` after executing the entire trace will fail because the end state or return value does not match the principle's expected outcome.
* **Incorrect Intermediate State:**
  * **Problem:** An action in the middle of your `trace` might fail because the preceding actions didn't correctly establish the `requires` (preconditions) for it. Or, the intermediate state is not what was expected, leading subsequent actions to behave unexpectedly.
  * **Test Failure Manifestation:** An intermediate action within the trace might return an `error:` (triggering an assertion failure) or produce incorrect `effects`, which then cascades into the final `principle` assertion failing.

**4. Implementation-Specific Issues (from "Test implementation")**

* **Forgetting `await client.close()`:**
  * **Problem:** While `Deno.test.beforeAll` handles database dropping, an unclosed client connection can lead to resource leaks, warnings, or prevent your Deno process from exiting cleanly, especially in larger test suites.
  * **Test Failure Manifestation:** May not cause an assertion to fail, but can result in `Deno.test` warnings, hanging tests, or "resource busy" errors if the test runner tries to clean up resources still in use.
* **Incorrect `assertEquals` Usage:**
  * **Problem:** Misunderstanding how `assertEquals` handles deep equality for complex objects, comparing `null` vs `undefined` inaccurately, or comparing object instances that are not referentially equal but logically should be.
  * **Test Failure Manifestation:** The assertion itself fails because the comparison logic isn't matching the expected values, even if the underlying concept logic is correct.
* **Missing `import` statements:**
  * **Problem:** Forgetting to import `assertEquals` from `jsr:@std/assert` or other helpers.
  * **Test Failure Manifestation:** A compile-time error (`TS2304: Cannot find name 'assertEquals'.`) or runtime error.

**5. General Logic Errors in Your Concept/Action Code**

* **Problem:** Fundamentally, the code implementing your actions (e.g., incorrect calculations, faulty conditional logic, off-by-one errors, typos in field names) is buggy.
* **Test Failure Manifestation:** Any assertion (for `requires`, `effects`, or `principle`) could fail because the underlying code simply doesn't produce the correct output or state change, regardless of how well the test is structured.

### How to Debug and Prevent Failures (Leveraging "Legible Testing")

To effectively pinpoint and fix these failures, lean heavily on the "Legible Testing" principles:

1. **Print Everything (Especially State):** Before and after each action, `console.log` the input, the full database state, and the action's return value. This detailed output will immediately show where the actual state deviates from your expected state.
2. **Specific Assertions:** Instead of one large `assertEquals(actualResult, expectedResult)` for complex objects, break it down: `assertEquals(actualResult.id, expectedResult.id)`, `assertEquals(actualResult.name, expectedResult.name)`. This tells you *which specific part* of the object is wrong.
3. **Intermediate Verification for Principles:** In `trace:` tests, add `assertEquals` checks *after each action* to verify the intermediate state. If a principle test fails, this helps you isolate which specific step in the sequence first broke the expected state.
4. **Isolate Action Tests:** Ensure *every individual action* passes its `requires` and `effects` tests thoroughly *before* integrating them into `principle` traces. If a principle test fails, you know the issue is more likely in the composition, not the fundamental correctness of an individual action.

By meticulously following your own guidelines, you create a robust testing harness that quickly exposes discrepancies between your concept's specification and its implementation.
