import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback } from "react";
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
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { useAuth } from "@/context/auth";
import { Colors } from "@/constants/colors";
import {
  useListProjects,
  useListCommunityPosts,
} from "@workspace/api-client-react";
import type { Project, CommunityPost } from "@workspace/api-client-react";

const C = Colors.dark;

const PROJECT_TYPE_COLORS: Record<string, string> = {
  app: C.primary,
  website: "#60A5FA",
  game: "#F472B6",
  "3d": C.secondary,
  other: C.textSecondary,
};

const PROJECT_TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  app: "layers",
  website: "globe",
  game: "triangle",
  "3d": "box",
  other: "file",
};

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const typeColor = PROJECT_TYPE_COLORS[project.type] ?? C.textSecondary;
  const typeIcon: keyof typeof Feather.glyphMap = PROJECT_TYPE_ICONS[project.type] ?? "file";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(tabs)/workspace", params: { projectId: String(project.id) } });
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).springify()} style={anim}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={handlePress}
        style={styles.projectCard}
      >
        <View style={[styles.projectIconBg, { backgroundColor: typeColor + "22" }]}>
          <Feather name={typeIcon} size={20} color={typeColor} />
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
          <Text style={[styles.projectType, { color: typeColor }]}>
            {project.type?.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.projectStatus, { backgroundColor: project.status === "published" ? C.success + "22" : C.textMuted + "22" }]}>
          <View style={[styles.statusDot, { backgroundColor: project.status === "published" ? C.success : C.textMuted }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function CommunityCard({ post, index }: { post: CommunityPost; index: number }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    Haptics.selectionAsync();
    router.push({ pathname: "/community/[id]", params: { id: String(post.id) } });
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()} style={[anim, styles.communityCard]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={handlePress}
        style={styles.communityCardInner}
      >
        {post.thumbnailUrl ? (
          <Image source={{ uri: post.thumbnailUrl }} style={styles.communityThumb} />
        ) : (
          <LinearGradient
            colors={["#0D1117", "#131A24"]}
            style={styles.communityThumb}
          >
            <Ionicons name="sparkles" size={24} color={C.primary} />
          </LinearGradient>
        )}
        <View style={styles.communityInfo}>
          <Text style={styles.communityTitle} numberOfLines={2}>{post.title}</Text>
          <View style={styles.communityMeta}>
            <Ionicons name="heart" size={12} color={C.error} />
            <Text style={styles.communityLikes}>{post.likes}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useListProjects();
  const { data: communityPosts } = useListCommunityPosts({ params: { query: { limit: 8 } } });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.firstName ?? "Builder";

  const handleNewProject = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/workspace");
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={projectsLoading}
            onRefresh={refetchProjects}
            tintColor={C.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <Pressable onPress={() => { Haptics.selectionAsync(); router.push("/(tabs)/profile"); }}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Hero CTA */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroCta}>
          <Pressable onPress={handleNewProject}>
            <LinearGradient
              colors={["rgba(0,229,255,0.15)", "rgba(168,85,247,0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBanner}
            >
              <View style={styles.heroBannerContent}>
                <View>
                  <Text style={styles.heroBannerTitle}>Start building</Text>
                  <Text style={styles.heroBannerSub}>Describe it. RealityOS builds it.</Text>
                </View>
                <View style={styles.heroBannerBtn}>
                  <Ionicons name="sparkles" size={20} color={C.background} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Recent Projects */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            {(projects?.length ?? 0) > 0 && (
              <Pressable onPress={() => router.push("/(tabs)/workspace")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>

          {!user ? (
            <Pressable onPress={() => router.push("/(tabs)/profile")} style={styles.signInPrompt}>
              <Ionicons name="log-in-outline" size={24} color={C.primary} />
              <Text style={styles.signInPromptText}>Sign in to see your projects</Text>
            </Pressable>
          ) : projectsLoading ? (
            <View style={styles.skeletonRow}>
              {[0, 1, 2].map(i => <View key={i} style={styles.skeleton} />)}
            </View>
          ) : (projects?.length ?? 0) === 0 ? (
            <Pressable onPress={handleNewProject} style={styles.emptyState}>
              <Ionicons name="add-circle-outline" size={32} color={C.primary} />
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubText}>Tap to create your first</Text>
            </Pressable>
          ) : (
            (projects ?? []).slice(0, 5).map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))
          )}
        </Animated.View>

        {/* Community Strip */}
        {(communityPosts?.length ?? 0) > 0 && (
          <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>From the Community</Text>
              <Pressable onPress={() => router.push("/(tabs)/community")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <FlatList
              data={(communityPosts ?? []).slice(0, 8)}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item, index }) => <CommunityCard post={item} index={index} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              scrollEnabled={true}
            />
          </Animated.View>
        )}
      </ScrollView>
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
    paddingBottom: 8,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.primary,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryDim,
    borderWidth: 2,
    borderColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.primary,
  },
  heroCta: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  heroBannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.text,
  },
  heroBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
  },
  heroBannerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: C.text,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.primary,
  },
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  projectIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.text,
  },
  projectType: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  projectStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skeletonRow: {
    gap: 8,
    paddingHorizontal: 16,
  },
  skeleton: {
    height: 68,
    borderRadius: 14,
    backgroundColor: C.surfaceElevated,
  },
  emptyState: {
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.text,
  },
  emptySubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textSecondary,
  },
  communityCard: {
    width: 140,
  },
  communityCardInner: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  communityThumb: {
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  communityInfo: {
    padding: 10,
  },
  communityTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.text,
    lineHeight: 16,
  },
  communityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  communityLikes: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textSecondary,
  },
  signInPrompt: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    gap: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  signInPromptText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.textSecondary,
  },
});
