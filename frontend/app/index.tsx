import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="code-slash" size={48} color="#3b82f6" />
          <Text style={styles.title}>Mobile IDE</Text>
          <Text style={styles.subtitle}>Code anywhere, anytime</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="create-outline" size={32} color="#10b981" />
            <Text style={styles.featureTitle}>Code Editor</Text>
            <Text style={styles.featureText}>Multi-language syntax highlighting</Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="flash-outline" size={32} color="#f59e0b" />
            <Text style={styles.featureTitle}>AI Assistant</Text>
            <Text style={styles.featureText}>OpenAI, Claude, Gemini support</Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="play-outline" size={32} color="#ef4444" />
            <Text style={styles.featureTitle}>Code Execution</Text>
            <Text style={styles.featureText}>Run Python, JS, PHP instantly</Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="cloud-outline" size={32} color="#8b5cf6" />
            <Text style={styles.featureTitle}>Cloud Sync</Text>
            <Text style={styles.featureText}>Save projects to the cloud</Text>
          </View>
        </View>

        {/* Get Started Button */}
        <Link href="/projects" asChild>
          <TouchableOpacity style={styles.getStartedButton}>
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </Link>

        {/* Version Info */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  getStartedButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
  },
});
