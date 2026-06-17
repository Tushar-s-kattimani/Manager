import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, Card, Avatar, FAB, Dialog, Portal, TextInput, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';

export default function VehiclesScreen() {
  const theme = useTheme();
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useAppContext();

  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [vehicleName, setVehicleName] = useState('');
  const [salesmanName, setSalesmanName] = useState('');
  const [salesmanMobile, setSalesmanMobile] = useState('');

  // Delete State
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');

  const showDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingId(vehicle.id);
      setVehicleName(vehicle.name);
      setSalesmanName(vehicle.salesman);
      setSalesmanMobile(vehicle.salesmanMobile || '');
    } else {
      setEditingId(null);
      setVehicleName('');
      setSalesmanName('');
      setSalesmanMobile('');
    }
    setVisible(true);
  };

  const hideDialog = () => setVisible(false);

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateVehicle(editingId, { name: vehicleName, salesman: salesmanName, salesmanMobile });
      } else {
        await addVehicle({ name: vehicleName, salesman: salesmanName, salesmanMobile });
      }
      hideDialog();
    } catch (error) {
      console.error(error);
      alert("Failed to save data. Please check your Firebase Database Rules! Make sure they are set to 'allow read, write: if true;'");
    }
  };

  const initiateDelete = (vehicleId) => {
    setVehicleToDelete(vehicleId);
    setDeletePassword('');
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (deletePassword === '151571') {
      deleteVehicle(vehicleToDelete);
      setDeleteDialogVisible(false);
    } else {
      alert('Incorrect Password');
    }
  };

  const renderItem = ({ item, index }) => (
    <Animatable.View animation="fadeInUp" delay={index * 100} duration={500}>
      <Card style={styles.card} elevation={2} mode="elevated">
        <Card.Title
          title={item.name}
          titleStyle={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 18 }}
          subtitle={`Salesman: ${item.salesman}${item.salesmanMobile ? `\nMobile: ${item.salesmanMobile}` : ''}`}
          subtitleStyle={{ color: 'gray', marginTop: 4, lineHeight: 18 }}
          left={(props) => (
            <LinearGradient
              colors={[theme.colors.primary, '#001D36']}
              style={styles.iconGradient}
            >
              <Avatar.Icon {...props} icon="truck" style={{ backgroundColor: 'transparent' }} color="#fff" size={40} />
            </LinearGradient>
          )}
          right={(props) => (
            <View style={{ flexDirection: 'row', marginRight: 8 }}>
              <IconButton {...props} icon="pencil-outline" iconColor={theme.colors.primary} onPress={() => showDialog(item)} />
              <IconButton {...props} icon="trash-can-outline" iconColor={theme.colors.error} onPress={() => initiateDelete(item.id)} />
            </View>
          )}
        />
      </Card>
    </Animatable.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.primary, '#001D36']} style={styles.headerGradient}>
        <Animatable.View animation="fadeIn" style={styles.headerContent}>
          <Text variant="headlineMedium" style={{ color: '#fff', fontWeight: 'bold' }}>Manage Vehicles</Text>
          <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.8)' }}>{vehicles.length} vehicles assigned to routes</Text>
        </Animatable.View>
      </LinearGradient>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Animatable.View animation="bounceIn" delay={500} style={styles.fabContainer}>
        <FAB
          icon="plus"
          style={styles.fab}
          color="#fff"
          onPress={() => showDialog()}
        />
      </Animatable.View>

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Vehicle Name / Number"
              value={vehicleName}
              onChangeText={setVehicleName}
              mode="outlined"
              style={styles.input}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Salesman Name"
              value={salesmanName}
              onChangeText={setSalesmanName}
              mode="outlined"
              style={styles.input}
              theme={{ roundness: 10 }}
            />
            <TextInput
              label="Salesman Phone Number"
              value={salesmanMobile}
              onChangeText={setSalesmanMobile}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.input}
              theme={{ roundness: 10 }}
            />
            <Button mode="contained" onPress={handleSave} buttonColor={theme.colors.primary} style={{ marginTop: 12, borderRadius: 10 }}>Save Vehicle</Button>
          </Dialog.Content>
        </Dialog>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} style={{ borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.error, fontWeight: 'bold' }}>Delete Vehicle</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16 }}>Please enter the admin password to confirm deletion.</Text>
            <TextInput
              label="Password"
              mode="outlined"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              theme={{ roundness: 10 }}
            />
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Button onPress={() => setDeleteDialogVisible(false)} textColor="gray">Cancel</Button>
            <Button onPress={confirmDelete} buttonColor={theme.colors.error} mode="contained" style={{ marginLeft: 8, borderRadius: 8 }}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { padding: 24, paddingTop: 50, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16 },
  headerContent: { alignItems: 'flex-start' },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 16 },
  iconGradient: { borderRadius: 12, padding: 4, elevation: 3 },
  fabContainer: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  fab: { backgroundColor: '#C9002B', borderRadius: 16, elevation: 6 },
  input: { marginBottom: 16, backgroundColor: '#FAFAFA' }
});
