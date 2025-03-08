import { useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        // Show success message and navigate to login
        alert('Registration successful! Please check your email to confirm your account.');
        router.replace('/auth/login');
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
        source={require('@/assets/images/logo.png')} 
        style={styles.logo} 
        resizeMode="contain"
        className='w-full h-full rounded-full'
      />
      <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
      
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
        
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.registerButtonText}>Sign Up</ThemedText>
          )}
        </TouchableOpacity>
        
        <ThemedView style={styles.loginContainer}>
          <ThemedText>Already have an account? </ThemedText>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <ThemedText type="link">Log In</ThemedText>
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
  registerButton: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
}); 