import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@features/home/screens/HomeScreen';
import { CategoryProductsScreen } from '@features/categories/screens/CategoryProductsScreen';
import { ProductDetailsScreen } from '@features/products/screens/ProductDetailsScreen';
import { SearchScreen } from '@features/search/screens/SearchScreen';
import { BrandScreen } from '@features/brands/screens/BrandScreen';
import { ChatScreen } from '@features/chat/screens/ChatScreen';
import { colors } from '@theme/colors';
import { strings } from '@utils/strings';

export type CategoryProductsParams = {
  /** Canonical category name, e.g. "Ready to Wear". Sent as ?category=. */
  category: string;
  /** Display title for the header. */
  title: string;
};

export type BrandParams = {
  /** The merchant's own brand name, e.g. "HSY" or "J. (Junaid Jamshed)". */
  brand: string;
  /** Display title for the header. Defaults to the brand name. */
  title?: string;
};

export type ProductDetailsParams = {
  /** `brand:handle`, the same value as Product.id. */
  slug: string;
  /** Where the shopper came from, recorded on analytics events. */
  source?: string;
};

export type RootStackParamList = {
  Main: undefined;
  Search: undefined;
  Chat: undefined;
  Brand: BrandParams;
  CategoryProducts: CategoryProductsParams;
  ProductDetails: ProductDetailsParams;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={HomeScreen} />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: true,
          title: strings.searchTitle,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="Brand"
        component={BrandScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.title ?? route.params.brand,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        })}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{
          headerShown: true,
          title: strings.productDetailsTitle,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: strings.chatTitle,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        }}
      />
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
