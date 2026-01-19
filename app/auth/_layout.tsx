import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen 
        name="signin" 
        options={{
          animation: 'fade',
          animationDuration: 200,
        }}
      />
      <Stack.Screen 
        name="signup" 
        options={{
          animation: 'fade',
          animationDuration: 200,
        }}
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="otp-verification" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="verification-complete" 
        options={{
          animation: 'fade',
          animationDuration: 400,
        }}
      />
      <Stack.Screen 
        name="reset-password" 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
