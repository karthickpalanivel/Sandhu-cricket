import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import Screens
import SplashScreen from "./src/screens/SplashScreen";
import SetupScreen from "./src/screens/SetupScreen";
import ScorecardScreen from "./src/screens/Scorecard";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Scorecard" component={ScorecardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
