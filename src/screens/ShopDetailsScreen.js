import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Card, Avatar, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';

export default function ShopDetailsScreen({ route, navigation }) {
  const { shopId } = route.params;
  const theme = useTheme();
  const { shops, vehicles, transactions } = useAppContext();

  const shop = shops.find(s => s.id === shopId);
  const shopTransactions = transactions ? transactions.filter(t => t.shopId === shopId) : [];
  if (!shop) return <Text style={{ marginTop: 50, textAlign: 'center' }}>Shop not found</Text>;

  const vehicle = vehicles.find(v => v.id === shop.vehicleId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.primary, '#001D36']} style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <IconButton icon="arrow-left" iconColor="#fff" size={24} onPress={() => navigation.goBack()} style={{ margin: 0, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ color: '#fff', fontWeight: 'bold' }} numberOfLines={1}>{shop.name}</Text>
            <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }} numberOfLines={1}>
              {shop.area ? shop.area + ', ' : ''}{shop.place}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animatable.View animation="zoomIn" duration={600} style={styles.debtCardWrapper}>
          <Card style={styles.debtCard} elevation={5}>
            <LinearGradient colors={shop.currentBalance > 0 ? ['#FFDAD6', '#FFB4AB'] : ['#E8F5E9', '#C8E6C9']} style={styles.debtGradient}>
              <Text variant="labelLarge" style={{ color: shop.currentBalance > 0 ? '#BA1A1A' : '#2E7D32', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>
                Total Outstanding Debt
              </Text>
              <Text style={{ fontSize: 56, fontWeight: '900', color: shop.currentBalance > 0 ? '#410002' : '#1B5E20', marginVertical: 10 }}>
                ₹{shop.currentBalance}
              </Text>
              <Text variant="bodyMedium" style={{ color: shop.currentBalance > 0 ? '#BA1A1A' : '#2E7D32', fontWeight: 'bold' }}>
                Last Updated: {shop.orderDate || shop.lastTransactionDate}
              </Text>
            </LinearGradient>
          </Card>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" delay={300} style={styles.detailsContainer}>
          <Card style={styles.infoCard} elevation={2}>
            <Card.Title title="Shop Information" titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }} left={(props) => <Avatar.Icon {...props} icon="store" />} />
            <Card.Content>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Owner Name:</Text><Text style={styles.infoValue}>{shop.ownerName && shop.ownerName !== 'Unknown' ? shop.ownerName : 'N/A'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Mobile Number:</Text><Text style={styles.infoValue}>{shop.mobile || 'N/A'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Assigned Vehicle:</Text><Text style={styles.infoValue}>{vehicle?.name || 'Unknown'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Salesman:</Text><Text style={styles.infoValue}>{vehicle?.salesman || 'N/A'}</Text></View>
            </Card.Content>
          </Card>

          <Card style={[styles.infoCard, { marginTop: 16 }]} elevation={2}>
            <Card.Title title="Transaction History" titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }} left={(props) => <Avatar.Icon {...props} icon="history" style={{ backgroundColor: '#E3F2FD' }} color="#1976D2" />} />
            <Card.Content>
              {shopTransactions.length === 0 ? (
                <Text style={{ textAlign: 'center', color: 'gray', paddingVertical: 10 }}>No transactions recorded yet.</Text>
              ) : (
                shopTransactions.map((t, index) => (
                  <View key={t.id} style={[styles.transactionItem, index === shopTransactions.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                    <View style={styles.transactionIconContainer}>
                      <Avatar.Icon size={40} icon={t.type === 'debt' ? 'arrow-up' : 'arrow-down'} style={{ backgroundColor: t.type === 'debt' ? '#FFDAD6' : '#E8F5E9' }} color={t.type === 'debt' ? '#BA1A1A' : '#2E7D32'} />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 16 }}>{t.type === 'debt' ? 'Debt Given' : 'Payment Received'}</Text>
                      <Text style={{ color: 'gray', fontSize: 13, marginTop: 2 }}>{t.date} • Mode: <Text style={{ fontWeight: 'bold' }}>{t.mode}</Text></Text>
                    </View>
                    <View style={styles.transactionAmounts}>
                      <Text style={{ fontWeight: '900', fontSize: 16, color: t.type === 'debt' ? '#BA1A1A' : '#2E7D32' }}>
                        {t.type === 'debt' ? '+' : '-'}₹{t.amount}
                      </Text>
                      <Text style={{ color: '#555', fontSize: 12, marginTop: 2, fontWeight: 'bold' }}>Rem: ₹{t.balanceAfter}</Text>
                    </View>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  debtCardWrapper: { marginTop: -16, marginBottom: 16 },
  debtCard: { borderRadius: 24, overflow: 'hidden' },
  debtGradient: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  detailsContainer: { marginTop: 8 },
  infoCard: { borderRadius: 16, backgroundColor: '#fff', marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  infoLabel: { color: 'gray', fontWeight: 'bold' },
  infoValue: { color: '#333', fontWeight: 'bold' },
  transactionItem: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  transactionIconContainer: { marginRight: 16 },
  transactionDetails: { flex: 1 },
  transactionAmounts: { alignItems: 'flex-end' },
  button: { borderRadius: 12, paddingVertical: 6 }
});
