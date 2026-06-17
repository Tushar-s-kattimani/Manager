import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import ShopsScreen from '../screens/ShopsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AddDebtScreen from '../screens/AddDebtScreen';
import ShopDetailsScreen from '../screens/ShopDetailsScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ setIsAuthenticated }) {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'view-dashboard';
          else if (route.name === 'Vehicles') iconName = 'truck';
          else if (route.name === 'Add Debt') iconName = 'cash-plus';
          else if (route.name === 'Shops') iconName = 'store';
          else if (route.name === 'History') iconName = 'history';
          else if (route.name === 'Reports') iconName = 'file-chart';
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 10,
        }
      })}
    >
      <Tab.Screen name="Dashboard">
        {(props) => <DashboardScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
      </Tab.Screen>
      <Tab.Screen name="Vehicles" component={VehiclesScreen} />
      <Tab.Screen name="Add Debt" component={AddDebtScreen} />
      <Tab.Screen name="Shops" component={ShopsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isAuthenticated, setIsAuthenticated }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Main">
            {(props) => <MainTabs {...props} setIsAuthenticated={setIsAuthenticated} />}
          </Stack.Screen>
          <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
