import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { ROUTES } from '@/constants/routes';
import { Card } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';

export const InstructorDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAppSelector(s => s.auth.user);
  const displayEmail = user?.email ?? 'instructor@example.com';
  const avatarInitial =
    (user?.fullName && user.fullName.trim().charAt(0)) ||
    (displayEmail && displayEmail.trim().charAt(0)) ||
    'U';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.headerCard}
      >
        <View style={styles.headerTop}>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{avatarInitial.toUpperCase()}</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerHello}>
                  Hello,
                  {' '}
                  <Text style={styles.headerEmail}>{displayEmail}</Text>
                </Text>
                <View style={styles.vipBadge}>
                  <Text style={styles.vipLabel}>VIP</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>Manage your teaching empire</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.searchPlaceholder}>Search for luxury courses...</Text>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Instructor Tools</Text>
      <Text style={styles.subtitle}>Chọn một module để quản lý chi tiết.</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate(ROUTES.INSTRUCTOR_CREATE_COURSE as never)}
      >
        <Card style={styles.tileCard}>
          <Text style={styles.tileTitle}>Tạo khóa học mới</Text>
          <Text style={styles.tileHint}>Tạo khóa học, cấu hình thông tin cơ bản</Text>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate(ROUTES.INSTRUCTOR_ANALYTICS)}
      >
        <Card style={styles.tileCard}>
          <Text style={styles.tileTitle}>Course Analytics</Text>
          <Text style={styles.tileHint}>Biểu đồ completion, rating, top khoá</Text>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate(ROUTES.INSTRUCTOR_DISCUSSIONS)}
      >
        <Card style={styles.tileCard}>
          <Text style={styles.tileTitle}>Discussion Management</Text>
          <Text style={styles.tileHint}>Quản lý thảo luận, pin/unpin, xoá nội dung</Text>
        </Card>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING[6],
    paddingTop: 0,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[3],
  },
  headerCard: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: SPACING[5],
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: SPACING[6],
    marginHorizontal: -SPACING[6],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textInverse,
    fontWeight: '800',
  },
  headerTextWrap: {
    marginLeft: SPACING[3],
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerHello: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '700',
  },
  headerEmail: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '800',
  },
  vipBadge: {
    marginLeft: SPACING[2],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  vipLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textInverse,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.textInverse,
  },
  searchBar: {
    marginTop: SPACING[3],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: SPACING[4],
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchPlaceholder: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: SPACING[2],
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING[1],
  },
  tileCard: {
    marginTop: SPACING[3],
  },
  tileTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING[1],
  },
  tileHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});

