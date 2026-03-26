import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { fetch } from "expo/fetch";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useAuth } from "@/context/auth";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Colors } from "@/constants/colors";
import { useListProjects, useCreateProject } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";

const C = Colors.dark;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function genId(): string {
  msgCounter += 1;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={14} color={C.primary} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.typingRow}>
      <View style={styles.botAvatar}>
        <Ionicons name="sparkles" size={14} color={C.primary} />
      </View>
      <View style={styles.typingBubble}>
        <ActivityIndicator size="small" color={C.primary} />
        <Text style={styles.typingText}>Building...</Text>
      </View>
    </View>
  );
}

function ProjectPicker({
  projects,
  selectedId,
  onSelect,
  onCreate,
}: {
  projects: Project[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onCreate: () => void;
}) {
  return (
    <View style={styles.projectPicker}>
      <FlatList
        data={[{ id: null as number | null, name: "New Chat" }, ...projects]}
        keyExtractor={(item) => String(item.id ?? "new")}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                if (item.id === null) {
                  onCreate();
                } else {
                  onSelect(item.id);
                }
              }}
              style={[
                styles.projectChip,
                selected && styles.projectChipSelected,
              ]}
            >
              {item.id === null && (
                <Ionicons name="add" size={14} color={selected ? C.background : C.primary} />
              )}
              <Text
                style={[
                  styles.projectChipText,
                  selected && styles.projectChipTextSelected,
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const SUGGESTIONS = [
  "Build me a Snake game",
  "Create a portfolio website",
  "Make a todo app with dark theme",
  "Create a 3D solar system",
];

export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, signIn } = useAuth();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    params.projectId ? Number(params.projectId) : null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { data: projects } = useListProjects();
  const createProject = useCreateProject();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { voiceState, startRecording, stopRecording } = useVoiceInput({
    onTranscript: (text) => {
      setInputText((prev) => (prev ? `${prev} ${text}` : text));
      setVoiceError(null);
    },
    onError: (message) => {
      setVoiceError(message);
      setTimeout(() => setVoiceError(null), 3000);
    },
  });

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming || !user) return;

    setInputText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    inputRef.current?.focus();

    const userMsg: Message = { id: genId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setShowTyping(true);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
      const body: { prompt: string; projectId?: number } = { prompt: text };
      if (selectedProjectId !== null) body.projectId = selectedProjectId;

      const response = await fetch(`https://${domain}/api/agent/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Agent responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body reader");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as { content?: string; chunk?: string };
            const chunk = parsed.content ?? parsed.chunk ?? "";
            if (chunk) {
              fullContent += chunk;
              if (!assistantAdded) {
                setShowTyping(false);
                setMessages((prev) => [
                  ...prev,
                  { id: genId(), role: "assistant", content: fullContent },
                ]);
                assistantAdded = true;
              } else {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last) {
                    updated[updated.length - 1] = { ...last, content: fullContent };
                  }
                  return updated;
                });
              }
            }
          } catch {
            // Skip malformed SSE data frames
          }
        }
      }

      if (!assistantAdded) {
        setShowTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: genId(), role: "assistant", content: fullContent || "Done! Let me know what to refine." },
        ]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      console.error("[Workspace] Agent error:", errorMessage);
      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: "Something went wrong. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }, [inputText, isStreaming, user, token, selectedProjectId]);

  const handleNewProject = useCallback(async () => {
    if (!user) return;
    try {
      const p = await createProject.mutateAsync({
        data: { name: `Project ${Date.now().toString().slice(-4)}`, type: "app" },
      });
      setSelectedProjectId(p.id);
      setMessages([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("[Workspace] Failed to create project:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [user, createProject]);

  const reversed = [...messages].reverse();
  const isRecording = voiceState === "recording";
  const isProcessing = voiceState === "processing";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={18} color={C.primary} />
          <Text style={styles.headerTitle}>RealityOS</Text>
        </View>
      </View>

      {/* Project Picker */}
      {user && (projects?.length ?? 0) > 0 && (
        <ProjectPicker
          projects={projects ?? []}
          selectedId={selectedProjectId}
          onSelect={(id) => {
            setSelectedProjectId(id);
            setMessages([]);
          }}
          onCreate={handleNewProject}
        />
      )}

      {/* Not signed in */}
      {!user ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.authPrompt}>
          <View style={styles.authIcon}>
            <Ionicons name="sparkles" size={32} color={C.primary} />
          </View>
          <Text style={styles.authTitle}>Sign in to start building</Text>
          <Text style={styles.authSub}>
            Describe apps, games, websites, and 3D experiences — and RealityOS will build them for you.
          </Text>
          <Pressable onPress={signIn} style={styles.authBtn}>
            <LinearGradient
              colors={[C.primary, C.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.authBtnGradient}
            >
              <Text style={styles.authBtnText}>Continue with Replit</Text>
              <Ionicons name="arrow-forward" size={16} color={C.background} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          {messages.length === 0 && !showTyping ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.emptyChat}>
              <View style={styles.emptyChatIcon}>
                <Ionicons name="sparkles" size={32} color={C.primary} />
              </View>
              <Text style={styles.emptyChatTitle}>What will you build?</Text>
              <View style={styles.suggestionGrid}>
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => {
                      setInputText(s);
                      Haptics.selectionAsync();
                    }}
                    style={styles.suggestion}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : (
            <FlatList
              data={reversed}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageBubble message={item} />}
              inverted={messages.length > 0}
              ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Voice error toast */}
          {voiceError ? (
            <View style={styles.voiceErrorToast}>
              <Ionicons name="alert-circle" size={16} color={C.error} />
              <Text style={styles.voiceErrorText}>{voiceError}</Text>
            </View>
          ) : null}

          {/* Input */}
          <View style={[styles.inputContainer, { paddingBottom: bottomPad + 8 }]}>
            {isRecording && (
              <View style={styles.recordingBanner}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Listening... tap mic to stop</Text>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Describe what you want to build..."
                placeholderTextColor={C.textMuted}
                multiline
                maxLength={2000}
                blurOnSubmit={false}
                returnKeyType="default"
                editable={!isRecording}
              />
              {/* Voice button */}
              <Pressable
                onPress={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
                disabled={isStreaming || isProcessing}
                style={[
                  styles.voiceBtn,
                  isRecording && styles.voiceBtnActive,
                  (isStreaming || isProcessing) && styles.voiceBtnDisabled,
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={20}
                    color={isRecording ? C.background : C.primary}
                  />
                )}
              </Pressable>
              {/* Send button */}
              <Pressable
                onPress={() => {
                  handleSend();
                  inputRef.current?.focus();
                }}
                disabled={!inputText.trim() || isStreaming || isRecording}
                style={[
                  styles.sendBtn,
                  (!inputText.trim() || isStreaming || isRecording) && styles.sendBtnDisabled,
                ]}
              >
                {isStreaming ? (
                  <ActivityIndicator size="small" color={C.background} />
                ) : (
                  <Ionicons name="arrow-up" size={20} color={C.background} />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.text,
  },
  projectPicker: {
    marginBottom: 4,
  },
  projectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  projectChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  projectChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.textSecondary,
    maxWidth: 100,
  },
  projectChipTextSelected: {
    color: C.background,
  },
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  authIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: C.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  authTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.text,
    textAlign: "center",
  },
  authSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  authBtn: {
    width: "100%",
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  authBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  authBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.background,
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyChatIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.text,
    marginBottom: 20,
  },
  suggestionGrid: {
    gap: 10,
    width: "100%",
  },
  suggestion: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  suggestionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  bubbleRowUser: {
    flexDirection: "row-reverse",
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 12,
  },
  bubbleBot: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.text,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: C.background,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  voiceErrorToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.error + "22",
    borderWidth: 1,
    borderColor: C.error + "55",
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  voiceErrorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.error,
    flex: 1,
  },
  recordingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginBottom: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.error,
  },
  recordingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.error,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.surfaceBorder,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.text,
    borderWidth: 1,
    borderColor: C.cardBorder,
    maxHeight: 120,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtnActive: {
    backgroundColor: C.error,
    borderColor: C.error,
  },
  voiceBtnDisabled: {
    opacity: 0.4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: C.textMuted,
  },
});
