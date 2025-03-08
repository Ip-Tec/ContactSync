import { useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      setError('An unexpected error occurred');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image 
        source={require('@/assets/images/icon.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
      
      <ThemedView style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[
            styles.input,
            { 
              color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
              backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0'
            }
          ]}
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[
            styles.input,
            { 
              color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
              backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0'
            }
          ]}
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
        />
        
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.loginButtonText}>Log In</ThemedText>
          )}
        </TouchableOpacity>
        
        <ThemedView style={styles.registerContainer}>
          <ThemedText>Don't have an account? </ThemedText>
          <Link href="/auth/register" asChild>
            <TouchableOpacity>
              <ThemedText type="link">Sign Up</ThemedText>
            </TouchableOpacity>
          </Link>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  input: {
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});