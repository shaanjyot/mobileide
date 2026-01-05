import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const { context } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-5.2');
  const [showSettings, setShowSettings] = useState(false);

  const providers = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-5.2', 'gpt-5', 'gpt-4.1'] },
    { id: 'anthropic', name: 'Claude', models: ['claude-sonnet-4-5-20250929', 'claude-opus-4-5-20251101'] },
    { id: 'gemini', name: 'Gemini', models: ['gemini-3-flash-preview', 'gemini-3-pro-preview'] },
  ];

  const currentProvider = providers.find(p => p.id === provider);

  useEffect(() => {
    if (context) {
      // Add a system message if context is provided
      const welcomeMsg: Message = {
        role: 'assistant',
        content: `I can help you with the code you're working on. What would you like to know?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    } else {
      const welcomeMsg: Message = {
        role: 'assistant',
        content: 'Hello! I\'m your AI coding assistant. How can I help you today?',
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: inputText,
        session_id: sessionId,
        provider: provider,
        model: model,
        context: context || null,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.providerDot,
            { backgroundColor: provider === 'openai' ? '#10b981' : provider === 'anthropic' ? '#f59e0b' : '#3b82f6' }
          ]} />
          <Text style={styles.headerTitle}>
            {currentProvider?.name} - {model}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
            <Ionicons name="settings-outline" size={24} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsTitle}>AI Provider</Text>
          <View style={styles.providerButtons}>
            {providers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.providerButton,
                  provider === p.id && styles.providerButtonActive,
                ]}
                onPress={() => {
                  setProvider(p.id);
                  setModel(p.models[0]);
                }}
              >
                <Text style={[
                  styles.providerButtonText,
                  provider === p.id && styles.providerButtonTextActive,
                ]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.settingsTitle}>Model</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.modelButtons}>
              {currentProvider?.models.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modelButton,
                    model === m && styles.modelButtonActive,
                  ]}
                  onPress={() => setModel(m)}
                >
                  <Text style={[
                    styles.modelButtonText,
                    model === m && styles.modelButtonTextActive,
                  ]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <View style={styles.messageHeader}>
              <Ionicons
                name={message.role === 'user' ? 'person' : 'logo-android'}
                size={16}
                color={message.role === 'user' ? '#3b82f6' : '#10b981'}
              />
              <Text style={styles.messageRole}>
                {message.role === 'user' ? 'You' : 'AI Assistant'}
              </Text>
            </View>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything about coding..."
          placeholderTextColor="#6b7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          editable={!loading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons
            name="send"
            size={24}
            color={inputText.trim() && !loading ? '#ffffff' : '#6b7280'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  settingsPanel: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  settingsTitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  providerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  providerButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  providerButtonText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  providerButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modelButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modelButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  modelButtonText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  modelButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1e3a8a',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageRole: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 6,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1a1a1a',
  },
});
