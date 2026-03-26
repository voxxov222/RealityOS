import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Colors } from "@/constants/colors";
import { useListCommunityPosts } from "@workspace/api-client-react";

const C = Colors.dark;

const TAGS = ["All", "App", "Website", "Game", "3D"];

const TAG_COLORS: Record<string, string> = {
  App: C.primary,
  Website: "#60A5FA",
  Game: "#F472B6",
  "3D": C.secondary,
};

function PostCard({ post, index }: { post: any; index: number }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()} style={[anim, styles.cardWrapper]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => Haptics.selectionAsync()}
        style={styles.card}
      >
        {/* Thumbnail */}
        {post.thumbnailUrl ? (
          <Image source={{ uri: post.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <LinearGradient
            colors={["#0D1117", "#131A24"]}
            style={styles.thumb}
          >
            <Ionicons name="sparkles" size={28} color={C.primary} />
          </LinearGradient>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <View style={styles.tagRow}>
            {post.tags.slice(0, 2).map((t: string) => (
              <View
                key={t}
                style={[
                  styles.tag,
                  { backgroundColor: (TAG_COLORS[t] ?? C.textSecondary) + "33" },
                ]}
              >
                <Text style={[styles.tagText, { color: TAG_COLORS[t] ?? C.textSecondary }]}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{post.title}</Text>
          {post.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>{post.description}</Text>
          )}

          <View style={styles.cardMeta}>
            {post.authorImageUrl ? (
              <Image source={{ uri: post.authorImageUrl }} style={styles.authorImg} />
            ) : (
              <View style={styles.authorPlaceholder}>
                <Text style={styles.authorLetter}>
                  {(post.authorName ?? "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.authorName} numberOfLines={1}>
              {post.authorName ?? "Unknown"}
            </Text>
            <View style={styles.likesRow}>
              <Ionicons name="heart" size={12} color={C.error} />
              <Text style={styles.likesText}>{post.likes}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [activeTag, setActiveTag] = useState("All");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const tag = activeTag === "All" ? undefined : activeTag;
  const {
    data: posts,
    isLoading,
    refetch,
  } = useListCommunityPosts({
    params: { query: { tag, limit: 50 } },
  });

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSub}>What people are building</Text>
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {TAGS.map((t) => {
            const active = activeTag === t;
            const tagColor = TAG_COLORS[t] ?? C.primary;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTag(t);
                }}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: tagColor, borderColor: tagColor },
                ]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Grid */}
      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeleton} />
          ))}
        </View>
      ) : (posts?.length ?? 0) === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="grid-outline" size={48} color={C.textMuted} />
          <Text style={styles.emptyText}>Nothing here yet</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => <PostCard post={item} index={index} />}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.primary} />
          }
        />
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: C.text,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  filterChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: C.textSecondary,
  },
  filterChipTextActive: {
    color: C.background,
    fontFamily: "Inter_600SemiBold",
  },
  columnWrapper: {
    gap: 8,
  },
  cardWrapper: {
    flex: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  thumb: {
    width: "100%",
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surfaceElevated,
  },
  tagRow: {
    flexDirection: "row",
    gap: 4,
    padding: 8,
    paddingBottom: 0,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  cardBody: {
    padding: 10,
    gap: 6,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 16,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  authorImg: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  authorPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  authorLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: C.primary,
  },
  authorName: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textSecondary,
    flex: 1,
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  likesText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: C.textSecondary,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  skeleton: {
    width: "48%",
    height: 200,
    borderRadius: 16,
    backgroundColor: C.surfaceElevated,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.textSecondary,
  },
});
