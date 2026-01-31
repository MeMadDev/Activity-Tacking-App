import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CategoryType, Entry } from '@/src/domain/models';
import { useStore } from '@/src/store/useStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { endOfDay, format, isWithinInterval, startOfDay } from 'date-fns';
import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const CATEGORY_ICONS: Record<CategoryType, string> = {
  FOOD: 'cutlery',
  FITNESS: 'heartbeat',
  CONSUMPTION: 'glass',
  NOTE: 'sticky-note',
};

export default function HomeScreen() {
  const { entries, loadEntries, isLoading } = useStore();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadEntries();
  }, []);

  const todayEntries = entries.filter(e =>
    isWithinInterval(e.timestamp, {
      start: startOfDay(new Date()),
      end: endOfDay(new Date())
    })
  );

  const getCategoryColor = (cat: CategoryType) => {
    switch (cat) {
      case 'FOOD': return theme.food;
      case 'FITNESS': return theme.fitness;
      case 'CONSUMPTION': return theme.consumption;
      case 'NOTE': return theme.note;
      default: return theme.tint;
    }
  };

  const renderItem = ({ item }: { item: Entry }) => {
    const catColor = getCategoryColor(item.category);

    return (
      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
        <View style={styles.cardLeftStrip}><View style={{ backgroundColor: catColor, flex: 1, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} /></View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryRow}>
              <View style={[styles.iconContainer, { backgroundColor: catColor + '20' }]}>
                {/* @ts-ignore */}
                <FontAwesome name={CATEGORY_ICONS[item.category]} size={16} color={catColor} />
              </View>
              <Text style={[styles.category, { color: theme.text }]}>{item.category}</Text>
            </View>
            <Text style={[styles.time, { color: theme.textSecondary }]}>{format(item.timestamp, 'h:mm a')}</Text>
          </View>

          <Text style={[styles.subtype, { color: theme.text }]}>
            {item.subtype || item.category}
          </Text>

          {(item.value || item.notes) && (
            <View style={styles.detailsContainer}>
              {item.value && <Text style={[styles.value, { color: theme.textSecondary }]}>{item.value}</Text>}
              {item.notes && <Text style={[styles.notes, { color: theme.textSecondary }]} numberOfLines={2}>{item.notes}</Text>}
            </View>
          )}
        </View>
      </View>
    );
  }

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.greeting, { color: theme.textSecondary }]}>Today's Overview</Text>
      <Text style={[styles.title, { color: theme.text }]}>
        You have <Text style={{ color: theme.primary }}>{todayEntries.length}</Text> entries today.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.text }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={todayEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="calendar-check-o" size={50} color={theme.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No entries yet. Start tracking!</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 100, // Space for FAB or just safer scrolling
  },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 80,
  },
  cardLeftStrip: {
    width: 6,
    borderTopLeftRadius: 12, // Redundant but explicit
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  category: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  subtype: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsContainer: {
    marginTop: 4,
    gap: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  notes: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
  },
});
