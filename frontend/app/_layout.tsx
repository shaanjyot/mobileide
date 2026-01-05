import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0a0a',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#0a0a0a',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Mobile IDE',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="projects" 
          options={{ title: 'Projects' }} 
        />
        <Stack.Screen 
          name="editor/[id]" 
          options={{ title: 'Editor' }} 
        />
        <Stack.Screen 
          name="chat" 
          options={{ title: 'AI Assistant' }} 
        />
        <Stack.Screen 
          name="ai-chat/[projectId]" 
          options={{ title: 'Enhanced AI Assistant' }} 
        />
      </Stack>
    </>
  );
}
