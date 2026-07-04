// Pure notification helpers — no Firebase, so they're unit-tested.

/** Everyone in the group except the given user (e.g. the clip uploader). */
function otherMemberIds(memberIds, exceptUid) {
  return (memberIds || []).filter((id) => id && id !== exceptUid);
}

module.exports = { otherMemberIds };
