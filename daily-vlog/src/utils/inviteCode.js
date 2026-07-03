// Invite-code helpers for group join flow.
//
// A group's inviteCode is a short, human-friendly string the creator shares
// so friends can join. It must be UNIQUE across groups, because join looks a
// group up by this code.

// Ambiguous characters (0/O, 1/I/L) are excluded so codes are easy to read
// aloud and type without confusion.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/**
 * Generate a random invite code, e.g. "K7QW2M".
 * Not guaranteed unique on its own — callers must verify against Firestore
 * (see generateUniqueInviteCode) before committing it to a group.
 */
export function generateInviteCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/**
 * Generate an invite code that isn't already used by another group.
 *
 * @param {(code: string) => Promise<boolean>} isTaken
 *   Async predicate that returns true if a group with this code already exists.
 *   In Stage 2 this is a Firestore query:
 *     groups where inviteCode == code, limit 1, check !empty.
 * @param {number} maxAttempts Safety cap so we never loop forever.
 * @returns {Promise<string>} A code not currently taken.
 *
 * Note: with a 31-char alphabet and length 6 there are ~887M combinations, so
 * for a friends-scale app collisions are extremely rare and a query+retry is
 * plenty. If this ever runs at large scale, move creation into a Cloud
 * Function transaction to close the check-then-write race.
 */
export async function generateUniqueInviteCode(isTaken, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInviteCode();
    if (!(await isTaken(code))) {
      return code;
    }
  }
  throw new Error('Could not generate a unique invite code, please try again.');
}

/** Normalize user-typed codes: trim, uppercase, strip spaces. */
export function normalizeInviteCode(input) {
  return (input || '').trim().toUpperCase().replace(/\s+/g, '');
}
