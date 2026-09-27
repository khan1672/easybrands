import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@features/home/screens/HomeScreen';
import { CategoryProductsScreen } from '@features/categories/screens/CategoryProductsScreen';
import { colors } from '@theme/colors';

export type CategoryProductsParams = {
  /** Canonical category name, e.g. "Ready to Wear". Sent as ?category=. */
  category: string;
  /** Display title for the header. */
  title: string;
};

export type RootStackParamList = {
  Main: undefined;
  CategoryProducts: CategoryProductsParams;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={HomeScreen} />
      <Stack.Screen
        name="CategoryProducts"
        component={CategoryProductsScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.title,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        })}
      />
    </Stack.Navigator>
  );
};
