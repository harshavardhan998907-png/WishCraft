import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthScreen } from '../screens/AuthScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { BrowseScreen } from '../screens/BrowseScreen'
import { EditorScreen } from '../screens/EditorScreen'
import { PreviewScreen } from '../screens/PreviewScreen'
import { WishScreen } from '../screens/WishScreen'
import { DashboardScreen } from '../screens/DashboardScreen'

const Stack = createNativeStackNavigator()

const linking = {
  prefixes: ['templatehub://'],
  config: { screens: { Wish: 'w/:slug' } },
}

export function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Browse" component={BrowseScreen} />
        <Stack.Screen name="Editor" component={EditorScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="Wish" component={WishScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
