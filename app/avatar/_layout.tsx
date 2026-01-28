import { Stack } from 'expo-router';

export default function AvatarLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#F9FAFB',
        },
      }}
    >
      <Stack.Screen name="create-twin" />
      <Stack.Screen name="camera-permission" />
      <Stack.Screen name="choose-method" />
      <Stack.Screen 
        name="photo-capture" 
        options={{
          animation: 'fade',
          contentStyle: {
            backgroundColor: '#1a1a1a',
          },
        }}
      />
      <Stack.Screen 
        name="processing" 
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="review-twin" />
      <Stack.Screen name="edit-measurements" />
      <Stack.Screen 
        name="avatar-complete" 
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
