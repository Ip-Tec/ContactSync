import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { session } = useAuth();
  
  // Redirect to tabs if already logged in
  if (session) {
    return <Redirect href="/(screens)/PreHomeScreen" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, title: 'Contact Sync' }}>
      <Stack.Screen name="login" options={{headerShown: false}}/>
      <Stack.Screen name="register" options={{headerShown: false}}/>
    </Stack>
  );
} 