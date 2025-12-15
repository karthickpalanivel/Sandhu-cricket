import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { Activity } from "lucide-react-native"; // CORRECT IMPORT for Mobile

const { width } = Dimensions.get("window");

const SplashScreen = ({ onFinish, navigation }) => {
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Start Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500, // Load time
        useNativeDriver: false, // Width cannot use native driver
      }),
    ]).start();

    // 2. Navigate away after 2.5 seconds
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish(); // If using State-based navigation (like the web demo)
      } else if (navigation) {
        navigation.replace("Setup"); // If using React Navigation Stack
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Interpolate width for the progress bar
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Background Decoration (Lightweight Circles) */}
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Logo Box */}
        <View style={styles.logoContainer}>
          <Activity size={48} color="#ffffff" strokeWidth={2.5} />
        </View>

        {/* Title */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            SANDHU<Text style={styles.highlight}>CRICKET</Text>
          </Text>
          <Text style={styles.subtitle}>A Palanivel Jr. Product</Text>
        </View>

        {/* Loading Bar */}
        <View style={styles.loaderContainer}>
          <Animated.View
            style={[styles.loaderFill, { width: progressWidth }]}
          />
        </View>
      </Animated.View>

      <Text style={styles.footer}>v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Slate 900
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  // Decorative Background Circles
  circle: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width / 2,
    opacity: 0.1,
  },
  circleTop: {
    top: -width * 0.2,
    left: -width * 0.2,
    backgroundColor: "#10b981", // Emerald
  },
  circleBottom: {
    bottom: -width * 0.2,
    right: -width * 0.2,
    backgroundColor: "#2563eb", // Blue
  },
  content: {
    alignItems: "center",
    zIndex: 10,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#10b981", // Emerald 500
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 10, // Shadow for Android
    shadowColor: "#10b981", // Shadow for iOS
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    transform: [{ rotate: "-5deg" }], // Slight tilt for style
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  highlight: {
    color: "#34d399", // Emerald 400
  },
  subtitle: {
    color: "#64748b", // Slate 500
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 3,
    marginTop: 5,
  },
  loaderContainer: {
    width: 200,
    height: 4,
    backgroundColor: "#1e293b", // Slate 800
    borderRadius: 2,
    overflow: "hidden",
  },
  loaderFill: {
    height: "100%",
    backgroundColor: "#34d399",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    color: "#334155",
    fontSize: 10,
  },
});

export default SplashScreen;
