import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const CustomMapView = forwardRef(({ origin, destination, trackingPoints = [], currentLocation = null }, ref) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapViewRef = useRef(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      if (mapViewRef.current) {
        mapViewRef.current.animateToRegion(region, duration);
      }
    }
  }));

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  if (!mapLoaded) {
    return <View style={styles.container} />;
  }

  // Calculate center and region
  const allCoordinates = [];
  if (origin) {
    allCoordinates.push({
      latitude: origin.coordinates.lat,
      longitude: origin.coordinates.lng
    });
  }
  if (destination) {
    allCoordinates.push({
      latitude: destination.coordinates.lat,
      longitude: destination.coordinates.lng
    });
  }
  if (currentLocation) {
    allCoordinates.push({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng
    });
  }

  const centerLat = allCoordinates.length > 0
    ? allCoordinates.reduce((sum, coord) => sum + coord.latitude, 0) / allCoordinates.length
    : 0;
  const centerLng = allCoordinates.length > 0
    ? allCoordinates.reduce((sum, coord) => sum + coord.longitude, 0) / allCoordinates.length
    : 0;

  const region = {
    latitude: centerLat || 0,
    longitude: centerLng || 0,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  };

  // Safety check for Marker and Polyline
  if (!Marker || !Polyline) {
    console.error('Marker or Polyline not available from react-native-maps');
    return (
      <View style={styles.container}>
        <View style={styles.map}>
          <Text style={{ padding: 20, textAlign: 'center' }}>
            Map components not available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
      >

        {origin && Marker && (
          <Marker
            coordinate={{
              latitude: origin.coordinates.lat,
              longitude: origin.coordinates.lng
            }}
            title="Origin"
            pinColor="#1E3A5F"
          />
        )}

        {destination && Marker && (
          <Marker
            coordinate={{
              latitude: destination.coordinates.lat,
              longitude: destination.coordinates.lng
            }}
            title="Destination"
            pinColor="#1E3A5F"
          />
        )}

        {currentLocation && Marker && (
          <Marker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng
            }}
            title="Current Location"
            pinColor="#007AFF"
          />
        )}

        {/* Route line from origin to destination */}
        {origin && destination && Polyline && (
          <Polyline
            coordinates={[
              {
                latitude: origin.coordinates.lat,
                longitude: origin.coordinates.lng
              },
              {
                latitude: destination.coordinates.lat,
                longitude: destination.coordinates.lng
              }
            ]}
            strokeColor="#9B59B6"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Tracking path polyline */}
        {trackingPoints && trackingPoints.length > 1 && Polyline && (
          <Polyline
            coordinates={trackingPoints.map(p => ({
              latitude: p.lat,
              longitude: p.lng
            }))}
            strokeColor="#9B59B6"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
});

CustomMapView.displayName = 'CustomMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.5
  },
  map: {
    flex: 1
  }
});

export default CustomMapView;
