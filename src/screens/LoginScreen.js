import React, { useState } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();

  const handleLogin = () => {
    if (email === 'tusharshivakumarkattimani@gmail.com' && password === 'tushar@151571') {
      onLogin();
    } else {
      alert('Invalid Email or Password');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, '#001D36']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <Animatable.View animation="fadeInUp" duration={1000} style={styles.content}>
        <Surface style={styles.card} elevation={5}>
          <Animatable.View animation="bounceIn" delay={300} style={styles.logoContainer}>
            <LinearGradient
              colors={[theme.colors.secondary, '#8E001A']}
              style={styles.circlePlaceholder}
            >
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', fontStyle: 'italic' }}>PCM</Text>
            </LinearGradient>
          </Animatable.View>
          
          <Text style={[styles.title, { color: theme.colors.primary }]}>Admin Portal</Text>
          <Text style={styles.subtitle}>Manage your Pepsi Distribution</Text>
          
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
            theme={{ roundness: 12 }}
          />
          
          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
            theme={{ roundness: 12 }}
          />
          
          <Button 
            mode="contained" 
            onPress={handleLogin} 
            style={styles.button}
            contentStyle={{ paddingVertical: 10 }}
            buttonColor={theme.colors.primary}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          >
            SIGN IN
          </Button>
        </Surface>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { padding: 20, maxWidth: 500, width: '100%', alignSelf: 'center' },
  card: { padding: 30, borderRadius: 24, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 20, marginTop: -60 },
  circlePlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'gray', textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 16, backgroundColor: '#FAFAFA' },
  button: { marginTop: 12, borderRadius: 12 },
});
