## Recommended 3-AI setup

### 1. **Planner**

Proposes:

* rename
* move
* tag/classify
* duplicate/stale flag

### 2. **Reviewer**

Challenges the proposal and either:

* accepts
* requests revision
* escalates to human

### 3. **Worker**

Executes only **approved, structured actions** against Google Drive:

* `rename`
* `move`
* `add_tag` in your DB
* `mark_duplicate`
* `archive_candidate`

That is a much safer design than letting one agent both decide and act.

---

## The key rule

The worker should **never read free-form debate and “figure out” what to do**.

Instead, it should consume a strict record like:

```json
{
  "recommendation_id": "rec_10294",
  "file_id": "drive_file_abc123",
  "approved_action": "move",
  "target_parent_id": "folder_xyz789",
  "new_name": null,
  "approval_status": "approved",
  "approved_by": "reviewer+hints+rules",
  "idempotency_key": "sess77-item18-v3-move"
}
```

That way:

* the first two AIs **reason**
* the third AI **executes**
* SQL is the source of truth

---

## Why this fits Google Drive well

For moving files in Drive, Google’s API supports changing parents through `files.update`, using `addParents` and `removeParents`; Google’s docs also note that a file can only have one parent folder. ([Google for Developers][1])

For resumability, Drive’s change-tracking flow is built around `changes.getStartPageToken` and `changes.list`, which lets you persist a token and continue from where you left off. ([Google for Developers][2])

If you touch shared drives, Google says your app should use `supportsAllDrives=true` for apps that read or modify content across My Drive and shared drives. ([Google for Developers][2])

---

## Best architecture

## **Planner → Reviewer → Approved Action Queue → Worker → Drive API → SQL event log**

That queue in the middle matters a lot.

### SQL tables to add

#### `approved_actions`

* `action_id`
* `item_id`
* `session_id`
* `action_type`
* `target_parent_id`
* `new_name`
* `status` (`pending`, `running`, `done`, `failed`, `reverted`)
* `idempotency_key`
* `approved_at`

#### `action_attempts`

* `attempt_id`
* `action_id`
* `started_at`
* `finished_at`
* `request_json`
* `response_json`
* `error_code`
* `error_message`

#### `drive_sync_state`

* `scope_id`
* `last_start_page_token`
* `last_polled_at`

#### `human_review_queue`

* `item_id`
* `reason`
* `risk_level`
* `blocked_action_id`

---

## What the worker should do

The worker should be more like an **operations agent** than a creative model.

Its job:

1. Read one approved action from SQL.
2. Re-fetch the current file metadata from Drive.
3. Validate preconditions:

   * file still exists
   * current parent still matches expectation
   * target folder exists
   * permissions allow the move
4. Execute the change.
5. Log the exact request/response.
6. Mark success or failure.
7. Store the new Drive snapshot and change token progress.

That re-check step is important because the Drive state may have changed since the first two AIs reviewed it.

---

## Strong recommendation: make the worker mostly deterministic

You can still call it a “third AI,” but in practice the safest design is:

* **LLM only for ambiguity resolution**
* **rules/code for execution**

So the worker can use an LLM for small decisions like:

* choosing between two already-approved destination folders
* formatting a clean filename from an approved pattern

But the actual mutation should be driven by code and explicit fields, not open-ended prompting.

---

## Good approval policy

### Auto-approve

* rename-only changes with high confidence
* move within the same business unit
* tag/classify only
* duplicate flags without deletion

### Human approval required

* moving across departments
* archive decisions
* anything touching shared-drive boundaries
* permission-related changes
* anything with low reviewer confidence

That matters because Drive operations can fail for policy or capability reasons, especially around shared-drive movement and permissions. Google’s docs expose capabilities related to whether items can be moved in certain ways, and not every parent change is allowed even when the API method exists. ([Google for Developers][3])

---

## Important safety constraints

Your worker should **not** directly perform:

* delete
* permission changes
* ownership transfer
* mass folder merges

at least not in v1.

Ownership behavior is especially tricky because Google documents different rules for My Drive versus shared drives, and ownership transfers are not supported for files and folders in shared drives. ([Google for Developers][4])

---

## Resume behavior

When resuming:

* reload incomplete sessions from SQL
* reload pending/failed actions
* fetch recent Drive changes from the saved token
* invalidate stale recommendations if the file changed since approval
* continue the planner/reviewer loop only where needed

That keeps the worker from applying an old decision to a newly edited or already-moved file.

---

## The one pattern I’d strongly avoid

Do **not** let the worker prompt look like:

> “Here is the whole debate. Please make the best change.”

That makes execution mushy, hard to audit, and hard to resume.

Use:

> “Apply approved action X if preconditions A/B/C still hold; otherwise mark blocked.”

That is the difference between an agentic toy and a system you can trust.

---

## My recommendation

Yes — add the third worker, but make it a **transactional executor** with very little freedom.

### Best version

* Planner proposes
* Reviewer approves
* SQL stores structured decisions
* Worker validates and executes
* Human reviews risky cases

That is the right architecture for a resumable Google Drive cleanup system.
