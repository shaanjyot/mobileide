import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/styles/hljs';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface File {
  _id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  project_id: string;
}

interface Project {
  _id: string;
  name: string;
}

export default function EditorScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  
  // New file modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('javascript');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const languages = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'PHP', value: 'php' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JSON', value: 'json' },
  ];

  useEffect(() => {
    if (id) {
      loadProject();
      loadFiles();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Error', 'Failed to load project');
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/files/project/${id}`);
      setFiles(response.data);
      if (response.data.length > 0 && !selectedFile) {
        setSelectedFile(response.data[0]);
        setEditedContent(response.data[0].content);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const createFile = async () => {
    if (!newFileName.trim()) {
      Alert.alert('Error', 'Please enter a file name');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/files`, {
        project_id: id,
        name: newFileName,
        path: `/${newFileName}`,
        content: '',
        language: newFileLanguage,
      });
      
      setFiles([...files, response.data]);
      setSelectedFile(response.data);
      setEditedContent('');
      setModalVisible(false);
      setNewFileName('');
      setEditMode(true);
    } catch (error) {
      console.error('Error creating file:', error);
      Alert.alert('Error', 'Failed to create file');
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    try {
      setSaving(true);
      await axios.put(`${API_URL}/api/files/${selectedFile._id}`, {
        content: editedContent,
      });
      
      // Update local state
      setSelectedFile({ ...selectedFile, content: editedContent });
      setFiles(files.map(f => 
        f._id === selectedFile._id ? { ...f, content: editedContent } : f
      ));
      
      setEditMode(false);
      Alert.alert('Success', 'File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      Alert.alert('Error', 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const executeCode = async () => {
    if (!selectedFile) return;

    try {
      setExecuting(true);
      const response = await axios.post(`${API_URL}/api/code/execute`, {
        code: editMode ? editedContent : selectedFile.content,
        language: selectedFile.language,
        inputs: [],
      });
      
      const result = response.data;
      let outputText = '';
      
      if (result.output) {
        outputText += `Output:\n${result.output}\n`;
      }
      if (result.error) {
        outputText += `Error:\n${result.error}\n`;
      }
      outputText += `\nExecution time: ${result.execution_time.toFixed(3)}s`;
      
      setOutput(outputText);
      setShowOutput(true);
    } catch (error) {
      console.error('Error executing code:', error);
      Alert.alert('Error', 'Failed to execute code');
    } finally {
      setExecuting(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/files/${fileId}`);
              const updatedFiles = files.filter(f => f._id !== fileId);
              setFiles(updatedFiles);
              
              if (selectedFile?._id === fileId) {
                setSelectedFile(updatedFiles[0] || null);
                setEditedContent(updatedFiles[0]?.content || '');
              }
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const openEnhancedAIChat = () => {
    router.push({
      pathname: `/ai-chat/${id}`,
      params: { 
        projectId: id,
        currentFileId: selectedFile?._id || '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading editor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Files Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Files</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.fileList}>
          {files.map((file) => (
            <TouchableOpacity
              key={file._id}
              style={[
                styles.fileItem,
                selectedFile?._id === file._id && styles.fileItemActive,
              ]}
              onPress={() => {
                setSelectedFile(file);
                setEditedContent(file.content);
                setEditMode(false);
              }}
              onLongPress={() => deleteFile(file._id)}
            >
              <Ionicons 
                name="document-text" 
                size={16} 
                color={selectedFile?._id === file._id ? '#3b82f6' : '#9ca3af'} 
              />
              <Text style={[
                styles.fileName,
                selectedFile?._id === file._id && styles.fileNameActive,
              ]}>
                {file.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Editor Area */}
      <View style={styles.editorContainer}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.toolbarTitle}>
              {selectedFile?.name || 'No file selected'}
            </Text>
          </View>
          <View style={styles.toolbarRight}>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={openEnhancedAIChat}
            >
              <Ionicons name="sparkles" size={20} color="#a855f7" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolbarButton}
              onPress={openAIChat}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#10b981" />
            </TouchableOpacity>
            {selectedFile && (
              <>
                {editMode ? (
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={saveFile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#10b981" />
                    ) : (
                      <Ionicons name="save" size={20} color="#10b981" />
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.toolbarButton}
                    onPress={() => setEditMode(true)}
                  >
                    <Ionicons name="create" size={20} color="#f59e0b" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.toolbarButton}
                  onPress={executeCode}
                  disabled={executing}
                >
                  {executing ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (
                    <Ionicons name="play" size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Code Display/Edit Area */}
        <ScrollView style={styles.codeArea}>
          {selectedFile ? (
            editMode ? (
              <TextInput
                style={styles.codeInput}
                multiline
                value={editedContent}
                onChangeText={setEditedContent}
                placeholder="Start coding..."
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
            ) : (
              <View style={styles.syntaxContainer}>
                <SyntaxHighlighter
                  language={selectedFile.language}
                  style={atomOneDark}
                  highlighter="hljs"
                  customStyle={{
                    backgroundColor: '#0a0a0a',
                    padding: 16,
                    fontSize: 14,
                  }}
                >
                  {selectedFile.content || '// Empty file'}
                </SyntaxHighlighter>
              </View>
            )
          ) : (
            <View style={styles.emptyEditor}>
              <Ionicons name="code-slash" size={48} color="#4b5563" />
              <Text style={styles.emptyText}>No file selected</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Output Modal */}
      <Modal
        visible={showOutput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOutput(false)}
      >
        <View style={styles.outputOverlay}>
          <View style={styles.outputContent}>
            <View style={styles.outputHeader}>
              <Text style={styles.outputTitle}>Output</Text>
              <TouchableOpacity onPress={() => setShowOutput(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.outputScroll}>
              <Text style={styles.outputText}>{output}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New File Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New File</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="File name (e.g., main.js)"
              placeholderTextColor="#6b7280"
              value={newFileName}
              onChangeText={setNewFileName}
            />

            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setShowLanguageModal(true)}
            >
              <Text style={styles.languageSelectorText}>
                Language: {languages.find(l => l.value === newFileLanguage)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createButton}
              onPress={createFile}
            >
              <Text style={styles.createButtonText}>Create File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.languageOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageModal}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.value}
                style={styles.languageOption}
                onPress={() => {
                  setNewFileLanguage(lang.value);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={styles.languageOptionText}>{lang.label}</Text>
                {newFileLanguage === lang.value && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
  sidebar: {
    width: 120,
    backgroundColor: '#0a0a0a',
    borderRightWidth: 1,
    borderRightColor: '#2a2a2a',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  fileItemActive: {
    backgroundColor: '#1a1a1a',
  },
  fileName: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
    flex: 1,
  },
  fileNameActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  toolbarLeft: {
    flex: 1,
  },
  toolbarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 12,
  },
  toolbarButton: {
    padding: 8,
  },
  codeArea: {
    flex: 1,
  },
  syntaxContainer: {
    flex: 1,
  },
  codeInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    padding: 16,
  },
  emptyEditor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
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
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  languageSelector: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  languageSelectorText: {
    color: '#ffffff',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  languageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: '80%',
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  languageOptionText: {
    color: '#ffffff',
    fontSize: 16,
  },
  outputOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  outputContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  outputTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  outputScroll: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  outputText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
