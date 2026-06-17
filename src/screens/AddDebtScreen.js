import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, useTheme, TextInput, Button, Chip, Surface, Snackbar } from 'react-native-paper';
import { DatePickerInput } from 'react-native-paper-dates';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';

export default function AddDebtScreen({ navigation }) {
  const theme = useTheme();
  const { vehicles, addShop } = useAppContext();

  const [shopName, setShopName] = useState('');
  const [place, setPlace] = useState('');
  const [balance, setBalance] = useState('');
  const [orderDate, setOrderDate] = useState(new Date());
  const [lastDueDate, setLastDueDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles.length > 0 ? vehicles[0].id : '');
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const handleSave = async () => {
    if (vehicles.length === 0) {
      alert("Please add a Salesman in the 'Vehicles' tab first!");
      return;
    }
    
    if (!shopName || !place || !balance || !selectedVehicle || !lastDueDate) {
      alert("Please fill all the details.");
      return;
    }

    try {
      await addShop({
        name: shopName,
        place: place,
        ownerName: 'Unknown',
        mobile: '',
        area: place,
        vehicleId: selectedVehicle,
        currentBalance: parseFloat(balance),
        orderDate: orderDate ? formatDate(orderDate) : formatDate(new Date()),
        lastTransactionDate: lastDueDate ? formatDate(lastDueDate) : formatDate(new Date())
      });

      setSnackbarVisible(true);
      
      setShopName('');
      setPlace('');
      setBalance('');
      setOrderDate(new Date());
      setLastDueDate(new Date());
    } catch (error) {
      console.error("Firebase Error: ", error);
      alert("Failed to save data. Please check your Firebase Database Rules! Make sure they are set to 'allow read, write: if true;'");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.primary, '#001D36']} style={styles.headerGradient}>
        <Animatable.View animation="fadeIn" style={styles.headerContent}>
          <Text variant="headlineMedium" style={{ color: '#fff', fontWeight: 'bold' }}>Add Debt / New Shop</Text>
          <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.8)' }}>Record a new shop with pending balance</Text>
        </Animatable.View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeInUp" delay={200} duration={600}>
          <Surface style={styles.card} elevation={3}>
            <TextInput label="Shop Name" value={shopName} onChangeText={setShopName} mode="outlined" style={styles.input} left={<TextInput.Icon icon="store" color={theme.colors.primary} />} theme={{ roundness: 10 }} />
            <TextInput label="Place (Location)" value={place} onChangeText={setPlace} mode="outlined" style={styles.input} left={<TextInput.Icon icon="map-marker" color={theme.colors.primary} />} theme={{ roundness: 10 }} />
            
            <View style={styles.rowInputs}>
              <TextInput label="Pending Balance (₹)" value={balance} onChangeText={setBalance} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginRight: 8 }]} left={<TextInput.Icon icon="currency-inr" color={theme.colors.error} />} theme={{ roundness: 10 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <DatePickerInput
                  locale="en-GB"
                  label="Order Date"
                  value={orderDate}
                  onChange={(d) => setOrderDate(d)}
                  inputMode="start"
                  mode="outlined"
                  style={styles.input}
                  theme={{ roundness: 10 }}
                />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <DatePickerInput
                locale="en-GB"
                label="Last Due Date"
                value={lastDueDate}
                onChange={(d) => setLastDueDate(d)}
                inputMode="start"
                mode="outlined"
                style={styles.input}
                theme={{ roundness: 10 }}
              />
            </View>

            <Text style={styles.label}>Select Assigned Vehicle:</Text>
            <View style={styles.chipContainer}>
              {vehicles.map((v, index) => (
                <Animatable.View key={v.id} animation="zoomIn" delay={300 + (index * 100)}>
                  <Chip selected={selectedVehicle === v.id} onPress={() => setSelectedVehicle(v.id)} style={styles.chip} showSelectedOverlay>
                    {v.name}
                  </Chip>
                </Animatable.View>
              ))}
            </View>

            <Button mode="contained" onPress={handleSave} style={styles.button} contentStyle={{ paddingVertical: 10 }} buttonColor={theme.colors.primary} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
              SAVE DETAILS
            </Button>
          </Surface>
        </Animatable.View>
      </ScrollView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: '#4CAF50' }}>
        Record saved successfully!
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { padding: 24, paddingTop: 50, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16 },
  headerContent: { alignItems: 'flex-start' },
  card: { margin: 16, padding: 24, borderRadius: 20, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  input: { marginBottom: 16, backgroundColor: '#FAFAFA' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { marginTop: 8, marginBottom: 12, color: '#333', fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  chip: { marginRight: 8, marginBottom: 8, borderRadius: 16 },
  button: { marginTop: 8, borderRadius: 12, elevation: 4 }
});
