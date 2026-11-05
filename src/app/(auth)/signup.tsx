import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { AuthShell } from '../../components/AuthShell';
import { GoogleButton } from '../../components/GoogleButton';
import { GOOGLE_CONFIGURED } from '../../lib/config';
import { friendlyAuthError, useAuth } from '../../store/auth';

export default function SignUp() {
  const signUp = useAuth((s) => s.signUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim()) return setError('Enter your email address.');
    if (password.length < 6) return setError('Choose a password with at least 6 characters.');
    setBusy(true);
    setError('');
    try {
      await signUp(name, email, password);
    } catch (e) {
      setError(friendlyAuthError(e));
    }
    setBusy(false);
  };

  return (
    <AuthShell title="Create your account" subtitle="Your pantry and saved recipes stay safe if you change phones.">
      <TextInput label="Your name" value={name} onChangeText={setName} mode="outlined" autoCapitalize="words" autoComplete="name" />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={{ marginTop: 8 }}
      />
      <TextInput
        label="Password (6+ characters)"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry={!show}
        autoComplete="new-password"
        right={<TextInput.Icon icon={show ? 'eye-off' : 'eye'} onPress={() => setShow((s) => !s)} />}
        onSubmitEditing={submit}
        style={{ marginTop: 8 }}
      />
      <HelperText type="error" visible={!!error}>{error}</HelperText>
      <Button mode="contained" onPress={submit} loading={busy} disabled={busy} contentStyle={{ paddingVertical: 6 }}>
        Sign up
      </Button>
      {GOOGLE_CONFIGURED ? <GoogleButton /> : null}
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <Link href="/login" asChild>
          <Button mode="text">Already have an account? Log in</Button>
        </Link>
      </View>
    </AuthShell>
  );
}
