import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
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

import { useAuth } from "@/context/auth";
import { Colors } from "@/constants/colors";
import { useListProjects } from "@workspace/api-client-react";

const C = Colors.dark;

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "33" }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? C.error + "22" : C.surfaceElevated }]}>
        <Feather name={icon as any} size={18} color={danger ? C.error : C.textSecondary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: C.error }]}>{label}</Text>
      {!danger && <Feather name="chevron-right" size={18} color={C.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading, signIn, signOut } = useAuth();
  const { data: projects } = useListProjects();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const publishedCount = projects?.filter((p) => p.status === "published").length ?? 0;
  const totalCount = projects?.length ?? 0;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={C.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { paddingBottom: bottomPad }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <Animated.View entering={FadeInDown.springify()} style={styles.signInContainer}>
          <LinearGradient
            colors={[C.primaryDim, C.secondaryDim]}
            style={styles.signInIconBg}
          >
            <Ionicons name="person" size={40} color={C.primary} />
          </LinearGradient>
          <Text style={styles.signInTitle}>Join RealityOS</Text>
          <Text style={styles.signInSub}>
            Sign in to save your projects, track your builds, and connect with the community.
          </Text>
          <Pressable onPress={signIn} style={styles.signInBtn}>
            <LinearGradient
              colors={[C.primary, C.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInBtnGradient}
            >
              <Ionicons name="log-in-outline" size={18} color={C.background} />
              <Text style={styles.signInBtnText}>Continue with Replit</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Builder";

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={styles.headerTitle}>Profile</Text>
        </Animated.View>

        {/* User Card */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.userCard}>
          <LinearGradient
            colors={["rgba(0,229,255,0.08)", "rgba(168,85,247,0.06)"]}
            style={styles.userCardGradient}
          >
            {user.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.profileImg} />
            ) : (
              <View style={styles.profileImgFallback}>
                <Text style={styles.profileImgLetter}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>{displayName}</Text>
            {user.email && (
              <Text style={styles.userEmail}>{user.email}</Text>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.statsRow}>
          <StatCard label="Projects" value={totalCount} icon="layers" color={C.primary} />
          <StatCard label="Published" value={publishedCount} icon="globe" color={C.success} />
          <StatCard label="Building" value={totalCount - publishedCount} icon="zap" color={C.secondary} />
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuRow icon="user" label="Edit Profile" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuRow icon="bell" label="Notifications" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuRow icon="lock" label="Privacy" onPress={() => {}} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuRow icon="help-circle" label="Help Center" onPress={() => {}} />
            <View style={styles.menuDivider} />
            <MenuRow icon="star" label="Rate RealityOS" onPress={() => {}} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).springify()} style={[styles.menuSection, { marginBottom: 32 }]}>
          <View style={styles.menuCard}>
            <MenuRow
              icon="log-out"
              label="Sign Out"
              danger
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                signOut();
              }}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
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
  signInContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  signInIconBg: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  signInTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
  },
  signInSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  signInBtn: {
    width: "100%",
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  signInBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  signInBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.background,
  },
  userCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.surfaceBorder,
  },
  userCardGradient: {
    alignItems: "center",
    padding: 28,
    gap: 8,
  },
  profileImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.primary,
  },
  profileImgFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primaryDim,
    borderWidth: 3,
    borderColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImgLetter: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: C.primary,
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.text,
    marginTop: 4,
  },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.text,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textSecondary,
    textAlign: "center",
  },
  menuSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  menuSectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuRowPressed: {
    backgroundColor: C.surfaceElevated,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: C.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: C.surfaceBorder,
    marginLeft: 66,
  },
});
