# Firestore Data Model

Canonical reference for the app's data. Keep this in sync as the model evolves.

> **Change log**
> - Added `inviteCode` to `groups` (needed for the join-by-code flow).
> - Added top-level `inviteCodes/{CODE}` lookup collection (Stage 2) so a
>   not-yet-member can resolve a code to a groupId without reading the group.

## Collections

```
inviteCodes/{CODE}                     // CODE is the doc id (uppercase code)
  groupId            string             // the group this code joins
  createdAt          timestamp

users/{userId}
  displayName        string
  photoURL           string | null
  pushToken          string | null   // Expo push token, set via registerPushToken
  groupId            string | null   // the group this user belongs to (v1: one group)
  createdAt          timestamp

groups/{groupId}
  name               string
  inviteCode         string          // UNIQUE, short human-friendly code (e.g. "K7QW2M")
  memberIds          string[]        // uids of all members; privacy rules key off this
  createdBy          string          // uid of creator
  createdAt          timestamp
  currentBagPool     string[]        // uids not yet picked this round ("bag without replacement")
  roundNumber        number
  currentTurn        { userId, startedAt, expiresAt } | null

groups/{groupId}/turns/{turnId}
  userId             string
  startedAt          timestamp
  expiresAt          timestamp
  status             "active" | "expired"

groups/{groupId}/turns/{turnId}/clips/{clipId}
  uploaderId         string
  storagePath        string          // path in Firebase Storage
  durationSec        number          // <= ~30
  createdAt          timestamp
  order              number

groups/{groupId}/turns/{turnId}/clips/{clipId}/reactions/{reactionId}
  userId             string
  type               "emoji" | "comment"
  value              string
  createdAt          timestamp
```

## inviteCode

- Generated when a group is created (`src/utils/inviteCode.js`).
- 6 chars from a 31-char alphabet that excludes ambiguous characters
  (`0/O`, `1/I/L`) so it's easy to read aloud and type.
- **Must be unique.** On creation we generate a code, query
  `groups where inviteCode == code`, and regenerate if it already exists
  (`generateUniqueInviteCode`). At friends scale a query+retry is sufficient;
  if the app ever scales up, move creation into a Cloud Function transaction
  to close the check-then-write race.
- Join flow: user types the code → normalized (`normalizeInviteCode`) →
  look up the single group with that `inviteCode` → add uid to `memberIds`
  (and `currentBagPool`) → set the user's `groupId`. (Wired in Stage 2.)
