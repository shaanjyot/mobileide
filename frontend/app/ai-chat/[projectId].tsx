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
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/styles/hljs';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code_blocks?: CodeBlock[];
  timestamp: Date;
}

interface CodeBlock {
  language: string;
  code: string;
  can_apply: boolean;
}

export default function EnhancedAIChatScreen() {
  const { projectId, currentFileId } = useLocalSearchParams();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-5.2');
  const [showSettings, setShowSettings] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  
  // File creation modal
  const [showFileModal, setShowFileModal] = useState(false);
  const [pendingCode, setPendingCode] = useState('');
  const [pendingLanguage, setPendingLanguage] = useState('javascript');
  const [newFileName, setNewFileName] = useState('');

  const providers = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-5.2', 'gpt-5', 'gpt-4.1'] },
    { id: 'anthropic', name: 'Claude', models: ['claude-sonnet-4-5-20250929', 'claude-opus-4-5-20251101'] },
    { id: 'gemini', name: 'Gemini', models: ['gemini-3-flash-preview', 'gemini-3-pro-preview'] },
  ];

  const currentProvider = providers.find(p => p.id === provider);

  useEffect(() => {
    const welcomeMsg: Message = {
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant with full project context. I can:\n\n• Generate complete code files\n• Create new files in your project\n• Refactor existing code\n• Explain code concepts\n• Debug issues\n\nWhat would you like help with?',
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
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
      const response = await axios.post(`${API_URL}/api/chat/enhanced`, {
        message: inputText,
        session_id: sessionId,
        project_id: projectId,
        current_file_id: currentFileId || null,
        provider: provider,
        model: model,
        include_project_context: includeContext,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        code_blocks: response.data.code_blocks || [],
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

  const applyCodeToCurrentFile = async (code: string, language: string) => {
    if (!currentFileId) {
      // No file open - create new file
      setPendingCode(code);
      setPendingLanguage(language);
      setShowFileModal(true);
      return;
    }

    try {
      // Automatically apply code to current file
      await axios.post(`${API_URL}/api/ai/apply-operation`, {
        project_id: projectId,
        operation: 'edit',
        file_id: currentFileId,
        file_name: '',
        file_path: '',
        content: code,
        language: language,
      });
      
      Alert.alert('Success', 'Code applied to file! Returning to editor...', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error applying code:', error);
      Alert.alert('Error', 'Failed to apply code');
    }
  };

  const createNewFileWithCode = async () => {
    if (!newFileName.trim()) {
      Alert.alert('Error', 'Please enter a file name');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/ai/apply-operation`, {
        project_id: projectId,
        operation: 'create',
        file_name: newFileName,
        file_path: `/${newFileName}`,
        content: pendingCode,
        language: pendingLanguage,
      });
      
      setShowFileModal(false);
      setNewFileName('');
      Alert.alert('Success', 'File created successfully!');
      router.back();
    } catch (error) {
      console.error('Error creating file:', error);
      Alert.alert('Error', 'Failed to create file');
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
          onPress: () => {
            const welcomeMsg: Message = {
              role: 'assistant',
              content: 'Chat cleared. How can I help you?',
              timestamp: new Date(),
            };
            setMessages([welcomeMsg]);
          },
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
          <View>
            <Text style={styles.headerTitle}>
              {currentProvider?.name} - {model}
            </Text>
            <Text style={styles.headerSubtitle}>
              {includeContext ? '🔗 Full Context' : '📄 Basic Mode'}
            </Text>
          </View>
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
          <View style={styles.settingRow}>
            <Text style={styles.settingsTitle}>Include Project Context</Text>
            <TouchableOpacity
              style={[styles.toggle, includeContext && styles.toggleActive]}
              onPress={() => setIncludeContext(!includeContext)}
            >
              <View style={[styles.toggleThumb, includeContext && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

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
          <View key={index}>
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <View style={styles.messageHeader}>
                <Ionicons
                  name={message.role === 'user' ? 'person' : 'sparkles'}
                  size={16}
                  color={message.role === 'user' ? '#3b82f6' : '#10b981'}
                />
                <Text style={styles.messageRole}>
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </Text>
              </View>
              <Text style={styles.messageText}>{message.content}</Text>
            </View>

            {/* Code Blocks */}
            {message.code_blocks && message.code_blocks.length > 0 && (
              <View style={styles.codeBlocksContainer}>
                {message.code_blocks.map((block, blockIndex) => (
                  <View key={blockIndex} style={styles.codeBlockWrapper}>
                    <View style={styles.codeBlockHeader}>
                      <Text style={styles.codeBlockLanguage}>
                        {block.language}
                      </Text>
                      {block.can_apply && (
                        <TouchableOpacity
                          style={styles.applyButton}
                          onPress={() => applyCodeToCurrentFile(block.code, block.language)}
                        >
                          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                          <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView horizontal>
                      <SyntaxHighlighter
                        language={block.language}
                        style={atomOneDark}
                        highlighter="hljs"
                        customStyle={{
                          backgroundColor: '#0a0a0a',
                          padding: 12,
                          fontSize: 13,
                        }}
                      >
                        {block.code}
                      </SyntaxHighlighter>
                    </ScrollView>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>Generating response...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me to generate, refactor, or explain code..."
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

      {/* File Creation Modal */}
      <Modal
        visible={showFileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New File</Text>
              <TouchableOpacity onPress={() => setShowFileModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="File name (e.g., component.js)"
              placeholderTextColor="#6b7280"
              value={newFileName}
              onChangeText={setNewFileName}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={createNewFileWithCode}
            >
              <Text style={styles.createButtonText}>Create File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10b981',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9ca3af',
  },
  toggleThumbActive: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
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
    marginBottom: 12,
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
  codeBlocksContainer: {
    marginBottom: 16,
  },
  codeBlockWrapper: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  codeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  codeBlockLanguage: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#052e16',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  applyButtonText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
