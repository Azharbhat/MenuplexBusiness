import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, Switch, Alert, BackHandler } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../Firebase/FirebaseConfig';
import { ref, push } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState(null);
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Open'); // Default status is 'Open'
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [homeDelivery, setHomeDelivery] = useState(false); // Default home delivery is 'No'
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('tomato');
  const [selectedImage, setSelectedImage] = useState('Select Image'); // Default background color

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  const handleRegistration = async () => {
    try {
      // Validation
      if (!email || !password || !name || !restaurantName || !phoneNumber || !address || !openingTime || !closingTime || !location || !image) {
        Alert.alert('Validation Error', 'Please fill in all the fields.');
        return;
      }
      // Sign up
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const userToken = user.accessToken;
      await AsyncStorage.setItem('LetsEatBusinessToken', userToken);
      // Store user data in the database
      const userData = {
        id: user.uid,
        name,
        restaurantName,
        phoneNumber,
        image: image ? image : '', // Set image URL if available
        address,
        status: 'open',
        openingTime,
        closingTime,
        homeDelivery,
        geoLocation: location,
        Rating: 5,
      };

      const userRef = ref(database, 'Restaurants');
      push(userRef, userData);
      // Display success message
      alert('Success', 'User registered successfully!');
      await AsyncStorage.setItem('LetsEatBusinessToken', userToken);
    } catch (error) {
      console.error('Registration error:', error.message);
      alert('Error', error.message);
    }
  };

  const selectImage = async () => {
    try {
      let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        console.log('Permission to access camera roll is required!');
        return;
      }
  
      let pickerResult = await ImagePicker.launchImageLibraryAsync();
      if (pickerResult.cancelled === true) {
        console.log('Image selection cancelled');
        return;
      }
  
      // Get the file URI
      const fileUri = pickerResult.assets[0].uri;
  
      // Read the file contents as a base64 string
      const base64String = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  
      // Set the base64 string as the image data
      setImage(`data:image/jpeg;base64,${base64String}`);
    } catch (error) {
      console.error('Error selecting image:', error);
      setErrorMsg('Error selecting image');
    }
  };
  
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
  
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
  
      // Change background color to green
      setBackgroundColor('green');
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Error getting location');
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ImageBackground source={require('../../images/background.jpg')} style={styles.imageBackground}>
        <View style={[styles.formContainer, styles.glassContainer]}>
          <Text style={styles.title}>Let's Eat</Text>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' }}>
            <Text style={styles.title}>Wellcome</Text>
            <Text style={styles.title}>Register</Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="restaurant" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholder="Restaurant Name"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="call" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone Number"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="alarm" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={openingTime}
              onChangeText={setOpeningTime}
              placeholder="Opening Time"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="alarm" size={24} color="black" />
            <TextInput
              style={styles.input}
              value={closingTime}
              onChangeText={setClosingTime}
              placeholder="Closing Time"
            />
          </View>
          {/* this is for bottom row */}
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={styles.inputContainer}>
              <TouchableOpacity style={[styles.getLocationButton, { backgroundColor }]} onPress={getLocation}>
                <Ionicons name="navigate" size={24} color="black" />
                <Text style={{ fontSize: 10, color: 'white' }}>TurnItGreen</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="home" size={24} color="black" />
              <Text style={styles.inputLabel}>Delivery</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={homeDelivery ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => setHomeDelivery(!homeDelivery)}
                value={homeDelivery}
              />
            </View>
            <TouchableOpacity style={styles.inputContainer} onPress={selectImage}>
              <Ionicons name="image" size={24} color="black" />
              <Text style={styles.imageButtonText}>{selectedImage}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerButton} onPress={handleRegistration}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'tomato',
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background color
    borderRadius: 16,
    alignItems: 'center',
    // Apply blur effect
    backdropFilter: 'blur(5px)',
    // Add box shadow for better contrast
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  formContainer: {
    paddingHorizontal: 10,
    marginHorizontal: 20
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    marginLeft: 8,
    marginRight: 16,
    fontSize: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  getLocationButton: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 16,
    alignSelf: 'center',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  imageButtonText: {
    color: 'black',
    fontSize: 16,
    marginLeft: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 5,
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: 16,
  },
  registerButton: {
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 8,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: 'tomato',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  errorMsg: {
    color: 'red',
    marginBottom: 10,
  },
});

export default RegisterScreen;
