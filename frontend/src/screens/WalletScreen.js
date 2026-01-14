import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native';
import walletService from '../services/wallet';
import useAuthStore from '../state/useAuthStore';

const WalletScreen = () => {
  const { user, updateUser } = useAuthStore();
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const txs = await walletService.getTransactions();
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await walletService.topUp(amount);
      Alert.alert('Success', `Rs ${amount} added to wallet`);
      setTopUpAmount('');
      const balance = await walletService.getBalance();
      updateUser({ ...user, walletBalance: balance });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    const balance = await walletService.getBalance();
    updateUser({ ...user, walletBalance: balance });
    setRefreshing(false);
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionType}>{item.type.toUpperCase()}</Text>
        <Text style={styles.transactionAmount}>
          {item.type === 'topup' || item.type === 'refund' ? '+' : '-'}Rs {item.amount}
        </Text>
      </View>
      <Text style={styles.transactionDescription}>{item.description}</Text>
      <Text style={styles.transactionDate}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>Rs {user?.walletBalance || 0}</Text>
      </View>

      <View style={styles.topUpSection}>
        <Text style={styles.sectionTitle}>Top Up Wallet</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={topUpAmount}
          onChangeText={setTopUpAmount}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleTopUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Top Up</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions yet</Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold'
  },
  topUpSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  transactionsSection: {
    flex: 1,
    padding: 20
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  transactionDate: {
    fontSize: 10,
    color: '#999'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20
  }
});

export default WalletScreen;














