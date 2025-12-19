import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import packagesService from '../services/packages';
import { useRouter } from 'expo-router';

const SearchPackageScreen = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);

  const searchNow = async (value) => {
    const cleaned = value.trim().replace(/^#/, '');
    if (!cleaned) {
      setResult(null);
      setError('');
      return;
    }
    setLoading(true);
    try {
      const pkg = await packagesService.getByCode(cleaned.toUpperCase());
      setResult(pkg);
      setError('');
    } catch (err) {
      setResult(null);
      setError('Package not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce typing to reduce requests
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchNow(query);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const renderCard = () => {
    if (!result) return null;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/package-detail/${result._id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="cube-outline" size={20} color="#1D4ED8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{result.description || 'Package'}</Text>
            <Text style={styles.subTitle}>Small</Text>
          </View>
          <Text style={styles.price}>Rs {result.fee}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color="#6B7280" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>From:</Text>
          <Text style={styles.rowValue}>
            {result.origin?.city}, {result.origin?.address}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color="#6B7280" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>To:</Text>
          <Text style={styles.rowValue}>
            {result.destination?.city}, {result.destination?.address}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View
        style={[
          styles.searchBox,
          {
            borderColor: focused || query ? '#4A3AFF' : '#E5E7EB',
            borderWidth: focused || query ? 2 : 1
          }
        ]}
      >
        <Ionicons name="search-outline" size={18} color="#4A3AFF" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="#PKG123456..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => searchNow(query)}
        />
      </View>

      {loading ? <ActivityIndicator color="#4A3AFF" style={{ marginTop: 12 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {renderCard()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    flexGrow: 1
  },
  searchBox: {
    borderWidth: 2,
    borderColor: '#4A3AFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827'
  },
  error: {
    color: '#E53935',
    marginTop: 8,
    fontSize: 13
  },
  card: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  subTitle: {
    fontSize: 12,
    color: '#6B7280'
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  rowIcon: {
    marginRight: 6
  },
  rowLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4
  },
  rowValue: {
    fontSize: 12,
    color: '#111827',
    flexShrink: 1
  }
});

export default SearchPackageScreen;


