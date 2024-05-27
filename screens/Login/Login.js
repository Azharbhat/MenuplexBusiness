import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../Firebase/FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Import BlurView from expo-blur
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthentication = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      const userToken = user.user.accessToken;
      await AsyncStorage.setItem('LetsEatBusinessToken', userToken);
      console.log('User signed in successfully!');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../../images/background.jpg')} style={styles.imageBackground}>
        <BlurView intensity={50} style={StyleSheet.absoluteFill}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.glassContainer}>
              <Text style={styles.title}>Let's Eat</Text>
              <Text style={styles.title}>Welcome Back</Text>
              <Feather name="user" size={60} color="tomato" style={styles.icon} />

              <View style={styles.inputContainer}>
                <Feather name="mail" size={24} color="tomato" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Feather name="lock" size={24} color="tomato" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry
                />
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={20} color="red" style={styles.errorIcon} />
                  <Text style={styles.errorMessageText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.button} onPress={handleAuthentication}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>

              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={navigateToRegister}>
                  <Text style={{ color: 'green' }}>Go to Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    marginBottom: 16,
    fontWeight: 'bold',
    color: 'tomato',
  },
  icon: {
    margin: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'tomato',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 20,
    color: 'black',
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorMessageText: {
    color: 'red',
    fontSize: 16,
  },
});

export default LoginScreen;
