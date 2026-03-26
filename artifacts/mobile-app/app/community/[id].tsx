import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Colors } from "@/constants/colors";
import { useGetCommunityPost } from "@workspace/api-client-react";

const C = Colors.dark;

const TAG_COLORS: Record<string, string> = {
  App: C.primary,
  Website: "#60A5FA",
  Game: "#F472B6",
  "3D": C.secondary,
};

function TagPill({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] ?? C.textSecondary;
  return (
    <View style={[styles.tag, { backgroundColor: color + "33" }]}>
      <Text style={[styles.tagText, { color }]}>{tag}</Text>
    </View>
  );
}

export default function CommunityDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);

  const { data: post, isLoading, error } = useGetCommunityPost(postId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {post?.title ?? "Community"}
        </Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={C.error} />
          <Text style={styles.errorText}>Failed to load post</Text>
          <Pressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Go back</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.skeletonThumb} />
          <View style={styles.skeletonContent}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.skeletonLine, { width: `${80 - i * 15}%` }]} />
            ))}
          </View>
        </ScrollView>
      ) : post ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Thumbnail */}
          <Animated.View entering={FadeInDown.springify()}>
            {post.thumbnailUrl ? (
              <Image source={{ uri: post.thumbnailUrl }} style={styles.thumb} />
            ) : (
              <LinearGradient
                colors={["#0D1117", "#131A24"]}
                style={styles.thumb}
              >
                <Ionicons name="sparkles" size={48} color={C.primary} />
              </LinearGradient>
            )}
          </Animated.View>

          {/* Content */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>{post.title}</Text>

            {/* Tags */}
            {post.tags.length > 0 && (
              <View style={styles.tagRow}>
                {post.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} />
                ))}
              </View>
            )}

            {/* Author */}
            <View style={styles.authorRow}>
              {post.authorImageUrl ? (
                <Image source={{ uri: post.authorImageUrl }} style={styles.authorImg} />
              ) : (
                <View style={styles.authorPlaceholder}>
                  <Text style={styles.authorLetter}>
                    {(post.authorName ?? "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{post.authorName ?? "Anonymous"}</Text>
                <Text style={styles.postedAt}>
                  {new Date(post.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.likesRow}>
                <Ionicons name="heart" size={16} color={C.error} />
                <Text style={styles.likesText}>{post.likes}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Description */}
            {post.description ? (
              <Text style={styles.description}>{post.description}</Text>
            ) : (
              <Text style={styles.noDescription}>No description provided.</Text>
            )}
          </Animated.View>
        </ScrollView>
      ) : null}
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: C.text,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  retryBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.primary,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  thumb: {
    width: "100%",
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surfaceElevated,
  },
  skeletonThumb: {
    width: "100%",
    height: 240,
    backgroundColor: C.surfaceElevated,
  },
  skeletonContent: {
    padding: 20,
    gap: 12,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: C.surfaceElevated,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
    lineHeight: 32,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  authorLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.primary,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.text,
  },
  postedAt: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  likesText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: C.surfaceBorder,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: C.textSecondary,
    lineHeight: 26,
  },
  noDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textMuted,
    fontStyle: "italic",
  },
});
