import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const USER_EMAIL = 'tusharshivakumarkattimani@gmail.com';
const USER_PATH = `users/${USER_EMAIL}`;

const AppContext = createContext();

export function AppProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);
  const [shops, setShops] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let shopsLoaded = false;
    let vehiclesLoaded = false;

    const checkLoading = () => {
      if (shopsLoaded && vehiclesLoaded) {
        setLoading(false);
      }
    };

    const unsubscribeVehicles = onSnapshot(collection(db, `${USER_PATH}/vehicles`), (snapshot) => {
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      vehiclesLoaded = true;
      checkLoading();
    });

    const unsubscribeShops = onSnapshot(collection(db, `${USER_PATH}/shops`), (snapshot) => {
      setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      shopsLoaded = true;
      checkLoading();
    });

    // Transactions load silently in the background without blocking the app
    const unsubscribeTransactions = onSnapshot(collection(db, `${USER_PATH}/transactions`), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeVehicles();
      unsubscribeShops();
      unsubscribeTransactions();
    };
  }, []);

  const formatDate = (dateObj) => {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  };

  // Vehicle Actions
  const addVehicle = async (vehicle) => await addDoc(collection(db, `${USER_PATH}/vehicles`), vehicle);
  const updateVehicle = async (id, updatedData) => await updateDoc(doc(db, `${USER_PATH}/vehicles`, id), updatedData);
  const deleteVehicle = async (id) => await deleteDoc(doc(db, `${USER_PATH}/vehicles`, id));

  // Shop Actions
  const addShop = async (shop) => {
    const shopData = { 
      currentBalance: 0, 
      lastTransactionDate: formatDate(new Date()),
      ...shop 
    };
    
    const shopRef = await addDoc(collection(db, `${USER_PATH}/shops`), shopData);

    if (shopData.currentBalance > 0) {
      await addDoc(collection(db, `${USER_PATH}/transactions`), {
        shopId: shopRef.id,
        type: 'debt',
        amount: Number(shopData.currentBalance),
        date: shopData.orderDate || shopData.lastTransactionDate,
        mode: 'Credit',
        balanceAfter: Number(shopData.currentBalance)
      });
    }
  };
  const updateShop = async (id, updatedData) => await updateDoc(doc(db, `${USER_PATH}/shops`, id), updatedData);
  const deleteShop = async (id) => await deleteDoc(doc(db, `${USER_PATH}/shops`, id));

  // Payment Actions
  const recordPayment = async (shopId, paymentDetails) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    
    const paymentAmount = Number(paymentDetails.amount);
    const newBalanceRecord = Math.max(0, Number(shop.currentBalance) - paymentAmount);
    
    await updateDoc(doc(db, `${USER_PATH}/shops`, shopId), {
      currentBalance: newBalanceRecord,
      paymentStatus: newBalanceRecord === 0 ? 'Paid' : 'Partial',
      lastPaymentMode: paymentDetails.mode,
      lastPaymentAmount: paymentAmount,
      lastPaymentDate: paymentDetails.date
    });

    await addDoc(collection(db, `${USER_PATH}/transactions`), {
      shopId: shopId,
      type: 'payment',
      amount: paymentAmount,
      date: paymentDetails.date,
      mode: paymentDetails.mode,
      balanceAfter: newBalanceRecord
    });
  };

  return (
    <AppContext.Provider value={{
      vehicles, addVehicle, updateVehicle, deleteVehicle,
      shops, addShop, updateShop, deleteShop, recordPayment,
      transactions, loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
