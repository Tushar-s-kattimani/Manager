import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Card, Avatar, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';

export default function DashboardScreen({ setIsAuthenticated }) {
  const theme = useTheme();
  const { shops, vehicles } = useAppContext();

  const salesmanData = vehicles.map(vehicle => {
    const assignedShops = shops.filter(s => s.vehicleId === vehicle.id);
    const totalDebt = assignedShops.reduce((sum, shop) => sum + shop.currentBalance, 0);
    return {
      ...vehicle,
      totalDebt
    };
  }).sort((a, b) => b.totalDebt - a.totalDebt);

  const getTodayDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const todayDate = getTodayDate();
  const tomorrowDate = getTomorrowDate();

  const dueTodayData = vehicles.map(vehicle => {
    const assignedShops = shops.filter(s => s.vehicleId === vehicle.id && s.lastTransactionDate === todayDate && s.currentBalance > 0);
    const dueAmount = assignedShops.reduce((sum, shop) => sum + shop.currentBalance, 0);
    return {
      ...vehicle,
      assignedShops,
      dueAmount
    };
  }).filter(v => v.dueAmount > 0);

  const dueTomorrowData = vehicles.map(vehicle => {
    const assignedShops = shops.filter(s => s.vehicleId === vehicle.id && s.lastTransactionDate === tomorrowDate && s.currentBalance > 0);
    const dueAmount = assignedShops.reduce((sum, shop) => sum + shop.currentBalance, 0);
    return {
      ...vehicle,
      assignedShops,
      dueAmount
    };
  }).filter(v => v.dueAmount > 0);

  const totalOutstanding = shops.reduce((sum, s) => sum + s.currentBalance, 0);
  const pendingShops = shops.filter(s => s.currentBalance > 0).length;
  
  const todaysCollection = shops
    .filter(s => s.lastPaymentDate === todayDate)
    .reduce((sum, s) => sum + (Number(s.lastPaymentAmount) || 0), 0);

  const todaysCredit = shops
    .filter(s => s.orderDate === todayDate)
    .reduce((sum, s) => {
      let original = Number(s.currentBalance) || 0;
      if (s.lastPaymentDate === todayDate) {
        original += (Number(s.lastPaymentAmount) || 0);
      }
      return sum + original;
    }, 0);

  const stats = [
    { title: 'Total Outstanding', value: `₹${totalOutstanding}`, icon: 'currency-inr', color: theme.colors.primary },
    { title: "Today's Collection", value: `₹${todaysCollection}`, icon: 'cash-register', color: '#4CAF50' },
    { title: "Today's Credit", value: `₹${todaysCredit}`, icon: 'credit-card-outline', color: theme.colors.secondary },
    { title: 'Pending Shops', value: pendingShops.toString(), icon: 'store-alert', color: '#FF9800' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.primary, '#001D36']} style={styles.headerGradient}>
        <Animatable.View animation="fadeInDown" style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="headlineLarge" style={{ color: '#fff', fontWeight: 'bold' }}>Dashboard</Text>
              <IconButton icon="logout" iconColor="#fff" size={24} onPress={() => setIsAuthenticated(false)} style={{ margin: 0, marginLeft: 4 }} />
            </View>
            <Text variant="bodyLarge" style={{ color: 'rgba(255,255,255,0.8)' }}>Overview of your agency</Text>
          </View>
          <View style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 16 }}>
            <Avatar.Icon size={46} icon="shield-account" style={{ backgroundColor: '#fff' }} color={theme.colors.primary} />
            <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 6 }}>Admin</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 'bold' }}>9448860040</Text>
          </View>
        </Animatable.View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <Animatable.View 
            key={index} 
            animation="zoomIn" 
            delay={index * 150} 
            style={styles.statWrapper}
          >
            <Surface style={styles.statCard} elevation={3}>
              <View style={[styles.iconContainer, { backgroundColor: stat.color + '15' }]}>
                <Avatar.Icon size={46} icon={stat.icon} style={{ backgroundColor: 'transparent' }} color={stat.color} />
              </View>
              <Text variant="headlineSmall" style={styles.statValue}>{stat.value}</Text>
              <Text variant="bodySmall" style={styles.statTitle}>{stat.title}</Text>
            </Surface>
          </Animatable.View>
        ))}
      </View>

      <Animatable.View animation="fadeInUp" delay={600}>
        <Card style={styles.chartCard} elevation={2}>
          <Card.Title title="Salesman-wise Outstanding" titleStyle={{ fontWeight: 'bold' }} />
          <Card.Content style={{ paddingHorizontal: 0 }}>
            {salesmanData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray', padding: 16 }}>No salesmen added yet.</Text>
            ) : (
              salesmanData.map((salesman, index) => (
                <View key={salesman.id} style={[styles.salesmanRow, index !== salesmanData.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}>
                  <Avatar.Icon size={40} icon="account-tie" style={{ backgroundColor: '#E3F2FD' }} color={theme.colors.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }}>{salesman.salesman || 'Unknown Salesman'}</Text>
                    <Text variant="bodySmall" style={{ color: 'gray' }}>{salesman.name}</Text>
                  </View>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: salesman.totalDebt > 0 ? theme.colors.error : '#4CAF50' }}>
                    ₹{salesman.totalDebt}
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={700}>
        <Card style={styles.chartCard} elevation={2}>
          <Card.Title title="Due Today" titleStyle={{ fontWeight: 'bold', color: '#E53935' }} left={(props) => <Avatar.Icon {...props} icon="calendar-alert" color="#E53935" style={{ backgroundColor: '#FFEBEE' }}/>} />
          <Card.Content style={{ paddingHorizontal: 0 }}>
            {dueTodayData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray', padding: 16 }}>No collections due today.</Text>
            ) : (
              dueTodayData.map((salesman, index) => (
                <View key={salesman.id} style={{ borderBottomWidth: index !== dueTodayData.length - 1 ? 4 : 0, borderBottomColor: '#f1f5f9', paddingBottom: 16, marginBottom: index !== dueTodayData.length - 1 ? 16 : 0 }}>
                  <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar.Icon size={32} icon="account-tie" style={{ backgroundColor: '#E3F2FD' }} color={theme.colors.primary} />
                    <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15, marginLeft: 12 }}>{salesman.salesman || 'Unknown Salesman'}</Text>
                  </View>
                  
                  {salesman.assignedShops.map(shop => (
                    <View key={shop.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 4 }}>
                      <Text style={{ color: '#555', fontSize: 14 }}>• {shop.name}</Text>
                      <Text style={{ color: '#555', fontSize: 14, fontWeight: 'bold' }}>₹{shop.currentBalance}</Text>
                    </View>
                  ))}
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <Text style={{ fontWeight: 'bold', color: '#E53935', fontSize: 14 }}>Total Due Today</Text>
                    <Text style={{ fontWeight: '900', fontSize: 16, color: '#E53935' }}>₹{salesman.dueAmount}</Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={800}>
        <Card style={[styles.chartCard, { marginBottom: 32 }]} elevation={2}>
          <Card.Title title="Due Tomorrow (1 Day Early)" titleStyle={{ fontWeight: 'bold', color: '#F57C00' }} left={(props) => <Avatar.Icon {...props} icon="calendar-clock" color="#F57C00" style={{ backgroundColor: '#FFF3E0' }}/>} />
          <Card.Content style={{ paddingHorizontal: 0 }}>
            {dueTomorrowData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray', padding: 16 }}>No collections due tomorrow.</Text>
            ) : (
              dueTomorrowData.map((salesman, index) => (
                <View key={salesman.id} style={{ borderBottomWidth: index !== dueTomorrowData.length - 1 ? 4 : 0, borderBottomColor: '#f1f5f9', paddingBottom: 16, marginBottom: index !== dueTomorrowData.length - 1 ? 16 : 0 }}>
                  <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar.Icon size={32} icon="account-tie" style={{ backgroundColor: '#E3F2FD' }} color={theme.colors.primary} />
                    <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15, marginLeft: 12 }}>{salesman.salesman || 'Unknown Salesman'}</Text>
                  </View>
                  
                  {salesman.assignedShops.map(shop => (
                    <View key={shop.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 4 }}>
                      <Text style={{ color: '#555', fontSize: 14 }}>• {shop.name}</Text>
                      <Text style={{ color: '#555', fontSize: 14, fontWeight: 'bold' }}>₹{shop.currentBalance}</Text>
                    </View>
                  ))}
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    <Text style={{ fontWeight: 'bold', color: '#F57C00', fontSize: 14 }}>Total Due Tomorrow</Text>
                    <Text style={{ fontWeight: '900', fontSize: 16, color: '#F57C00' }}>₹{salesman.dueAmount}</Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </Animatable.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { padding: 24, paddingTop: 60, paddingBottom: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: -40, justifyContent: 'space-between' },
  statWrapper: { width: '48%', marginBottom: 16 },
  statCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  iconContainer: { borderRadius: 24, padding: 8, marginBottom: 16 },
  statValue: { fontWeight: '900', marginBottom: 4, color: '#333' },
  statTitle: { color: 'gray', textAlign: 'center', fontWeight: '500' },
  chartCard: { margin: 16, marginTop: 8, borderRadius: 20, backgroundColor: '#fff', overflow: 'hidden' },
  salesmanRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }
});
