import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useFlight } from '../context/FlightContext';
import { PopularRoute, RecentSearch } from '../types/flight';

type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  FlightSearch: undefined;
  FlightResults: { searchRequest: import('../types/flight').FlightSearchRequest };
};

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { 
    popularRoutes, 
    recentSearches, 
    isLoading, 
    searchError,
    getPopularRoutes,
    getRecentSearches 
  } = useFlight();

  // Load data on component mount
  useEffect(() => {
    getPopularRoutes();
    getRecentSearches();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Landing');
          },
        },
      ]
    );
  };

  const handleQuickSearch = (route: PopularRoute) => {
    // For now, just show an alert. In a full implementation, 
    // this would navigate to a search screen with pre-filled data
    Alert.alert(
      'Quick Search',
      `Search flights from ${route.originName} to ${route.destinationName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Search', onPress: () => console.log('Navigate to search with route:', route) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Welcome to GFlights</Text>
            <Text style={styles.subtitle}>
              Hello, {user?.name || 'User'}! Your flight booking companion
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.searchCard}>
            <Text style={styles.searchTitle}>Search Flights</Text>
            <Text style={styles.searchDescription}>
              Find the best flight deals to your dream destination
            </Text>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => navigation.navigate('FlightSearch')}
            >
              <Text style={styles.searchButtonText}>Start Searching</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>✈️ Flight Search</Text>
              <Text style={styles.featureDescription}>
                Compare prices from multiple airlines and find the best deals
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>🏨 Hotel Booking</Text>
              <Text style={styles.featureDescription}>
                Book accommodations at your destination with exclusive rates
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>📱 Easy Booking</Text>
              <Text style={styles.featureDescription}>
                Simple and secure booking process with instant confirmation
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureTitle}>💳 Flexible Payment</Text>
              <Text style={styles.featureDescription}>
                Multiple payment options including installment plans
              </Text>
            </View>
          </View>

          <View style={styles.popularSection}>
            <Text style={styles.sectionTitle}>Popular Routes</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading popular routes...</Text>
              </View>
            ) : (
              popularRoutes.slice(0, 4).map((route, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.popularCard}
                  onPress={() => handleQuickSearch(route)}
                >
                  <View style={styles.popularRouteInfo}>
                    <Text style={styles.popularRoute}>
                      {route.originName} → {route.destinationName}
                    </Text>
                    <Text style={styles.popularPrice}>
                      From ${route.averagePrice}
                    </Text>
                  </View>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentSearches.length > 0 ? (
              recentSearches.slice(0, 3).map((search, index) => (
                <View key={search.id} style={styles.recentCard}>
                  <View style={styles.recentRouteInfo}>
                    <Text style={styles.recentRoute}>
                      {search.origin} → {search.destination}
                    </Text>
                    <Text style={styles.recentPassengers}>
                      {search.passengers} passenger{search.passengers > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.recentDate}>
                    {formatDate(search.searchedAt)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No recent searches yet. Start exploring!
                </Text>
              </View>
            )}
          </View>

          {searchError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{searchError}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  searchDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 24,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  popularSection: {
    marginBottom: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  popularCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  popularRouteInfo: {
    flex: 1,
  },
  popularRoute: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  popularPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  popularBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 32,
  },
  recentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentRouteInfo: {
    flex: 1,
  },
  recentRoute: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  recentPassengers: {
    fontSize: 14,
    color: '#666666',
  },
  recentDate: {
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
});

export default HomeScreen;
