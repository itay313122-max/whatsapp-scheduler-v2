import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

// Converts various timestamp shapes (Firestore Timestamp, millis, Date) to ms.
function toMillis(t) {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (t.seconds != null) return t.seconds * 1000;
  if (t instanceof Date) return t.getTime();
  return 0;
}

function format(ms) {
  if (ms <= 0) return 'expired';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m left`;
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s left`;
}

// Live 24h countdown for a turn's expiry.
export default function Countdown({ expiresAt, style }) {
  const target = toMillis(expiresAt);
  const [remaining, setRemaining] = useState(target - Date.now());

  useEffect(() => {
    setRemaining(target - Date.now());
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const expired = remaining <= 0;
  return (
    <Text style={[{ color: expired ? colors.danger : colors.textMuted, fontWeight: '600' }, style]}>
      {format(remaining)}
    </Text>
  );
}
