import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import axios from 'axios';
import * as Location from 'expo-location';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

const Stack = createStackNavigator();

const LocationScreen = ({ navigation }) => {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!country || !state) {
      setError('Please enter both country and state');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const locationResponse = await axios.get(
        `https://api.weatherapi.com/v1/search.json?key=6f2c7b649071469c92185655252304&q=${state},${country}`
      );
      
      if (locationResponse.data && locationResponse.data.length > 0) {
        const { lat, lon } = locationResponse.data[0];
        navigation.navigate('Weather', { lat, lon });
      } else {
        setError('Location not found. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather App</Text>
      
      <TextInput
        label="Country"
        value={country}
        onChangeText={setCountry}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="State/Region"
        value={state}
        onChangeText={setState}
        style={styles.input}
        mode="outlined"
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Get Weather
      </Button>
      
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('Weather', { useCurrentLocation: true })}
        style={styles.button}
      >
        Use My Current Location
      </Button>
    </View>
  );
};

const WeatherScreen = ({ route, navigation }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { lat, lon, useCurrentLocation } = route.params || {};

  const fetchWeather = async () => {
    try {
      let locationCoords = { lat, lon };
      
      if (useCurrentLocation) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        locationCoords = {
          lat: location.coords.latitude,
          lon: location.coords.longitude
        };
      }

      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=6f2c7b649071469c92185655252304&q=${locationCoords.lat},${locationCoords.lon}&days=1&aqi=no&alerts=no`
      );
      
      setWeather(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [lat, lon, useCurrentLocation]);

  const getWeatherVisual = (condition) => {
    const conditionText = condition?.toLowerCase();
    
    if (conditionText?.includes('sunny') || conditionText?.includes('clear')) {
      return require('./assets/sun.png');
    } else if (conditionText?.includes('cloud')) {
      return require('./assets/clouds.png');
    } else if (conditionText?.includes('rain')) {
      return require('./assets/rainy.png');
    } else if (conditionText?.includes('snow')) {
      return require('./assets/snowy.png');
    } else {
      return require('./assets/default.png');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No weather data available</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const current = weather.current;
  const location = weather.location;
  const weatherVisual = getWeatherVisual(current?.condition?.text);

  return (
    <ScrollView contentContainerStyle={styles.weatherContainer}>
      <Text style={styles.locationText}>
        {location?.name}, {location?.region}, {location?.country}
      </Text>
      
      <Text style={styles.tempText}>{current?.temp_c}°C</Text>
      <Text style={styles.conditionText}>{current?.condition?.text}</Text>
      
      <Image 
        source={weatherVisual}
        style={styles.weatherImage}
        resizeMode="contain"
      />
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Feels Like</Text>
          <Text style={styles.detailValue}>{current?.feelslike_c}°C</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{current?.humidity}%</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind</Text>
          <Text style={styles.detailValue}>{current?.wind_kph} km/h</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pressure</Text>
          <Text style={styles.detailValue}>{current?.pressure_mb} mb</Text>
        </View>
      </View>
      
      <Button
        mode="contained"
        onPress={fetchWeather}
        style={styles.button}
      >
        Refresh
      </Button>
      
      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
        Search Another Location
      </Button>
    </ScrollView>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Location">
        <Stack.Screen name="Location" component={LocationScreen} />
        <Stack.Screen 
          name="Weather" 
          component={WeatherScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  weatherContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  locationText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',  
  },
  tempText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: '#333',
  },
  conditionText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  weatherImage: {
    width: 250,
    height: 250,
    marginVertical: 20,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
    paddingHorizontal: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 10, 
  },
  detailItem: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,      
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,    
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
