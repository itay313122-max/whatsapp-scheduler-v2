import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebase/config';
import { uploadClipVideo } from '../../services/storageService';
import { colors } from '../../theme/colors';

const MAX_SEC = 30;

// STAGE 4: record a short clip, then upload it to Storage and create the clip
// doc. Recorded at reduced resolution ('480p') to keep files small — that's our
// on-device "compression" while staying inside Expo Go and the free tier.
export default function RecordScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const groupId = profile?.groupId;
  const turnId = route.params?.turnId;
  const nextOrder = route.params?.nextOrder ?? 0;

  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const cameraRef = useRef(null);

  const [facing, setFacing] = useState('back');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);

  // Ask for permissions once on mount.
  useEffect(() => {
    if (camPerm && !camPerm.granted && camPerm.canAskAgain) requestCam();
    if (micPerm && !micPerm.granted && micPerm.canAskAgain) requestMic();
  }, [camPerm, micPerm]);

  // Tick the elapsed timer while recording.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        elapsedRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [recording]);

  const ready = camPerm?.granted && micPerm?.granted;

  async function toggleRecord() {
    if (uploading) return;
    if (recording) {
      cameraRef.current?.stopRecording();
      return;
    }
    setElapsed(0);
    elapsedRef.current = 0;
    setRecording(true);
    try {
      const video = await cameraRef.current?.recordAsync({
        maxDuration: MAX_SEC,
        quality: '480p',
      });
      setRecording(false);
      if (video?.uri) {
        await handleUpload(video.uri, elapsedRef.current);
      }
    } catch (e) {
      setRecording(false);
      Alert.alert('Recording failed', e.message);
    }
  }

  async function handleUpload(uri, duration) {
    if (!groupId || !turnId) {
      Alert.alert('No active turn', 'Start your turn before recording.');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      await uploadClipVideo(
        { storage, db },
        {
          groupId,
          turnId,
          uploaderId: user.uid,
          localUri: uri,
          durationSec: Math.min(Math.max(Math.round(duration), 1), MAX_SEC),
          order: nextOrder,
          onProgress: setProgress,
        }
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  }

  // Permission gate.
  if (!ready) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.perm}>
          <Text style={styles.permEmoji}>🎥</Text>
          <Text style={styles.permTitle}>Camera & microphone</Text>
          <Text style={styles.permBody}>
            Daily Vlog needs your camera and mic to record clips.
          </Text>
          <PrimaryButton
            title="Grant access"
            onPress={() => {
              requestCam();
              requestMic();
            }}
            style={{ marginTop: 16 }}
          />
          <PrimaryButton title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
        videoQuality="480p"
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          {recording ? (
            <View style={styles.recPill}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>
                {elapsed}s / {MAX_SEC}s
              </Text>
            </View>
          ) : (
            <Text style={styles.hintTop}>Max {MAX_SEC}s</Text>
          )}
          <Pressable
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            hitSlop={12}
            disabled={recording}
          >
            <Text style={[styles.flip, recording && { opacity: 0.3 }]}>⟳</Text>
          </Pressable>
        </View>

        <View style={styles.bottom}>
          {uploading ? (
            <View style={styles.uploadBox}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadText}>
                Uploading… {Math.round(progress * 100)}%
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={toggleRecord}
              style={[styles.shutter, recording && styles.shutterRec]}
            >
              <View style={recording ? styles.shutterInnerRec : styles.shutterInner} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  top: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 10,
  },
  close: { color: '#fff', fontSize: 26, fontWeight: '700' },
  flip: { color: '#fff', fontSize: 26, fontWeight: '700' },
  hintTop: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  recPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger },
  recText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  bottom: { alignItems: 'center', paddingBottom: 34 },
  shutter: {
    width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  shutterRec: { borderColor: colors.danger },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  shutterInnerRec: { width: 30, height: 30, borderRadius: 7, backgroundColor: colors.danger },
  uploadBox: { alignItems: 'center', gap: 10 },
  uploadText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  perm: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  permEmoji: { fontSize: 52, marginBottom: 8 },
  permTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  permBody: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});
