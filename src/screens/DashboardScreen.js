import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Card, Avatar, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';

export default function DashboardScreen({ setIsAuthenticated }) {
  const theme = useTheme();
  const { shops, vehicles, transactions } = useAppContext();

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

  const todayDate = getTodayDate();

  const totalOutstanding = shops.reduce((sum, s) => sum + s.currentBalance, 0);
  const pendingShops = shops.filter(s => s.currentBalance > 0).length;
  
  const todaysCollection = transactions
    .filter(t => t.type === 'payment' && t.date === todayDate)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const todaysCredit = transactions
    .filter(t => t.type === 'debt' && t.date === todayDate)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const salesmanCollectionData = vehicles.map(vehicle => {
    const vehicleShops = shops.filter(s => s.vehicleId === vehicle.id).map(s => s.id);
    const todaysPayments = transactions.filter(t => 
      t.type === 'payment' && 
      t.date === todayDate && 
      vehicleShops.includes(t.shopId)
    );
    const totalCollected = todaysPayments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return {
      ...vehicle,
      totalCollected
    };
  }).filter(v => v.totalCollected > 0).sort((a, b) => b.totalCollected - a.totalCollected);

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
        <Card style={[styles.chartCard, { marginBottom: 32 }]} elevation={2}>
          <Card.Title title="Today's Collection" titleStyle={{ fontWeight: 'bold', color: '#4CAF50' }} left={(props) => <Avatar.Icon {...props} icon="cash-multiple" color="#4CAF50" style={{ backgroundColor: '#E8F5E9' }}/>} />
          <Card.Content style={{ paddingHorizontal: 0 }}>
            {salesmanCollectionData.length === 0 ? (
              <Text style={{ textAlign: 'center', color: 'gray', padding: 16 }}>No collections made today.</Text>
            ) : (
              salesmanCollectionData.map((salesman, index) => (
                <View key={salesman.id} style={[styles.salesmanRow, index !== salesmanCollectionData.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}>
                  <Avatar.Icon size={40} icon="account-tie" style={{ backgroundColor: '#E8F5E9' }} color="#4CAF50" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }}>{salesman.salesman || 'Unknown Salesman'}</Text>
                    <Text variant="bodySmall" style={{ color: 'gray' }}>{salesman.name}</Text>
                  </View>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: '#4CAF50' }}>
                    ₹{salesman.totalCollected}
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={800} style={{ paddingHorizontal: 16, marginBottom: 40 }}>
        <Surface style={{ borderRadius: 16, overflow: 'hidden' }} elevation={2}>
          <IconButton 
            icon="logout" 
            mode="contained"
            containerColor="#FF3B30"
            iconColor="#fff"
            size={24}
            onPress={() => setIsAuthenticated(false)}
            style={{ width: '100%', borderRadius: 0, margin: 0, paddingVertical: 8 }}
          />
        </Surface>
        <Text style={{ textAlign: 'center', color: 'gray', marginTop: 8, fontWeight: 'bold' }}>Logout of Admin Portal</Text>
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
