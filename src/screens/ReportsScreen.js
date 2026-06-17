import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { Text, useTheme, Card, List, Avatar, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAppContext } from '../context/AppContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const theme = useTheme();
  const { shops, vehicles } = useAppContext();

  // Calculate Grand Total
  const grandTotalDebt = shops.reduce((sum, shop) => sum + shop.currentBalance, 0);

  // Group shops by Salesman (Vehicle)
  const salesmanData = vehicles.map(vehicle => {
    const assignedShops = shops.filter(s => s.vehicleId === vehicle.id);
    const totalDebt = assignedShops.reduce((sum, shop) => sum + shop.currentBalance, 0);
    return {
      ...vehicle,
      assignedShops,
      totalDebt
    };
  }).sort((a, b) => b.totalDebt - a.totalDebt); // Sort by highest debt

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { padding: 16, paddingTop: 20, paddingBottom: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginBottom: 12 },
  headerContent: {},
  scrollContent: { padding: 16, paddingBottom: 60 },
  sectionTitle: { fontWeight: 'bold', color: '#333', marginBottom: 16, marginLeft: 4 },
  salesmanCard: { marginBottom: 16, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  shopItem: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FAFAFA' }
});
