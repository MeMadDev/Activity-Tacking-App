import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { CATEGORIES, CategoryType } from '@/src/domain/models';
import { useStore } from '@/src/store/useStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const CATEGORY_ICONS: Record<CategoryType, string> = {
    FOOD: 'cutlery',
    FITNESS: 'heartbeat',
    CONSUMPTION: 'glass',
    NOTE: 'sticky-note',
};

export default function AddEntryScreen() {
    const router = useRouter();
    const { addEntry } = useStore();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [category, setCategory] = useState<CategoryType>(CATEGORIES[0].id);
    const [subtype, setSubtype] = useState<string>('');
    const [value, setValue] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get current category object
    const selectedCategory = CATEGORIES.find(c => c.id === category);

    const getCategoryColor = (cat: CategoryType) => {
        switch (cat) {
            case 'FOOD': return theme.food;
            case 'FITNESS': return theme.fitness;
            case 'CONSUMPTION': return theme.consumption;
            case 'NOTE': return theme.note;
            default: return theme.tint;
        }
    };

    const handleSave = async () => {
        if (!category) return;

        setIsSubmitting(true);
        try {
            await addEntry({
                id: Math.random().toString(36).substr(2, 9),
                category,
                subtype: subtype || selectedCategory?.subtypes?.[0] || 'Entry',
                value: value || undefined,
                notes: notes || undefined,
                timestamp: Date.now(),
                createdAt: Date.now(),
            });
            router.back();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Select Category</Text>
                    <View style={styles.gridContainer}>
                        {CATEGORIES.map((c) => {
                            const isActive = category === c.id;
                            const activeColor = getCategoryColor(c.id);
                            return (
                                <Pressable
                                    key={c.id}
                                    style={({ pressed }) => [
                                        styles.categoryCard,
                                        { backgroundColor: theme.card, borderColor: isActive ? activeColor : 'transparent', borderWidth: 2 },
                                        isActive && { shadowColor: activeColor, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
                                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                                    ]}
                                    onPress={() => {
                                        setCategory(c.id);
                                        setSubtype('');
                                    }}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: isActive ? activeColor : theme.background }]}>
                                        {/* @ts-ignore */}
                                        <FontAwesome name={CATEGORY_ICONS[c.id]} size={24} color={isActive ? '#fff' : theme.textSecondary} />
                                    </View>
                                    <Text style={[
                                        styles.categoryText,
                                        { color: isActive ? activeColor : theme.text }
                                    ]}>{c.label}</Text>
                                </Pressable>
                            )
                        })}
                    </View>

                    {/* Subtype Selection */}
                    {selectedCategory?.subtypes && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>What type?</Text>
                            <View style={styles.chipContainer}>
                                {selectedCategory.subtypes.map((s) => {
                                    const isActive = subtype === s;
                                    return (
                                        <Pressable
                                            key={s}
                                            style={[
                                                styles.chip,
                                                { backgroundColor: isActive ? getCategoryColor(category) : theme.card, borderColor: isActive ? 'transparent' : theme.border, borderWidth: 1 }
                                            ]}
                                            onPress={() => setSubtype(s)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                { color: isActive ? '#fff' : theme.text }
                                            ]}>{s}</Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                    )}

                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Detailed Name (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                                placeholder={category === 'NOTE' ? "Title" : "Specific item, e.g. 'Oatmeal'"}
                                placeholderTextColor={theme.textSecondary}
                                value={subtype}
                                onChangeText={setSubtype}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Value / Quantity</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                                placeholder="e.g. 500 kcal, 30 mins"
                                placeholderTextColor={theme.textSecondary}
                                value={value}
                                onChangeText={setValue}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Notes</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                                placeholder="Add details..."
                                placeholderTextColor={theme.textSecondary}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1, shadowColor: theme.primary, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 }
                        ]}
                        onPress={handleSave}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save Entry'}</Text>
                    </Pressable>

                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    categoryCard: {
        width: '48%', // Approx 2 columns
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        minHeight: 110,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryText: {
        fontWeight: '600',
        fontSize: 15,
    },
    section: {
        marginBottom: 24,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
    },
    chipText: {
        fontWeight: '600',
        fontSize: 14,
    },
    formSection: {
        gap: 16,
        marginBottom: 30,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
