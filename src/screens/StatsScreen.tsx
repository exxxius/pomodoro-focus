import React, { useState } from 'react';
import { 
  View,
  StyleSheet, 
  Text, 
  ScrollView, 
  Dimensions, 
  RefreshControl 
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { PomodoroSession, NavigationParams } from '../types';
import { getPomodoroSessions } from '../utils/storage';
import { useFocusEffect, RouteProp } from '@react-navigation/native';

type StatsScreenRouteProp = RouteProp<NavigationParams, 'Stats'>;

type Props = Readonly<{
  route: StatsScreenRouteProp;
}>;

export default function StatsScreen({ route }: Props) {
  const [sessions, setSessions] = useState<PomodoroSession[]>(route.params.sessions);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get('window').width - 40;

  useFocusEffect(
    React.useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      const allSessions = await getPomodoroSessions();
      if (allSessions && allSessions.length > 0) {
        const validSessions = allSessions.map(session => ({
          ...session,
          actualDuration: Math.max(0, session.actualDuration || 0),
          focusDuration: Math.max(0, session.focusDuration || 0),
          distractions: Math.max(0, session.distractions || 0),
        }));
        console.log('Loaded sessions:', validSessions);
        setSessions(validSessions.slice(-6).reverse());
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const calculateStats = () => {
    if (sessions.length === 0) return null;

    const completedSessions = sessions.filter(session => session.completed);
    const totalFocusMinutes = sessions.reduce((sum, session) => 
      sum + (session.actualDuration || 0), 0) / 60;
    const totalDistractions = sessions.reduce((sum, session) => 
      sum + (session.distractions || 0), 0);
    
    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      completionRate: ((completedSessions.length / sessions.length) * 100).toFixed(1),
      totalFocusHours: (totalFocusMinutes / 60).toFixed(2),
      avgFocusMinutes: (totalFocusMinutes / sessions.length).toFixed(1),
      avgDistractions: Math.round(totalDistractions / sessions.length)
    };
  };

  const getFocusTimeData = () => {
    // Sort sessions by date ascending
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const focusData = sortedSessions.map(session => ({
      minutes: Math.round((session.actualDuration || 0) / 60),
      planned: Math.round((session.focusDuration || 0) / 60),
    }));
    
    return {
      labels: sortedSessions.map((_, index) => `S${index + 1}`),
      datasets: [{
        data: focusData.map(d => d.minutes),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };
  
  const getDistractionsData = () => {
    // Sort sessions by date ascending
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const distractionData = sortedSessions.map(session => ({
      count: session.distractions || 0,
    }));
    
    return {
      labels: sortedSessions.map((_, index) => `S${index + 1}`),
      datasets: [{
        data: distractionData.map(d => d.count),
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const stats = calculateStats();
  const chartConfig = {
    backgroundColor: '#1a1a1a',
    backgroundGradientFrom: '#1a1a1a',
    backgroundGradientTo: '#1a1a1a',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 12,
      fill: 'white',
    },
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#ffffff"
        />
      }
    >
      <Text style={styles.title}>Session Statistics</Text>
      
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Sessions Completed: {stats.completedSessions}/{stats.totalSessions} ({stats.completionRate}%)
          </Text>
          <Text style={styles.statsText}>
            Total Focus Time: {parseFloat(stats.totalFocusHours) > 0 
              ? `${stats.totalFocusHours}h` 
              : `${(parseFloat(stats.totalFocusHours) * 60).toFixed(1)}m`}
          </Text>
          <Text style={styles.statsText}>
            Avg. Focus Time: {stats.avgFocusMinutes}min
          </Text>
          <Text style={styles.statsText}>
            Avg. Distractions: {stats.avgDistractions}
          </Text>
        </View>
      )}

      {sessions.length > 0 ? (
        <>
          <Text style={styles.subtitle}>Focus Time (minutes)</Text>
          <LineChart
            data={getFocusTimeData()}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix="m"
            fromZero
          />

          <Text style={styles.subtitle}>Distractions</Text>
          <LineChart
            data={getDistractionsData()}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisLabel=""
            fromZero
          />

          <Text style={styles.sessionListTitle}>Recent Sessions</Text>
          {sessions.map((session) => (
            <Text key={session.id} style={styles.sessionText}>
              {new Date(session.date).toLocaleString()}{'\n'}
              Focus: {Math.round(session.actualDuration / 60)}/{Math.round(session.focusDuration / 60)}min, 
              Distractions: {session.distractions || 0}
              {session.completed ? ' ✓' : ' ⨯'}
            </Text>
          ))}
        </>
      ) : (
        <Text style={styles.noDataText}>Complete a focus session to see statistics</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statsText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
    paddingLeft: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 40,
  },
  noDataText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  sessionListTitle: {
    fontSize: 20,
    color: '#ffffff',
    marginTop: 30,
    marginBottom: 10,
  },
  sessionText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 15,
    paddingLeft: 10,
    lineHeight: 20,
  },
});