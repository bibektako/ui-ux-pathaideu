import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import packagesService from '../services/packages';

const statusSteps = [
  { key: 'created', label: 'Request Created' },
  { key: 'picked_up', label: 'Package Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' }
];

const PackageStatusScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await packagesService.getById(String(id));
        setPkg(data);
      } catch (error) {
        console.error('Failed to load package', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const getTrackId = () => pkg?.code || `PKG${(pkg?._id || '').slice(-6).toUpperCase()}`;

  const isStepCompleted = (stepKey) => {
    if (!pkg) return false;
    if (stepKey === 'created') return true;
    if (stepKey === 'picked_up') {
      return ['picked_up', 'in_transit', 'delivered'].includes(pkg.status);
    }
    if (stepKey === 'in_transit') {
      return ['in_transit', 'delivered'].includes(pkg.status);
    }
    if (stepKey === 'delivered') {
      return pkg.status === 'delivered';
    }
    return false;
  };

  const getTimeForStep = (stepKey) => {
    if (!pkg) return '';
    let date: Date | null = null;
    if (stepKey === 'created') date = pkg.createdAt ? new Date(pkg.createdAt) : null;
    if (stepKey === 'picked_up') date = pkg.pickedUpAt ? new Date(pkg.pickedUpAt) : null;
    if (stepKey === 'in_transit') return pkg.status === 'in_transit' ? 'In progress' : '';
    if (stepKey === 'delivered') date = pkg.deliveredAt ? new Date(pkg.deliveredAt) : null;
    return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  if (!pkg) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Package not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Package Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="cube-outline" size={18} color="#111827" style={styles.cardHeaderIcon} />
          <Text style={styles.cardHeaderTitle}>Package Details</Text>
        </View>
        <Text style={styles.trackId}>Track ID: #{getTrackId()}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>From:</Text>
          <Text style={styles.detailValue}>
            {pkg.origin?.city}, {pkg.origin?.address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>To:</Text>
          <Text style={styles.detailValue}>
            {pkg.destination?.city}, {pkg.destination?.address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Item:</Text>
          <Text style={styles.detailValue}>{pkg.description || 'Package'}</Text>
        </View>

        <View style={styles.partyRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Sender</Text>
            <Text style={styles.partyValue}>{pkg.senderId?.name || 'N/A'}</Text>
            <Text style={styles.partySub}>{pkg.senderId?.phone || ''}</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Delivered By</Text>
            <Text style={styles.partyValue}>{pkg.travellerId?.name || 'Not assigned'}</Text>
            <Text style={styles.partySub}>{pkg.travellerId?.phone || ''}</Text>
          </View>
        </View>
      </View>

      {/* Delivery Status Timeline */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery Status</Text>
        <View style={styles.timeline}>
          {statusSteps.map((step, index) => {
            const completed = isStepCompleted(step.key);
            const isLast = index === statusSteps.length - 1;
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineIndicator}>
                  <View
                    style={[
                      styles.circle,
                      completed ? styles.circleCompleted : styles.circlePending
                    ]}
                  />
                  {!isLast && (
                    <View
                      style={[
                        styles.line,
                        isStepCompleted(statusSteps[index + 1].key)
                          ? styles.lineCompleted
                          : styles.linePending
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      completed && styles.stepTitleCompleted
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text style={styles.stepTime}>{getTimeForStep(step.key)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* View Full History / Extra actions */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => {
          // Placeholder: bring user back to home or history list
          router.back();
        }}
      >
        <Text style={styles.historyButtonText}>View Full History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB'
  },
  errorText: {
    fontSize: 14,
    color: '#C62828'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  cardHeaderIcon: {
    marginRight: 6
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827'
  },
  trackId: {
    fontSize: 12,
    color: '#6C7A89',
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  detailLabel: {
    fontSize: 13,
    color: '#6C7A89'
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    flexShrink: 1,
    textAlign: 'right'
  },
  partyRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12
  },
  partyBlock: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  partyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  partyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  partySub: {
    fontSize: 12,
    color: '#6B7280'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  timeline: {
    paddingLeft: 4
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  timelineIndicator: {
    width: 32,
    alignItems: 'center'
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B0BEC5',
    backgroundColor: '#FFFFFF'
  },
  circleCompleted: {
    borderColor: '#00C853',
    backgroundColor: '#E8F5E9'
  },
  circlePending: {
    borderColor: '#CFD8DC',
    backgroundColor: '#FFFFFF'
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2
  },
  lineCompleted: {
    backgroundColor: '#00C853'
  },
  linePending: {
    backgroundColor: '#E0E0E0'
  },
  timelineContent: {
    flex: 1
  },
  stepTitle: {
    fontSize: 14,
    color: '#6C7A89',
    marginBottom: 2
  },
  stepTitleCompleted: {
    color: '#111827',
    fontWeight: '600'
  },
  stepTime: {
    fontSize: 12,
    color: '#9AA5B1'
  },
  historyButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  historyButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500'
  }
});

export default PackageStatusScreen;


