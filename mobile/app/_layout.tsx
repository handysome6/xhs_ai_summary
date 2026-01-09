import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text, Linking } from 'react-native';
import { getDatabase } from '../src/db/repository';
import { runMigrations } from '../src/db/migrations';
import { handleSharedUrl, ShareResult } from '../src/services/share-handler';
import { usePostStore } from '../src/stores/post-store';
import { ShareConfirmation } from '../src/components/ShareConfirmation';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const addPost = usePostStore((state) => state.addPost);

  // Initialize database
  useEffect(() => {
    async function initializeApp() {
      try {
        const db = await getDatabase();
        await runMigrations(db);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError(
          error instanceof Error ? error.message : 'Failed to initialize app'
        );
      }
    }

    initializeApp();
  }, []);

  // Handle incoming share intents
  const handleUrl = useCallback(
    async (url: string) => {
      if (!url) return;

      try {
        const result = await handleSharedUrl(url);
        setShareResult(result);

        if (result.success && result.post && !result.isDuplicate) {
          addPost(result.post);
        }
      } catch (error) {
        console.error('Failed to handle shared URL:', error);
      }
    },
    [addPost]
  );

  // Listen for incoming URLs
  useEffect(() => {
    // Handle URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // Listen for URL events while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [handleUrl]);

  // Show loading while initializing
  if (!isReady && !initError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF2442" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show error if initialization failed
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to start app</Text>
        <Text style={styles.errorText}>{initError}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="post/[id]"
          options={{
            title: 'Post Details',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
      <ShareConfirmation
        result={shareResult}
        onDismiss={() => setShareResult(null)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
  },
});
