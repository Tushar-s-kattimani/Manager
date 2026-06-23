import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { Text, useTheme, Card, List, Avatar, IconButton, Chip, Searchbar } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const theme = useTheme();
  const { shops, vehicles } = useAppContext();

  const [dateFilter, setDateFilter] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');

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

  // Apply filters
  const filteredShops = shops.filter(s => {
    if (dateFilter && s.lastTransactionDate !== dateFilter && s.orderDate !== dateFilter && s.lastPaymentDate !== dateFilter) return false;
    if (selectedVehicleFilter && s.vehicleId !== selectedVehicleFilter) return false;
    if (paymentFilter === 'paid' && s.currentBalance > 0) return false;
    if (paymentFilter === 'notPaid' && s.currentBalance <= 0) return false;
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

  // Calculate Grand Total
  const grandTotalDebt = filteredShops.reduce((sum, shop) => sum + shop.currentBalance, 0);

  // Group shops by Salesman (Vehicle)
  const salesmanData = vehicles
    .filter(v => !selectedVehicleFilter || v.id === selectedVehicleFilter)
    .map(vehicle => {
      const assignedShops = filteredShops.filter(s => s.vehicleId === vehicle.id);
      const totalDebt = assignedShops.reduce((sum, shop) => sum + shop.currentBalance, 0);
      return { ...vehicle, assignedShops, totalDebt };
    })
    .filter(v => (searchQuery ? v.assignedShops.length > 0 : true))
    .sort((a, b) => b.totalDebt - a.totalDebt); // Sort by highest debt

  const generateMessage = (salesman, isWhatsApp = false) => {
    let msg = '';
    if (isWhatsApp) {
      msg = `*Shri Gajanan Enterprises PEPSI Agency Ghataprabha*\n\n`;
      msg += `*Hello ${salesman.salesman},*\n\n`;
      msg += `🚚 *Vehicle Name:* ${salesman.name}\n`;
      msg += `👤 *Salesman Name:* ${salesman.salesman}\n`;
      msg += `📞 *Number:* ${salesman.salesmanMobile || 'N/A'}\n`;
      msg += `💰 *Total Debt:* Rs.${salesman.totalDebt}\n\n`;
      msg += `*Pending Collections:*\n`;
    } else {
      msg = `Shri Gajanan Enterprises PEPSI Agency Ghataprabha\n\n`;
      msg += `Hello ${salesman.salesman},\n\n`;
      msg += `🚚 Vehicle Name: ${salesman.name}\n`;
      msg += `👤 Salesman Name: ${salesman.salesman}\n`;
      msg += `📞 Number: ${salesman.salesmanMobile || 'N/A'}\n`;
      msg += `💰 Total Debt: Rs.${salesman.totalDebt}\n\n`;
      msg += `Pending Collections:\n`;
    }
    
    salesman.assignedShops.forEach((shop) => {
      if(shop.currentBalance > 0) {
        if (isWhatsApp) {
          msg += `• *${shop.name}* (${shop.place}): Rs.${shop.currentBalance}\n`;
        } else {
          msg += `• ${shop.name} (${shop.place}): Rs.${shop.currentBalance}\n`;
        }
      }
    });
    
    if (isWhatsApp) {
      msg += `\n*TOTAL DEBT:* Rs.${salesman.totalDebt}\n`;
    } else {
      msg += `\nTOTAL DEBT: Rs.${salesman.totalDebt}\n`;
    }
    
    msg += `\nPlease collect at the earliest.\n\nThank you!`;
    return encodeURIComponent(msg);
  };

  const sendSMS = (salesman) => {
    if(!salesman.salesmanMobile) { alert('No mobile number saved for this salesman. Please edit them in Manage Vehicles.'); return; }
    const msg = generateMessage(salesman, false);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${salesman.salesmanMobile}${separator}body=${msg}`);
  };

  const sendWhatsApp = (salesman) => {
    if(!salesman.salesmanMobile) { alert('No mobile number saved for this salesman. Please edit them in Manage Vehicles.'); return; }
    const msg = generateMessage(salesman, true);
    Linking.openURL(`whatsapp://send?phone=${salesman.salesmanMobile}&text=${msg}`);
  };

  const generateAdminMessage = (isWhatsApp = false) => {
    let msg = isWhatsApp 
      ? `*Shri Gajanan Enterprises PEPSI Agency Ghataprabha*\n\n*Admin Master Report*\nTotal Outstanding: Rs.${grandTotalDebt}\n\n` 
      : `Shri Gajanan Enterprises PEPSI Agency Ghataprabha\n\nAdmin Master Report\nTotal Outstanding: Rs.${grandTotalDebt}\n\n`;
    
    salesmanData.forEach(salesman => {
      if (salesman.totalDebt > 0) {
        if (isWhatsApp) {
          msg += `🚚 *Vehicle Name:* ${salesman.name}\n`;
          msg += `👤 *Salesman Name:* ${salesman.salesman}\n`;
          msg += `📞 *Number:* ${salesman.salesmanMobile || 'N/A'}\n`;
          msg += `💰 *Total Debt:* Rs.${salesman.totalDebt}\n\n`;
        } else {
          msg += `🚚 Vehicle Name: ${salesman.name}\n`;
          msg += `👤 Salesman Name: ${salesman.salesman}\n`;
          msg += `📞 Number: ${salesman.salesmanMobile || 'N/A'}\n`;
          msg += `💰 Total Debt: Rs.${salesman.totalDebt}\n\n`;
        }
        
        salesman.assignedShops.forEach(shop => {
          if(shop.currentBalance > 0) {
            if (isWhatsApp) {
              msg += `• *${shop.name}* (${shop.place}): Rs.${shop.currentBalance}\n`;
            } else {
              msg += `• ${shop.name} (${shop.place}): Rs.${shop.currentBalance}\n`;
            }
          }
        });
        
        if (isWhatsApp) {
          msg += `\n*TOTAL DEBT:* Rs.${salesman.totalDebt}\n\n`;
        } else {
          msg += `\nTOTAL DEBT: Rs.${salesman.totalDebt}\n\n`;
        }
      }
    });
    
    msg += `Thank you!`;
    return encodeURIComponent(msg);
  };

  const sendAdminSMS = () => {
    const msg = generateAdminMessage(false);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:9448860040${separator}body=${msg}`);
  };

  const sendAdminWhatsApp = () => {
    const msg = generateAdminMessage(true);
    Linking.openURL(`whatsapp://send?phone=919448860040&text=${msg}`);
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
              table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; }
              h2, h3 { text-align: center; color: #333; }
              .balance-red { color: #d32f2f; font-weight: bold; }
              .balance-green { color: #388e3c; font-weight: bold; }
              .salesman-header { background-color: #e3f2fd; padding: 10px; margin-top: 20px; font-weight: bold; font-size: 16px; border-radius: 4px; border: 1px solid #bbdefb; }
            </style>
          </head>
          <body>
            <h2>Admin Master Report</h2>
            <p style="font-size: 18px; text-align: center; margin-bottom: 30px;"><strong>Total Outstanding:</strong> ₹${grandTotalDebt}</p>
      `;

      salesmanData.forEach(salesman => {
        if (salesman.totalDebt > 0 || salesman.assignedShops.length > 0) {
          htmlContent += `
            <div class="salesman-header">
              ${salesman.salesman || 'Unknown Salesman'} (Vehicle: ${salesman.name}) - Total Debt: ₹${salesman.totalDebt}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Area / Place</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
          `;
          
          if (salesman.assignedShops.length === 0) {
             htmlContent += `<tr><td colspan="3" style="text-align: center; color: gray;">No shops assigned.</td></tr>`;
          } else {
            salesman.assignedShops.forEach(shop => {
              const balanceClass = shop.currentBalance > 0 ? 'balance-red' : 'balance-green';
              htmlContent += `
                <tr>
                  <td>${shop.name || ''}</td>
                  <td>${shop.place || shop.area || ''}</td>
                  <td class="${balanceClass}">₹${shop.currentBalance || 0}</td>
                </tr>
              `;
            });
          }

          htmlContent += `
              </tbody>
            </table>
          `;
        }
      });

      htmlContent += `
            <div style="margin-top: 40px; padding: 15px; background-color: #fce4e4; border: 1px solid #f8caca; border-radius: 4px; text-align: center;">
              <h3 style="margin: 0; color: #d32f2f;">Grand Total Outstanding: ₹${grandTotalDebt}</h3>
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const generatePdf = () => {
          const opt = {
            margin:       10,
            filename:     'Admin_Master_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          window.html2pdf().set(opt).from(htmlContent).save();
        };

        if (!window.html2pdf) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = generatePdf;
          document.body.appendChild(script);
        } else {
          generatePdf();
        }
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.colors.primary, '#001D36']} style={styles.headerGradient}>
          <Animatable.View animation="fadeIn" style={[styles.headerContent, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Outstanding</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 2 }}>₹{grandTotalDebt}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <IconButton icon="file-pdf-box" iconColor="#fff" containerColor="#D32F2F" size={20} onPress={downloadPDF} style={{ margin: 0, marginRight: 8 }} />
              <IconButton icon="whatsapp" iconColor="#fff" containerColor="#25D366" size={20} onPress={sendAdminWhatsApp} style={{ margin: 0, marginRight: 8 }} />
              <IconButton icon="message-text" iconColor="#fff" containerColor="#007AFF" size={20} onPress={sendAdminSMS} style={{ margin: 0 }} />
            </View>
          </Animatable.View>
        </LinearGradient>

        <View style={styles.filtersSection}>
          <Searchbar
            placeholder="Search shops, owners, areas..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{ marginHorizontal: 16, marginBottom: 12, elevation: 0, backgroundColor: '#F1F5F9', borderRadius: 12, height: 44 }}
            inputStyle={{ minHeight: 44, paddingBottom: 0 }}
          />
          <Text style={styles.filterLabel}>Payment Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipScroll, { marginBottom: 12 }]}>
            <Chip selected={paymentFilter === 'all'} onPress={() => setPaymentFilter('all')} style={styles.chip} showSelectedOverlay>All</Chip>
            <Chip selected={paymentFilter === 'paid'} onPress={() => setPaymentFilter('paid')} style={styles.chip} showSelectedOverlay>Paid</Chip>
            <Chip selected={paymentFilter === 'notPaid'} onPress={() => setPaymentFilter('notPaid')} style={styles.chip} showSelectedOverlay>Not Paid</Chip>
          </ScrollView>

          <Text style={styles.filterLabel}>Filters:</Text>
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
        </View>
        <Animatable.View animation="fadeInUp" delay={200}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Debt by Salesman</Text>
          
          <View>
            {salesmanData.map((salesman, index) => (
              <Card key={salesman.id} style={styles.salesmanCard} elevation={2}>
                <Card.Title
                  title={salesman.salesman || 'Unknown Salesman'}
                  titleStyle={{ fontWeight: 'bold', fontSize: 18, color: theme.colors.primary }}
                  subtitle={`${salesman.name} • Total Debt: ₹${salesman.totalDebt}`}
                  subtitleStyle={{ color: salesman.totalDebt > 0 ? theme.colors.error : 'gray', fontWeight: 'bold' }}
                  left={props => <Avatar.Icon {...props} icon="account-tie" style={{ backgroundColor: '#E3F2FD' }} color="#1976D2" />}
                  right={props => (
                    <View style={{ flexDirection: 'row', marginRight: 8 }}>
                      <IconButton {...props} icon="whatsapp" iconColor="#25D366" onPress={() => sendWhatsApp(salesman)} />
                      <IconButton {...props} icon="message-text" iconColor="#007AFF" onPress={() => sendSMS(salesman)} />
                    </View>
                  )}
                  style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 8 }}
                />
                <Card.Content style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
                  {salesman.assignedShops.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: 'gray', paddingVertical: 16, fontStyle: 'italic' }}>No shops assigned.</Text>
                  ) : (
                    salesman.assignedShops.map((shop, idx) => (
                      <View key={shop.id} style={[styles.shopItem, idx === salesman.assignedShops.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: 'bold', color: '#333', fontSize: 15 }}>{shop.name}</Text>
                          <Text style={{ color: 'gray', fontSize: 12, marginTop: 2 }}>{shop.area ? `${shop.area}, ${shop.place}` : shop.place}</Text>
                        </View>
                        <View style={{ justifyContent: 'center' }}>
                          <Text style={{ fontWeight: '900', fontSize: 15, color: shop.currentBalance > 0 ? theme.colors.error : '#4CAF50' }}>
                            ₹{shop.currentBalance}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        </Animatable.View>
      </ScrollView>

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
  headerGradient: { padding: 16, paddingTop: 20, paddingBottom: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 0 },
  headerContent: {},
  filtersSection: { paddingBottom: 12, paddingTop: 16, backgroundColor: '#fff', elevation: 2, marginBottom: 12 },
  filterLabel: { marginLeft: 16, marginBottom: 8, color: 'gray', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10 },
  chipScroll: { paddingHorizontal: 16 },
  chip: { marginRight: 8, borderRadius: 20 },
  scrollContent: { paddingBottom: 60 },
  sectionTitle: { fontWeight: 'bold', color: '#333', marginBottom: 16, marginLeft: 20 },
  salesmanCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  shopItem: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FAFAFA' }
});
