import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, useWindowDimensions, Linking } from 'react-native';
import { Text, useTheme, Avatar, Card, FAB, Dialog, Portal, TextInput, Button, IconButton, Chip, DataTable, Searchbar } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export default function ShopsScreen({ navigation }) {
  const theme = useTheme();
  const { vehicles, shops, addShop, updateShop, deleteShop, recordPayment } = useAppContext();

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', ownerName: '', area: '', place: '', mobile: '', vehicleId: '' });

  // Payment State
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [activePaymentShopId, setActivePaymentShopId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', mode: 'Cash', date: '' });
  const [paymentDatePickerOpen, setPaymentDatePickerOpen] = useState(false);

  // Delete State
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');

  // Mobile Number State
  const [mobileDialogVisible, setMobileDialogVisible] = useState(false);
  const [mobileShopToUpdate, setMobileShopToUpdate] = useState(null);
  const [mobileInput, setMobileInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const showDialog = (shop = null) => {
    if (shop) {
      setEditingId(shop.id);
      setForm(shop);
    } else {
      setEditingId(null);
      setForm({ name: '', ownerName: '', area: '', place: '', mobile: '', vehicleId: selectedVehicleFilter || (vehicles.length > 0 ? vehicles[0].id : '') });
    }
    setVisible(true);
  };

  const hideDialog = () => setVisible(false);

  const handleSave = () => {
    if (editingId) updateShop(editingId, form);
    else addShop(form);
    hideDialog();
  };

  const showPaymentDialog = (shop) => {
    setActivePaymentShopId(shop.id);
    setPaymentForm({ amount: shop.currentBalance.toString(), mode: 'Cash', date: formatDate(new Date()) });
    setPaymentDialogVisible(true);
  };

  const hidePaymentDialog = () => setPaymentDialogVisible(false);

  const handleRecordPayment = () => {
    const amountNum = parseFloat(paymentForm.amount) || 0;
    if (amountNum > 0) {
      recordPayment(activePaymentShopId, {
        amount: amountNum,
        mode: paymentForm.mode,
        date: paymentForm.date
      });
    }
    hidePaymentDialog();
  };

  const initiateDelete = (shopId) => {
    setShopToDelete(shopId);
    setDeletePassword('');
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (deletePassword === '151571') {
      deleteShop(shopToDelete);
      setDeleteDialogVisible(false);
    } else {
      alert('Incorrect Password');
    }
  };

  const filteredShops = shops.filter(s => {
    if (selectedVehicleFilter && s.vehicleId !== selectedVehicleFilter) return false;
    if (paymentFilter === 'paid' && s.currentBalance > 0) return false;
    if (paymentFilter === 'notPaid' && s.currentBalance <= 0) return false;
    if (dateFilter && s.lastTransactionDate !== dateFilter && s.orderDate !== dateFilter && s.lastPaymentDate !== dateFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = s.name?.toLowerCase().includes(query);
      const matchOwner = s.ownerName?.toLowerCase().includes(query);
      const matchArea = s.area?.toLowerCase().includes(query);
      const matchPlace = s.place?.toLowerCase().includes(query);
      if (!matchName && !matchOwner && !matchArea && !matchPlace) return false;
    }
    return true;
  });

  const totalFilteredBalance = filteredShops.reduce((sum, shop) => sum + shop.currentBalance, 0);
  const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicleFilter);

  const formatDate = (dateObj) => {
    if (!dateObj) return null;
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const downloadPDF = async () => {
    try {
      let htmlContent = `
        <html>
          <head>
            <style>
              @media print {
                body { margin: 0; padding: 20px; font-family: Helvetica, Arial, sans-serif; }
                table { page-break-after: auto; }
                tr    { page-break-inside: avoid; page-break-after: auto; }
                td    { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
              }
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; }
              h2 { text-align: center; color: #333; }
              .balance-red { color: #d32f2f; font-weight: bold; }
              .balance-green { color: #388e3c; font-weight: bold; }
            </style>
          </head>
          <body>
            <h2>Shops Report</h2>
            <p><strong>Total Balance:</strong> ₹${totalFilteredBalance}</p>
            <table>
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Place</th>
                  <th>Date Given</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
      `;

      filteredShops.forEach(shop => {
        const balanceClass = shop.currentBalance > 0 ? 'balance-red' : 'balance-green';
        const dateGiven = shop.orderDate || shop.lastTransactionDate || 'N/A';
        const placeText = shop.place || shop.area || '';
        
        htmlContent += `
          <tr>
            <td>${shop.name || ''}</td>
            <td>${placeText}</td>
            <td>${dateGiven}</td>
            <td class="${balanceClass}">₹${shop.currentBalance || 0}</td>
          </tr>
        `;
      });

      htmlContent += `
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="3" style="text-align: right;">Total Balance:</th>
                  <th style="color: #d32f2f;">₹${totalFilteredBalance}</th>
                </tr>
              </tfoot>
            </table>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri);
        } else {
          alert('Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const generateShopMessage = (shop, assignedVehicle, isWhatsApp = false) => {
    let msg = isWhatsApp ? `*Shri Gajanan Enterprises PEPSI Agency Ghataprabha*\n\n` : `Shri Gajanan Enterprises PEPSI Agency Ghataprabha\n\n`;
    
    if (shop.currentBalance > 0) {
      msg += `⚠️ This is a reminder regarding your outstanding debt.\n\n`;
    } else {
      msg += `📋 This is a summary of your account with us.\n\n`;
    }
    
    const dateGiven = shop.orderDate || shop.lastTransactionDate || 'N/A';
    const placeStr = shop.place || shop.area ? `(${shop.place || shop.area})` : '';
    
    if (isWhatsApp) {
      msg += `🏬 *Shop:* ${shop.name} ${placeStr}\n`;
      msg += `📅 *Date Given:* ${dateGiven}\n`;
      msg += `💰 *Total Balance: ₹${shop.currentBalance}*\n`;
      msg += `👤 *Salesman:* ${assignedVehicle?.salesman || 'Unknown'} (${assignedVehicle?.salesmanMobile || ''})\n\n`;
      if (shop.currentBalance > 0) {
        msg += `Please arrange for the payment at the earliest.`;
      }
    } else {
      msg += `🏬 Shop: ${shop.name} ${placeStr}\n`;
      msg += `📅 Date Given: ${dateGiven}\n`;
      msg += `💰 Total Balance: ₹${shop.currentBalance}\n`;
      msg += `👤 Salesman: ${assignedVehicle?.salesman || 'Unknown'} (${assignedVehicle?.salesmanMobile || ''})\n\n`;
      if (shop.currentBalance > 0) {
        msg += `Please arrange for the payment at the earliest.`;
      }
    }
    
    return encodeURIComponent(msg.trim());
  };

  const sendShopSMS = (shop, assignedVehicle) => {
    if (!shop.mobile) { 
      setMobileShopToUpdate(shop);
      setPendingAction({ type: 'sms', assignedVehicle });
      setMobileInput('');
      setMobileDialogVisible(true);
      return; 
    }
    const msg = generateShopMessage(shop, assignedVehicle, false);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${shop.mobile}${separator}body=${msg}`);
  };

  const sendShopWhatsApp = (shop, assignedVehicle) => {
    if (!shop.mobile) { 
      setMobileShopToUpdate(shop);
      setPendingAction({ type: 'whatsapp', assignedVehicle });
      setMobileInput('');
      setMobileDialogVisible(true);
      return; 
    }
    const msg = generateShopMessage(shop, assignedVehicle, true);
    Linking.openURL(`whatsapp://send?phone=${shop.mobile}&text=${msg}`);
  };

  const handleSaveMobile = () => {
    if (mobileInput.trim() === '') {
      alert("Please enter a valid mobile number.");
      return;
    }
    
    const updatedShop = { ...mobileShopToUpdate, mobile: mobileInput.trim() };
    updateShop(mobileShopToUpdate.id, updatedShop);
    setMobileDialogVisible(false);
    
    if (pendingAction) {
      if (pendingAction.type === 'sms') {
        const msg = generateShopMessage(updatedShop, pendingAction.assignedVehicle, false);
        const separator = Platform.OS === 'ios' ? '&' : '?';
        Linking.openURL(`sms:${updatedShop.mobile}${separator}body=${msg}`);
      } else if (pendingAction.type === 'whatsapp') {
        const msg = generateShopMessage(updatedShop, pendingAction.assignedVehicle, true);
        Linking.openURL(`whatsapp://send?phone=${updatedShop.mobile}&text=${msg}`);
      }
    }
  };

  const onConfirmDate = (params) => {
    setDatePickerOpen(false);
    setDateFilter(formatDate(params.date));
  };

  const onConfirmPaymentDate = (params) => {
    setPaymentDatePickerOpen(false);
    setPaymentForm({ ...paymentForm, date: formatDate(params.date) });
  };

  const renderItem = ({ item }) => {
    const assignedVehicle = vehicles.find(v => v.id === item.vehicleId);
    
    return (
      <Card style={styles.mobileCard} elevation={1} onPress={() => navigation.navigate('ShopDetails', { shopId: item.id })}>
        <Card.Content style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.colors.primary }}>{item.name}</Text>
              <Text variant="bodySmall" style={{ color: 'gray', marginBottom: 4 }}>{item.place || item.area}</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Avatar.Icon size={20} icon="account-tie" style={{ backgroundColor: '#E3F2FD', marginRight: 4 }} color="#1976D2" />
                <Text variant="bodySmall" style={{ color: '#333' }}>{assignedVehicle?.salesman || 'No Salesman'} ({assignedVehicle?.name || 'Unknown'})</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Avatar.Icon size={20} icon="phone" style={{ backgroundColor: '#E8F5E9', marginRight: 4 }} color="#2E7D32" />
                <Text variant="bodySmall" style={{ color: '#333', marginRight: 4 }}>{item.mobile || 'No mobile saved'}</Text>
                <IconButton 
                  icon="pencil" 
                  size={16} 
                  iconColor="#1976D2" 
                  style={{ margin: 0, width: 24, height: 24 }} 
                  onPress={() => {
                    setMobileShopToUpdate(item);
                    setPendingAction(null);
                    setMobileInput(item.mobile || '');
                    setMobileDialogVisible(true);
                  }} 
                />
              </View>
              
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <View style={{ marginRight: 24 }}>
                  <Text variant="labelSmall" style={{ color: 'gray', textTransform: 'uppercase' }}>Debt Given</Text>
                  <Text variant="bodySmall" style={{ fontWeight: 'bold', marginTop: 2 }}>{item.orderDate || item.lastTransactionDate || 'N/A'}</Text>
                </View>
                <View>
                  <Text variant="labelSmall" style={{ color: 'gray', textTransform: 'uppercase' }}>Due Date</Text>
                  <Text variant="bodySmall" style={{ fontWeight: 'bold', marginTop: 2 }}>{item.lastTransactionDate || 'N/A'}</Text>
                </View>
              </View>
            </View>
            
            <View style={{ alignItems: 'flex-end', paddingLeft: 8 }}>
              <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                <Text variant="labelSmall" style={{ color: 'gray', textTransform: 'uppercase', marginBottom: 2 }}>Balance</Text>
                <Text style={{ fontWeight: '900', fontSize: 18, color: item.currentBalance > 0 ? theme.colors.error : '#4CAF50' }}>
                  ₹{item.currentBalance}
                </Text>
              </View>
              
              {item.paymentStatus && (
                <View style={{ backgroundColor: item.paymentStatus === 'Paid' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 }}>
                  <Text variant="labelSmall" style={{ color: item.paymentStatus === 'Paid' ? '#2E7D32' : '#E65100', fontSize: 10, fontWeight: 'bold' }}>
                    {item.paymentStatus}
                  </Text>
                </View>
              )}
              
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <IconButton icon="whatsapp" size={20} iconColor="#25D366" containerColor="#E8F5E9" style={{ margin: 0, marginRight: 8 }} onPress={() => sendShopWhatsApp(item, assignedVehicle)} />
                <IconButton icon="message-text" size={20} iconColor="#007AFF" containerColor="#E3F2FD" style={{ margin: 0, marginRight: 8 }} onPress={() => sendShopSMS(item, assignedVehicle)} />
                {item.currentBalance > 0 && (
                  <IconButton icon="cash-plus" size={20} iconColor="#4CAF50" containerColor="#E8F5E9" style={{ margin: 0, marginRight: 8 }} onPress={() => showPaymentDialog(item)} />
                )}
                <IconButton icon="trash-can-outline" size={20} iconColor={theme.colors.error} containerColor="#FFEBEE" style={{ margin: 0 }} onPress={() => initiateDelete(item.id)} />
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animatable.View animation="fadeInDown" delay={100} style={styles.filtersSection}>
        <Searchbar
          placeholder="Search shops, owners, areas..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginHorizontal: 16, marginBottom: 12, elevation: 0, backgroundColor: '#F1F5F9', borderRadius: 12, height: 44 }}
          inputStyle={{ minHeight: 44, paddingBottom: 0 }}
        />
        <Text variant="labelSmall" style={styles.filterLabel}>Payment Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <Chip selected={paymentFilter === 'all'} onPress={() => setPaymentFilter('all')} style={styles.chip} showSelectedOverlay>All</Chip>
          <Chip selected={paymentFilter === 'paid'} onPress={() => setPaymentFilter('paid')} style={styles.chip} showSelectedOverlay>Paid</Chip>
          <Chip selected={paymentFilter === 'notPaid'} onPress={() => setPaymentFilter('notPaid')} style={styles.chip} showSelectedOverlay>Not Paid</Chip>
        </ScrollView>

        <Text variant="labelSmall" style={styles.filterLabel}>Filters:</Text>
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
          <Chip selected={selectedVehicleFilter === null} onPress={() => setSelectedVehicleFilter(null)} style={styles.chip} showSelectedOverlay>All Salesmen</Chip>
          {vehicles.map(v => (
            <Chip key={v.id} selected={selectedVehicleFilter === v.id} onPress={() => setSelectedVehicleFilter(v.id)} style={styles.chip} showSelectedOverlay>{v.salesman || v.name}</Chip>
          ))}
        </ScrollView>
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={300} style={styles.summaryContainer}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
            {selectedVehicleObj ? `Salesman: ${selectedVehicleObj.salesman}` : 'All Salesmen'}
          </Text>
          <Text variant="bodySmall" style={{ color: 'gray' }}>Showing {filteredShops.length} shops</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="file-pdf-box" iconColor={theme.colors.primary} size={28} onPress={downloadPDF} style={{ marginRight: 8 }} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="bodySmall" style={{ fontWeight: 'bold', color: 'gray', textTransform: 'uppercase' }}>Total Balance</Text>
            <Text variant="titleLarge" style={{ fontWeight: '900', color: totalFilteredBalance > 0 ? theme.colors.error : '#4CAF50' }}>
              ₹{totalFilteredBalance}
            </Text>
          </View>
        </View>
      </Animatable.View>

      <View style={{ flex: 1, marginHorizontal: 16, marginTop: 8 }}>
        <FlatList
          data={filteredShops}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: 'gray' }}>No shops found matching the criteria.</Text>}
          showsVerticalScrollIndicator={false}
        />
      </View>


      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={{ backgroundColor: theme.colors.surface, maxHeight: '80%', borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{editingId ? 'Edit Shop' : 'Add New Shop'}</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}>
              <TextInput label="Shop Name" value={form.name} onChangeText={(t) => setForm({...form, name: t})} mode="outlined" style={styles.input} theme={{roundness: 10}} />
              <TextInput label="Owner Name" value={form.ownerName} onChangeText={(t) => setForm({...form, ownerName: t})} mode="outlined" style={styles.input} theme={{roundness: 10}} />
              <TextInput label="Mobile Number" value={form.mobile} onChangeText={(t) => setForm({...form, mobile: t})} mode="outlined" keyboardType="phone-pad" style={styles.input} theme={{roundness: 10}} />
              <TextInput label="Area" value={form.area} onChangeText={(t) => setForm({...form, area: t})} mode="outlined" style={styles.input} theme={{roundness: 10}} />
              <TextInput label="Place" value={form.place} onChangeText={(t) => setForm({...form, place: t})} mode="outlined" style={styles.input} theme={{roundness: 10}} />
              
              <Text style={{ marginTop: 12, marginBottom: 8, color: 'gray', fontWeight: 'bold' }}>Assign to Vehicle:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {vehicles.map(v => (
                  <Chip key={v.id} selected={form.vehicleId === v.id} onPress={() => setForm({...form, vehicleId: v.id})} style={[styles.chip, { marginBottom: 8 }]} showSelectedOverlay>
                    {v.name}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Button onPress={hideDialog} textColor="gray">Cancel</Button>
            <Button onPress={handleSave} mode="contained" buttonColor={theme.colors.primary} style={{ marginLeft: 8, borderRadius: 8 }}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <DatePickerModal
        locale="en-GB"
        mode="single"
        visible={datePickerOpen}
        onDismiss={() => setDatePickerOpen(false)}
        date={dateFilter ? new Date(dateFilter.split('-').reverse().join('-')) : new Date()}
        onConfirm={onConfirmDate}
      />

      <Portal>
        <Dialog visible={paymentDialogVisible} onDismiss={hidePaymentDialog} style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Record Payment</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Amount Paid" value={paymentForm.amount} onChangeText={(t) => setPaymentForm({...paymentForm, amount: t})} mode="outlined" keyboardType="numeric" style={styles.input} theme={{roundness: 10}} />
            <Text style={{ marginTop: 12, marginBottom: 8, color: 'gray', fontWeight: 'bold' }}>Payment Mode:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {['Cash', 'UPI', 'Bank Transfer'].map(mode => (
                <Chip key={mode} selected={paymentForm.mode === mode} onPress={() => setPaymentForm({...paymentForm, mode})} style={[styles.chip, { marginBottom: 8 }]} showSelectedOverlay>
                  {mode}
                </Chip>
              ))}
            </View>
            <Button icon="calendar" mode="outlined" onPress={() => setPaymentDatePickerOpen(true)} style={{ borderRadius: 8 }}>
              {paymentForm.date ? `Date: ${paymentForm.date}` : 'Select Date'}
            </Button>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Button onPress={hidePaymentDialog} textColor="gray">Cancel</Button>
            <Button onPress={handleRecordPayment} mode="contained" buttonColor="#4CAF50" style={{ marginLeft: 8, borderRadius: 8 }}>Record</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} style={{ borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.error, fontWeight: 'bold' }}>Delete Shop</Dialog.Title>
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

        <Dialog visible={mobileDialogVisible} onDismiss={() => setMobileDialogVisible(false)} style={{ borderRadius: 16 }}>
          <Dialog.Title style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Add Mobile Number</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16 }}>Please enter the mobile number for {mobileShopToUpdate?.name}.</Text>
            <TextInput
              label="Mobile Number"
              mode="outlined"
              keyboardType="phone-pad"
              value={mobileInput}
              onChangeText={setMobileInput}
              theme={{ roundness: 10 }}
            />
          </Dialog.Content>
          <Dialog.Actions style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Button onPress={() => setMobileDialogVisible(false)} textColor="gray">Cancel</Button>
            <Button onPress={handleSaveMobile} mode="contained" buttonColor={theme.colors.primary} style={{ marginLeft: 8, borderRadius: 8 }}>
              {pendingAction ? 'Save & Send' : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <DatePickerModal
        locale="en-GB"
        mode="single"
        visible={paymentDatePickerOpen}
        onDismiss={() => setPaymentDatePickerOpen(false)}
        date={undefined}
        onConfirm={onConfirmPaymentDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersSection: { paddingBottom: 8, paddingTop: 16, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 3 },
  filterLabel: { marginLeft: 16, marginBottom: 4, color: 'gray', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10 },
  chipScroll: { paddingHorizontal: 16, paddingBottom: 4 },
  chip: { marginRight: 8, borderRadius: 20 },
  gridRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  gridCell: {
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', elevation: 1 },
  fabContainer: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  fab: { backgroundColor: '#C9002B', borderRadius: 16, elevation: 6 },
  input: { marginBottom: 12, backgroundColor: '#FAFAFA' },
  mobileCard: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' }
});
