import { StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  const { signOut, session } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={80} name="person.circle.fill" color="#0a7ea4" />
        <ThemedText type="title">{session?.user?.email}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Account Information</ThemedText>
        <ThemedText>Email: {session?.user?.email}</ThemedText>
        <ThemedText>User ID: {session?.user?.id.substring(0, 8)}...</ThemedText>
      </ThemedView>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
    gap: 10,
  },
  content: {
    gap: 10,
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 