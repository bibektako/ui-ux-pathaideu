import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Linking
} from 'react-native';
import { Video } from 'expo-av';
import { getImageUri } from '../utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AD_HEIGHT = 120;
const AUTO_SCROLL_INTERVAL = 6500; // 6.5 seconds

const AdCarousel = ({ ads, style }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (ads.length <= 1) return;

    // Auto-scroll every 6.5 seconds
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ads.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads.length]);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };


  const handleAdPress = (ad) => {
    if (ad.link) {
      Linking.openURL(ad.link).catch(err => console.error('Error opening link:', err));
    }
  };

  if (!ads || ads.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderAd}>
          {/* Empty state - no ads */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
      >
        {ads.map((ad, index) => (
          <TouchableOpacity
            key={ad._id || index}
            style={[styles.adItem, { width: SCREEN_WIDTH - 30 }]}
            activeOpacity={ad.link ? 0.8 : 1}
            onPress={() => handleAdPress(ad)}
            disabled={!ad.link}
          >
            {ad.fileType === 'video' ? (
              <Video
                source={{ uri: getImageUri(ad.file) }}
                style={styles.adMedia}
                resizeMode="cover"
                shouldPlay
                isLooping
                isMuted
                useNativeControls={false}
                onError={(error) => {
                  console.error('❌ Ad video error:', error, ad.file);
                }}
                onLoad={() => {
                  console.log('✅ Ad video loaded:', ad.file);
                }}
              />
            ) : (
              <Image
                source={{ uri: getImageUri(ad.file) }}
                style={styles.adMedia}
                resizeMode="cover"
                onError={(error) => {
                  console.error('❌ Ad image error:', error.nativeEvent.error, ad.file);
                }}
                onLoad={() => {
                  console.log('✅ Ad image loaded:', ad.file);
                }}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots indicator */}
      {ads.length > 1 && (
        <View style={styles.dotsContainer}>
          {ads.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: AD_HEIGHT,
    position: 'relative'
  },
  placeholderAd: {
    height: AD_HEIGHT,
    backgroundColor: '#4A90E2',
    borderRadius: 12
  },
  adItem: {
    height: AD_HEIGHT,
    marginHorizontal: 7.5,
    borderRadius: 12,
    overflow: 'hidden'
  },
  adMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4
  }
});

export default AdCarousel;

