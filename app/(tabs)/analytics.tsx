import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES, CategoryType } from '@/src/domain/models';
import { useStore } from '@/src/store/useStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    eachDayOfInterval,
    eachMonthOfInterval,
    eachWeekOfInterval,
    endOfDay,
    endOfMonth,
    endOfWeek,
    format,
    isWithinInterval,
    startOfDay,
    subDays,
    subMonths
} from 'date-fns';
import { useMemo, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

type DateRangeType = 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'LAST_14' | 'LAST_21' | 'LAST_MONTH' | 'CUSTOM';
type GroupByType = 'DAY' | 'WEEK' | 'MONTH';
type ChartType = 'BAR' | 'LINE';

const DATE_RANGES: { label: string; value: DateRangeType }[] = [
    { label: 'Today', value: 'TODAY' },
    { label: 'Yesterday', value: 'YESTERDAY' },
    { label: 'Last 7 Days', value: 'LAST_7' },
    { label: 'Last 14 Days', value: 'LAST_14' },
    { label: 'Last 21 Days', value: 'LAST_21' },
    { label: 'Last Month', value: 'LAST_MONTH' },
    { label: 'Custom Range', value: 'CUSTOM' },
];

export default function AnalyticsScreen() {
    const { entries } = useStore();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // State
    const [category, setCategory] = useState<CategoryType>(CATEGORIES[0].id);
    const [dateRangeType, setDateRangeType] = useState<DateRangeType>('TODAY');
    const [customStart, setCustomStart] = useState(new Date());
    const [customEnd, setCustomEnd] = useState(new Date());
    const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]); // Empty = All
    const [groupBy, setGroupBy] = useState<GroupByType>('DAY');
    const [chartType, setChartType] = useState<ChartType>('BAR');

    // Controls Visibility State
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);

    // --- Filtering Logic ---

    // 1. Resolve Date Range
    const { start, end } = useMemo(() => {
        const today = new Date();
        switch (dateRangeType) {
            case 'TODAY': return { start: startOfDay(today), end: endOfDay(today) };
            case 'YESTERDAY': return { start: startOfDay(subDays(today, 1)), end: endOfDay(subDays(today, 1)) };
            case 'LAST_7': return { start: startOfDay(subDays(today, 6)), end: endOfDay(today) };
            case 'LAST_14': return { start: startOfDay(subDays(today, 13)), end: endOfDay(today) };
            case 'LAST_21': return { start: startOfDay(subDays(today, 20)), end: endOfDay(today) };
            case 'LAST_MONTH': return { start: startOfDay(subMonths(today, 1)), end: endOfDay(today) };
            case 'CUSTOM': return { start: startOfDay(customStart), end: endOfDay(customEnd) };
        }
    }, [dateRangeType, customStart, customEnd]); // Added dependencies

    // 2. Filter Store Entries
    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            // Category Filter
            if (e.category !== category) return false;

            // Date Filter
            if (!isWithinInterval(e.timestamp, { start, end })) return false;

            // Subtype Filter
            if (selectedSubtypes.length > 0) {
                const type = e.subtype || 'Other';
                if (!selectedSubtypes.includes(type)) return false;
            }

            return true;
        });
    }, [entries, category, start, end, selectedSubtypes]);

    // 3. Aggregate Data for Chart
    const chartData = useMemo(() => {
        let labels: string[] = [];
        let dataPoints: number[] = [];

        // Generate Time Buckets
        let intervalFn;
        let formatStr = 'd';

        if (groupBy === 'DAY') {
            // Prevent huge arrays if range is large, strictly speaking we should safeguard
            intervalFn = eachDayOfInterval;
            formatStr = 'dd/MM';
        } else if (groupBy === 'WEEK') {
            intervalFn = eachWeekOfInterval;
            formatStr = 'dd MMM';
        } else {
            formatStr = 'MMM';
        }

        try {
            let labels: string[] = [];
            let dataPoints: number[] = [];

            if (groupBy === 'DAY') {
                const intervals = eachDayOfInterval({ start, end });
                labels = intervals.map((d: Date) => format(d, formatStr));
                dataPoints = intervals.map((intervalStart: Date) => {
                    const intervalEnd = endOfDay(intervalStart);
                    return filteredEntries.filter(e => isWithinInterval(e.timestamp, { start: intervalStart, end: intervalEnd })).length;
                });
            } else if (groupBy === 'WEEK') {
                const intervals = eachWeekOfInterval({ start, end });
                labels = intervals.map((d: Date) => format(d, formatStr));
                dataPoints = intervals.map((intervalStart: Date) => {
                    const intervalEnd = endOfWeek(intervalStart);
                    return filteredEntries.filter(e => isWithinInterval(e.timestamp, { start: intervalStart, end: intervalEnd })).length;
                });
            } else {
                const intervals = eachMonthOfInterval({ start, end });
                labels = intervals.map((d: Date) => format(d, formatStr));
                dataPoints = intervals.map((intervalStart: Date) => {
                    const intervalEnd = endOfMonth(intervalStart);
                    return filteredEntries.filter(e => isWithinInterval(e.timestamp, { start: intervalStart, end: intervalEnd })).length;
                });
            }

            return {
                labels,
                datasets: [{ data: dataPoints }]
            };

        } catch (e) {
            return { labels: [], datasets: [{ data: [] }] };
        }
    }, [filteredEntries, groupBy, start, end]);


    // Helpers
    const currentCategory = CATEGORIES.find(c => c.id === category);
    const availableSubtypes = currentCategory?.subtypes || [];

    const toggleSubtype = (s: string) => {
        if (selectedSubtypes.includes(s)) {
            setSelectedSubtypes(prev => prev.filter(i => i !== s));
        } else {
            setSelectedSubtypes(prev => [...prev, s]);
        }
    };

    const getChartConfig = () => ({
        backgroundGradientFrom: theme.card,
        backgroundGradientTo: theme.card,
        color: (opacity = 1) => theme.primary,
        labelColor: (opacity = 1) => theme.textSecondary,
        strokeWidth: 2,
        barPercentage: 0.6,
        decimalPlaces: 0,
        propsForBackgroundLines: { stroke: theme.border, strokeDasharray: "0" },
        propsForLabels: { fontSize: 10 }
    });

    // Helper to seed data
    const seedData = async () => {
        const { addEntry } = useStore.getState();
        const now = new Date();

        // Generate 50 random entries
        for (let i = 0; i < 50; i++) {
            // Random date within last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const timestamp = subDays(now, daysAgo).getTime();

            // Random Category
            const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

            // Random Subtype
            const subtype = cat.subtypes ? cat.subtypes[Math.floor(Math.random() * cat.subtypes.length)] : undefined;

            await addEntry({
                id: Math.random().toString(36).substr(2, 9),
                category: cat.id,
                subtype: subtype,
                timestamp: timestamp,
                createdAt: Date.now(),
                value: Math.floor(Math.random() * 100), // Random value
                notes: 'Sample entry'
            });
        }
        Alert.alert("Success", "Added 50 sample entries!");
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={[styles.title, { color: theme.text, marginBottom: 0 }]}>Weekly Overview</Text>
                <Pressable onPress={seedData} style={{ padding: 8 }}>
                    <FontAwesome name="database" size={20} color={theme.primary} />
                </Pressable>
            </View>

            {/* 1. Category Selector */}
            <View style={styles.section}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
                <Pressable
                    style={[styles.dropdownTrigger, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>{currentCategory?.label}</Text>
                    <FontAwesome name="chevron-down" size={12} color={theme.textSecondary} />
                </Pressable>
            </View>

            {/* 2. Date Range Selector */}
            <View style={styles.section}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Date Range</Text>
                <Pressable
                    style={[styles.dropdownTrigger, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => setShowDateModal(true)}
                >
                    <Text style={[styles.dropdownText, { color: theme.text }]}>
                        {DATE_RANGES.find(d => d.value === dateRangeType)?.label}
                        {dateRangeType !== 'CUSTOM' ? ` (${format(start, 'MMM d')})` : ''}
                    </Text>
                    <FontAwesome name="calendar" size={12} color={theme.textSecondary} />
                </Pressable>
            </View>

            {/* 3. Subtypes Multi-Select */}
            {availableSubtypes.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Type Filter</Text>
                        <Pressable onPress={() => setSelectedSubtypes([])}>
                            <Text style={{ color: theme.primary, fontSize: 12 }}>{selectedSubtypes.length === 0 ? 'All Selected' : 'Clear Filter'}</Text>
                        </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                        {availableSubtypes.map(sub => {
                            const isSelected = selectedSubtypes.includes(sub);
                            return (
                                <Pressable
                                    key={sub}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: isSelected ? theme.primary : theme.card, borderColor: isSelected ? theme.primary : theme.border, borderWidth: 1 }
                                    ]}
                                    onPress={() => toggleSubtype(sub)}
                                >
                                    <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.text }]}>{sub}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* 4. Chart & Customization */}
            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                <View style={styles.chartHeader}>
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Count vs Date</Text>

                    {/* Chart Toggles */}
                    <View style={styles.toggleRow}>
                        {/* Chart Type */}
                        <View style={[styles.toggleGroup, { borderColor: theme.border }]}>
                            <Pressable onPress={() => setChartType('BAR')} style={[styles.toggleBtn, chartType === 'BAR' && { backgroundColor: theme.primary }]}>
                                <FontAwesome name="bar-chart" size={12} color={chartType === 'BAR' ? '#fff' : theme.textSecondary} />
                            </Pressable>
                            <Pressable onPress={() => setChartType('LINE')} style={[styles.toggleBtn, chartType === 'LINE' && { backgroundColor: theme.primary }]}>
                                <FontAwesome name="line-chart" size={12} color={chartType === 'LINE' ? '#fff' : theme.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Group By */}
                        <View style={[styles.toggleGroup, { borderColor: theme.border }]}>
                            {(['DAY', 'WEEK', 'MONTH'] as const).map(g => (
                                <Pressable
                                    key={g}
                                    onPress={() => setGroupBy(g)}
                                    style={[styles.toggleBtnText, groupBy === g && { backgroundColor: theme.primary }]}
                                >
                                    <Text style={{ fontSize: 10, color: groupBy === g ? '#fff' : theme.textSecondary }}>{g[0]}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                {chartData.datasets[0].data.length > 0 && !chartData.datasets[0].data.every(d => d === 0) ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {chartType === 'BAR' ? (
                            <BarChart
                                data={chartData}
                                width={Math.max(screenWidth - 60, chartData.labels.length * 40)}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={getChartConfig()}
                                verticalLabelRotation={30}
                                fromZero
                                showValuesOnTopOfBars
                                style={{ paddingRight: 40 }}
                            />
                        ) : (
                            <LineChart
                                data={chartData}
                                width={Math.max(screenWidth - 60, chartData.labels.length * 40)}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={getChartConfig()}
                                verticalLabelRotation={30}
                                fromZero
                                bezier
                                style={{ paddingRight: 40 }}
                            />
                        )}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyChart}>
                        <Text style={{ color: theme.textSecondary }}>No data for current filters.</Text>
                    </View>
                )}
            </View>

            {/* --- MODALS --- */}

            {/* Category Modal */}
            <Modal visible={showCategoryModal} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
                        {CATEGORIES.map(c => (
                            <Pressable
                                key={c.id}
                                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                                onPress={() => { setCategory(c.id); setSelectedSubtypes([]); setShowCategoryModal(false); }}
                            >
                                <Text style={[styles.modalItemText, { color: category === c.id ? theme.primary : theme.text }]}>{c.label}</Text>
                                {category === c.id && <FontAwesome name="check" color={theme.primary} />}
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </Modal>

            {/* Date Range Modal */}
            <Modal visible={showDateModal} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setShowDateModal(false)}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Select Range</Text>
                        {DATE_RANGES.map(d => (
                            <Pressable
                                key={d.value}
                                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                                onPress={() => {
                                    setDateRangeType(d.value);
                                    if (d.value !== 'CUSTOM') setShowDateModal(false);
                                }}
                            >
                                <Text style={[styles.modalItemText, { color: dateRangeType === d.value ? theme.primary : theme.text }]}>{d.label}</Text>
                                {dateRangeType === d.value && <FontAwesome name="check" color={theme.primary} />}
                            </Pressable>
                        ))}

                        {dateRangeType === 'CUSTOM' && (
                            <View style={styles.customDateContainer}>
                                <View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Start</Text>
                                    {Platform.OS === 'ios' ? (
                                        <DateTimePicker value={customStart} mode="date" display="compact" onChange={(e: any, d?: Date) => d && setCustomStart(d)} />
                                    ) : (
                                        // Android simplified for brevity, in real app needs button to trigger picker
                                        <Text style={{ color: theme.primary }}>{format(customStart, 'MM/dd/yyyy')}</Text>
                                    )}
                                </View>
                                <View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>End</Text>
                                    {Platform.OS === 'ios' ? (
                                        <DateTimePicker value={customEnd} mode="date" display="compact" onChange={(e: any, d?: Date) => d && setCustomEnd(d)} />
                                    ) : (
                                        <Text style={{ color: theme.primary }}>{format(customEnd, 'MM/dd/yyyy')}</Text>
                                    )}
                                </View>
                                <Pressable
                                    style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                                    onPress={() => setShowDateModal(false)}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </Pressable>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    section: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    dropdownTrigger: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, borderRadius: 8, borderWidth: 1,
    },
    dropdownText: { fontSize: 16, fontWeight: '500' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    chipContainer: { flexDirection: 'row', gap: 8, paddingBottom: 5 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    chipText: { fontSize: 14, fontWeight: '500' },

    chartCard: {
        borderRadius: 16, padding: 15, marginBottom: 50,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3
    },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    chartTitle: { fontSize: 16, fontWeight: 'bold' },
    toggleRow: { flexDirection: 'row', gap: 10 },
    toggleGroup: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
    toggleBtn: { padding: 6, width: 32, alignItems: 'center' },
    toggleBtnText: { paddingVertical: 6, paddingHorizontal: 10 },
    emptyChart: { height: 200, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
    modalItemText: { fontSize: 16 },
    customDateContainer: { marginTop: 20, gap: 15, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10 },
    applyBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
});
