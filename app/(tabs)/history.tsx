import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CategoryType, Entry } from '@/src/domain/models';
import { useStore } from '@/src/store/useStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, SectionList, SectionList as SectionListType, StyleSheet, Text, View } from 'react-native'; // Added Alert

const CATEGORY_ICONS: Record<CategoryType, string> = {
    FOOD: 'cutlery',
    FITNESS: 'heartbeat',
    CONSUMPTION: 'glass',
    NOTE: 'sticky-note',
};

export default function HistoryScreen() {
    const { entries } = useStore();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Date Navigation State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const sectionListRef = useRef<SectionListType<Entry>>(null);

    const groupedEntries = entries.reduce((acc: { [key: string]: Entry[] }, entry) => {
        const date = format(entry.timestamp, 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {});

    const sections = Object.keys(groupedEntries)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map(date => ({
            title: format(new Date(date), 'MMM d, yyyy (EEE)'),
            dateStr: date, // Keep raw date string for lookup
            data: groupedEntries[date].sort((a, b) => b.timestamp - a.timestamp),
        }));

    const jumpToDate = (date: Date) => {
        setSelectedDate(date);
        const dateStr = format(date, 'yyyy-MM-dd');
        const sectionIndex = sections.findIndex(s => s.dateStr === dateStr);

        if (sectionIndex !== -1) {
            setTimeout(() => {
                sectionListRef.current?.scrollToLocation({
                    sectionIndex,
                    itemIndex: 0,
                    animated: true,
                    viewOffset: 20
                });
            }, 100);
        } else {
            Alert.alert("No entries", `No entries found for ${format(date, 'MMM d, yyyy')}`);
        }

        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }
    };

    const onDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) {
            if (Platform.OS === 'ios') setSelectedDate(date);
            else jumpToDate(date); // On Android jump immediately
        }
    };

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
                <View style={styles.cardLeftStrip}><View style={{ backgroundColor: catColor, flex: 1, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }} /></View>
                <View style={styles.cardContent}>
                    <View style={styles.row}>
                        <View style={styles.catRow}>
                            {/* @ts-ignore */}
                            <FontAwesome name={CATEGORY_ICONS[item.category]} size={14} color={catColor} style={{ marginRight: 6 }} />
                            <Text style={[styles.category, { color: theme.text }]}>
                                {item.subtype || item.category}
                            </Text>
                        </View>
                        <Text style={[styles.time, { color: theme.textSecondary }]}>{format(item.timestamp, 'h:mm a')}</Text>
                    </View>
                    {(item.value || item.notes) && (
                        <View style={[styles.details, { borderTopColor: theme.border }]}>
                            {item.value && <Text style={[styles.value, { color: theme.textSecondary }]}>{item.value}</Text>}
                            {item.notes && <Text style={[styles.notes, { color: theme.textSecondary }]} numberOfLines={2}>{item.notes}</Text>}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Date Navigation Header */}
            <View style={styles.navHeader}>
                {Platform.OS === 'ios' && showDatePicker ? (
                    <View style={styles.iosPickerRow}>
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="compact"
                            onChange={onDateChange}
                        />
                        <Pressable onPress={() => { jumpToDate(selectedDate); setShowDatePicker(false); }} style={[styles.goBtn, { backgroundColor: theme.primary }]}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go</Text>
                        </Pressable>
                        <Pressable onPress={() => setShowDatePicker(false)} style={styles.cancelBtn}>
                            <FontAwesome name="close" size={20} color={theme.textSecondary} />
                        </Pressable>
                    </View>
                ) : (
                    <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: theme.primary, fontSize: 14 }}>Jump to Date</Text>
                            <FontAwesome name="calendar" size={16} color={theme.primary} />
                        </View>
                    </Pressable>
                )}

                {/* Android Picker */}
                {Platform.OS === 'android' && showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}
            </View>

            <SectionList
                ref={sectionListRef}
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={[styles.headerContainer, { backgroundColor: theme.background }]}>
                        <Text style={[styles.header, { color: theme.textSecondary }]}>{title}</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled
                showsVerticalScrollIndicator={false}
                // Improve scrolling reliability
                getItemLayout={(data, index) => ({ length: 120, offset: 120 * index, index })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    navHeader: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        marginBottom: 10,
    },
    dateTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    iosPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Changed to between
        width: '100%',
    },
    goBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 15,
        marginLeft: 10,
    },
    cancelBtn: {
        padding: 8,
        marginLeft: 10,
    },
    listContent: {
        paddingBottom: 20,
        gap: 12,
    },
    headerContainer: {
        paddingVertical: 10,
        marginTop: 10,
    },
    header: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 4,
    },
    cardLeftStrip: {
        width: 6,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    category: {
        fontWeight: '600',
        fontSize: 15,
    },
    time: {
        fontSize: 12,
    },
    details: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0', // overridden by theme
        gap: 4,
    },
    value: {
        fontSize: 13,
        fontWeight: '500',
    },
    notes: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});
