import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { db } from '../firebase/config';
import { subscribeReactions, addReaction } from '../services/feedService';
import { colors } from '../theme/colors';

const QUICK = ['❤️', '😂', '🔥', '😮', '👏'];

// One clip in the feed: a placeholder media tile (real video in Stage 4),
// a live emoji reaction bar with counts, and live comments.
export default function ClipCard({ clip, groupId, turnId, uid, nameFor }) {
  const [reactions, setReactions] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const unsub = subscribeReactions(
      { db },
      groupId,
      turnId,
      clip.id,
      setReactions,
      () => setReactions([])
    );
    return unsub;
  }, [groupId, turnId, clip.id]);

  const emojiCounts = useMemo(() => {
    const counts = {};
    for (const r of reactions) {
      if (r.type === 'emoji') counts[r.value] = (counts[r.value] || 0) + 1;
    }
    return counts;
  }, [reactions]);

  const comments = useMemo(
    () => reactions.filter((r) => r.type === 'comment'),
    [reactions]
  );

  function react(emoji) {
    addReaction({ db }, {
      groupId, turnId, clipId: clip.id, userId: uid, type: 'emoji', value: emoji,
    }).catch(() => {});
  }

  function sendComment() {
    const text = comment.trim();
    if (!text) return;
    setComment('');
    addReaction({ db }, {
      groupId, turnId, clipId: clip.id, userId: uid, type: 'comment', value: text,
    }).catch(() => {});
  }

  return (
    <View style={styles.card}>
      {/* Placeholder media tile — real video playback arrives in Stage 4 */}
      <View style={styles.media}>
        <Text style={styles.play}>▶</Text>
        <Text style={styles.duration}>{clip.durationSec ?? 0}s</Text>
        <Text style={styles.mock}>mock clip</Text>
      </View>

      <Text style={styles.uploader}>{nameFor(clip.uploaderId)}</Text>

      {/* Emoji reaction bar */}
      <View style={styles.reactRow}>
        {QUICK.map((e) => (
          <Pressable key={e} onPress={() => react(e)} style={styles.reactBtn}>
            <Text style={styles.reactEmoji}>{e}</Text>
            {emojiCounts[e] ? <Text style={styles.reactCount}>{emojiCounts[e]}</Text> : null}
          </Pressable>
        ))}
      </View>

      {/* Comments */}
      {comments.length > 0 && (
        <View style={styles.comments}>
          {comments.map((c) => (
            <Text key={c.id} style={styles.comment}>
              <Text style={styles.commentName}>{nameFor(c.userId)} </Text>
              {c.value}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.commentBox}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={sendComment}
        />
        <Pressable onPress={sendComment} style={styles.send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  media: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: { color: colors.text, fontSize: 34, opacity: 0.85 },
  duration: {
    position: 'absolute', bottom: 8, right: 10,
    color: colors.text, fontSize: 12, fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  mock: { position: 'absolute', top: 8, left: 10, color: colors.textMuted, fontSize: 11 },
  uploader: { color: colors.text, fontWeight: '700', fontSize: 14, marginTop: 10 },
  reactRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceAlt, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  reactEmoji: { fontSize: 16 },
  reactCount: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  comments: { marginTop: 12, gap: 5 },
  comment: { color: colors.text, fontSize: 14, lineHeight: 19 },
  commentName: { fontWeight: '700', color: colors.text },
  commentBox: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 10, color: colors.text, fontSize: 14,
  },
  send: { paddingHorizontal: 6 },
  sendText: { color: colors.text, fontWeight: '700', fontSize: 14 },
});
