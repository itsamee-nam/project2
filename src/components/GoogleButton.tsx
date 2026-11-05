import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Button } from 'react-native-paper';
import { GOOGLE } from '../lib/config';
import { friendlyAuthError, useAuth } from '../store/auth';
import { toast } from '../store/toast';

WebBrowser.maybeCompleteAuthSession();

/**
 * Only mounted when EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set (the hook throws without client IDs).
 * Note: Google sign-in needs a development build or standalone app, it does not work in Expo Go.
 */
export function GoogleButton() {
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE.webClientId,
    webClientId: GOOGLE.webClientId,
    androidClientId: GOOGLE.androidClientId || undefined,
    iosClientId: GOOGLE.iosClientId || undefined,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) signInWithGoogle(idToken).catch((e) => toast(friendlyAuthError(e)));
    } else if (response?.type === 'error') {
      toast('Google sign-in failed. Please try again.');
    }
  }, [response, signInWithGoogle]);

  return (
    <Button mode="outlined" icon="google" disabled={!request} onPress={() => promptAsync()} style={{ marginTop: 12 }}>
      Continue with Google
    </Button>
  );
}
