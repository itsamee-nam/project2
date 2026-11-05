import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { AuthShell } from '../../components/AuthShell';
import { GoogleButton } from '../../components/GoogleButton';
import { GOOGLE_CONFIGURED } from '../../lib/config';
import { friendlyAuthError, useAuth } from '../../store/auth';
import { toast } from '../../store/toast';

export default function Login() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (e) {
      setError(friendlyAuthError(e));
    }
    setBusy(false);
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError('Type your email above first, then tap "Forgot password".');
      return;
    }
    try {
      await resetPassword(email);
      toast('Password reset email sent. Check your inbox.');
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to see your pantry and recipes on any device.">
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry={!show}
        autoComplete="password"
        textContentType="password"
        right={<TextInput.Icon icon={show ? 'eye-off' : 'eye'} onPress={() => setShow((s) => !s)} />}
        onSubmitEditing={submit}
        style={{ marginTop: 8 }}
      />
      <HelperText type="error" visible={!!error}>{error}</HelperText>
      <Button mode="contained" onPress={submit} loading={busy} disabled={busy} contentStyle={{ paddingVertical: 6 }}>
        Log in
      </Button>
      <Button mode="text" onPress={forgot} style={{ marginTop: 4 }}>Forgot password?</Button>
      {GOOGLE_CONFIGURED ? <GoogleButton /> : null}
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <Link href="/signup" asChild>
          <Button mode="text">New here? Create an account</Button>
        </Link>
      </View>
    </AuthShell>
  );
}
