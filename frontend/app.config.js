// app.config.js – Expo configuration that reads secrets from .env
import 'dotenv/config';

export default ({ config }) => ({
    ...config,
    name: "frontend",
    slug: "frontend",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "frontend",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    android: {
        adaptiveIcon: {
            backgroundColor: "#E6F4FE",
            foregroundImage: "./assets/images/android-icon-foreground.png",
            backgroundImage: "./assets/images/android-icon-background.png",
            monochromeImage: "./assets/images/android-icon-monochrome.png",
        },
        // Google Maps API key is injected from environment variable
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_API_KEY,
            },
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
    },
    ios: {
        supportsTablet: true,
        config: {
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
    },
    web: {
        output: "static",
        favicon: "./assets/images/favicon.png",
    },
    plugins: [
        "expo-router",
        [
            "expo-splash-screen",
            {
                image: "./assets/images/splash-icon.png",
                imageWidth: 200,
                resizeMode: "contain",
                backgroundColor: "#ffffff",
                dark: { backgroundColor: "#000000" },
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },
});
