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
    </Stack>
  );
}
