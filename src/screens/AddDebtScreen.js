import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, useTheme, TextInput, Button, Chip, Surface, Snackbar, List } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';

export default function AddDebtScreen({ navigation }) {
  const theme = useTheme();
  const { vehicles, addShop, shops } = useAppContext();

  const [shopName, setShopName] = useState('');
  const [place, setPlace] = useState('');
  const [mobile, setMobile] = useState('');
  const [balance, setBalance] = useState('');
  const [orderDateStr, setOrderDateStr] = useState('');
  const [orderDatePickerVisible, setOrderDatePickerVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles.length > 0 ? vehicles[0].id : '');
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  };

  useEffect(() => {
    // Removed auto-fill of today's date based on user feedback
  }, []);

  const filteredShops = shopName.trim().length > 0 
    ? shops.filter(s => s.name?.toLowerCase().includes(shopName.toLowerCase().trim()))
    : [];

  const handleShopNameChange = (text) => {
    setShopName(text);
    setShowSuggestions(true);
  };

  const selectShop = (shop) => {
    setShopName(shop.name || '');
    setPlace(shop.place || '');
    setMobile(shop.mobile || '');
    if (shop.vehicleId) {
      setSelectedVehicle(shop.vehicleId);
    }
    setShowSuggestions(false);
  };

  const handleSave = async (shouldClear = true) => {
    if (vehicles.length === 0) {
      alert("Please add a Salesman in the 'Vehicles' tab first!");
      return;
    }
    
    if (!shopName || !place || !balance || !selectedVehicle) {
      alert("Please fill all the details.");
      return;
    }

    setIsSaving(true);
    try {
      await addShop({
        name: shopName,
        place: place,
        ownerName: 'Unknown',
        mobile: mobile.trim(),
        area: place,
        vehicleId: selectedVehicle,
        currentBalance: parseFloat(balance),
        orderDate: orderDateStr || formatDate(new Date()),
        lastTransactionDate: orderDateStr || formatDate(new Date())
      });

      setSnackbarVisible(true);
      
      if (shouldClear) {
        setShopName('');
        setPlace('');
        setMobile('');
        setBalance('');
        setOrderDateStr(formatDate(new Date()));
      }
    } catch (error) {
      console.error("Firebase Error: ", error);
      alert("Failed to save data. Please check your Firebase Database Rules! Make sure they are set to 'allow read, write: if true;'");
    } finally {
      setIsSaving(false);
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
            <TextInput 
              label="Shop Name" 
              value={shopName} 
              onChangeText={handleShopNameChange} 
              onFocus={() => setShowSuggestions(true)}
              mode="outlined" 
              style={styles.input} 
              left={<TextInput.Icon icon="store" color={theme.colors.primary} />} 
              theme={{ roundness: 10 }} 
            />
            {showSuggestions && filteredShops.length > 0 && (
              <Surface style={{ elevation: 4, borderRadius: 8, marginTop: -12, marginBottom: 16, backgroundColor: '#fff', zIndex: 1000 }}>
                {filteredShops.slice(0, 5).map(shop => {
                  const vehicleName = vehicles.find(v => v.id === shop.vehicleId)?.name || 'No Salesman';
                  return (
                    <List.Item
                      key={shop.id}
                      title={shop.name}
                      description={`Salesman: ${vehicleName} • Place: ${shop.place || 'N/A'}`}
                      onPress={() => selectShop(shop)}
                      left={props => <List.Icon {...props} icon="store" />}
                      style={{ paddingVertical: 4 }}
                    />
                  );
                })}
              </Surface>
            )}
            <TextInput label="Place (Location)" value={place} onChangeText={setPlace} mode="outlined" style={styles.input} left={<TextInput.Icon icon="map-marker" color={theme.colors.primary} />} theme={{ roundness: 10 }} />
            <TextInput label="Mobile Number (Optional)" value={mobile} onChangeText={setMobile} mode="outlined" keyboardType="phone-pad" style={styles.input} left={<TextInput.Icon icon="phone" color={theme.colors.primary} />} theme={{ roundness: 10 }} />
            
            <View style={styles.rowInputs}>
              <TextInput label="Pending Balance (₹)" value={balance} onChangeText={setBalance} mode="outlined" keyboardType="numeric" style={[styles.input, { flex: 1, marginRight: 8 }]} left={<TextInput.Icon icon="currency-inr" color={theme.colors.error} />} theme={{ roundness: 10 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <TextInput
                  label="Order Date (DD-MM-YYYY)"
                  value={orderDateStr}
                  onChangeText={setOrderDateStr}
                  mode="outlined"
                  style={styles.input}
                  right={<TextInput.Icon icon="calendar" onPress={() => setOrderDatePickerVisible(true)} />}
                  theme={{ roundness: 10 }}
                />
              </View>
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

            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Button 
                mode="contained" 
                onPress={() => handleSave(true)} 
                style={[styles.button, { flex: 1 }]} 
                buttonColor={theme.colors.primary}
                disabled={isSaving}
                loading={isSaving}
              >
                SAVE
              </Button>
            </View>
          </Surface>
        </Animatable.View>
      </ScrollView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: '#4CAF50' }}>
        Record saved successfully!
      </Snackbar>

      <DatePickerModal
        locale="en-GB"
        mode="single"
        visible={orderDatePickerVisible}
        onDismiss={() => setOrderDatePickerVisible(false)}
        date={undefined}
        onConfirm={(params) => {
          setOrderDatePickerVisible(false);
          setOrderDateStr(formatDate(params.date));
        }}
      />
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
