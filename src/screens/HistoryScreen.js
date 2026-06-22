import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Surface } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';

export default function HistoryScreen() {
  const theme = useTheme();
  const { vehicles, shops, transactions } = useAppContext();
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const formatDate = (dateObj) => {
    if (!dateObj) return null;
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const onConfirmDate = (params) => {
    setDatePickerOpen(false);
    setDateFilter(formatDate(params.date));
  };

  // 1. Get payments
  const payments = transactions.filter(t => t.type === 'payment');

  // 2. Filter by Salesman & Date
  const filteredPayments = payments.filter(payment => {
    if (dateFilter && payment.date !== dateFilter) return false;
    if (selectedVehicle) {
      const shop = shops.find(s => s.id === payment.shopId);
      if (!shop || shop.vehicleId !== selectedVehicle) return false;
    }
    return true;
  });

  // 3. Group by Date
  const groupedByDate = filteredPayments.reduce((acc, payment) => {
    const date = payment.date || 'Unknown Date';
    if (!acc[date]) {
      acc[date] = { total: 0, items: [] };
    }
    const shop = shops.find(s => s.id === payment.shopId);
    acc[date].total += Number(payment.amount);
    acc[date].items.push({
      ...payment,
      shopName: shop ? shop.name : 'Unknown Shop',
      shopPlace: shop ? shop.place : ''
    });
    return acc;
  }, {});

  // Convert to array for rendering
  const datesArray = Object.keys(groupedByDate).sort((a, b) => {
    // Sort logic (assuming DD-MM-YYYY)
    const parseDate = (dStr) => {
      if(!dStr || dStr === 'Unknown Date') return 0;
      const [d, m, y] = dStr.split('-');
      return new Date(`${y}-${m}-${d}`).getTime();
    };
    return parseDate(b) - parseDate(a); // Newest first
  }).map(date => ({
    date,
    total: groupedByDate[date].total,
    items: groupedByDate[date].items
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ListHeaderComponent={
          <View>
            <LinearGradient colors={[theme.colors.primary, '#001D36']} style={styles.headerGradient}>
              <Animatable.View animation="fadeInDown" style={styles.headerContent}>
                <Text variant="headlineMedium" style={{ color: '#fff', fontWeight: 'bold' }}>Collection History</Text>
                <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.8)' }}>Track payments by date and salesman</Text>
              </Animatable.View>
            </LinearGradient>

            <View style={styles.filtersSection}>
              <Text style={styles.filterLabel}>Filters</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                <Chip 
                  icon="calendar" 
                  selected={!!dateFilter} 
                  onPress={() => setDatePickerOpen(true)} 
                  onClose={dateFilter ? () => setDateFilter(null) : undefined}
                  style={styles.chip} 
                  showSelectedOverlay
                >
                  {dateFilter ? `Date: ${dateFilter}` : 'Select Date'}
                </Chip>
                <Chip 
                  selected={selectedVehicle === null} 
                  onPress={() => setSelectedVehicle(null)} 
                  style={styles.chip}
                  showSelectedOverlay
                >
                  All Salesmen
                </Chip>
                {vehicles.map(v => (
                  <Chip 
                    key={v.id} 
                    selected={selectedVehicle === v.id} 
                    onPress={() => setSelectedVehicle(v.id)} 
                    style={styles.chip}
                    showSelectedOverlay
                  >
                    {v.salesman || v.name}
                  </Chip>
                ))}
              </ScrollView>
            </View>
            <View style={{ height: 16 }} />
          </View>
        }
        data={datesArray}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40, color: 'gray', marginHorizontal: 16 }}>No collections found.</Text>
        }
        renderItem={({ item, index }) => (
          <Animatable.View animation="fadeInUp" delay={index * 100}>
            <Card style={styles.dateCard} elevation={2}>
              <Card.Title 
                title={item.date} 
                titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }}
                subtitle={`Total Collected: ₹${item.total}`}
                subtitleStyle={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 15 }}
                left={(props) => <Avatar.Icon {...props} icon="calendar-check" color="#4CAF50" style={{ backgroundColor: '#E8F5E9' }}/>}
              />
              <Card.Content style={{ paddingHorizontal: 0, paddingTop: 8 }}>
                {item.items.map((payment, idx) => (
                  <View key={idx} style={[styles.paymentRow, idx !== item.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }}>{payment.shopName}</Text>
                      <Text variant="bodySmall" style={{ color: 'gray' }}>{payment.mode} • Balance left: ₹{payment.balanceAfter}</Text>
                    </View>
                    <Text style={{ fontWeight: '900', fontSize: 16, color: '#4CAF50', marginRight: 16 }}>
                      +₹{payment.amount}
                    </Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </Animatable.View>
        )}
      />

      <DatePickerModal
        locale="en-GB"
        mode="single"
        visible={datePickerOpen}
        onDismiss={() => setDatePickerOpen(false)}
        date={dateFilter ? new Date(dateFilter.split('-').reverse().join('-')) : new Date()}
        onConfirm={onConfirmDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { padding: 24, paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { alignItems: 'center' },
  filtersSection: { paddingBottom: 12, paddingTop: 16, backgroundColor: '#fff', elevation: 2 },
  filterLabel: { marginLeft: 16, marginBottom: 8, color: 'gray', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10 },
  chipScroll: { paddingHorizontal: 16 },
  chip: { marginRight: 8, borderRadius: 20 },
  listContent: { paddingBottom: 100 },
  dateCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }
});
