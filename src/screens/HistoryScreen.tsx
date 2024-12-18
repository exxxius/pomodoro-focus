import React, { useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  Text, 
  View, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { PomodoroSession, NavigationParams } from '../types';
import { getPomodoroSessions } from '../utils/storage';
import { useFocusEffect, RouteProp } from '@react-navigation/native';

type HistoryScreenRouteProp = RouteProp<NavigationParams, 'History'>;

type Props = Readonly<{
  route: HistoryScreenRouteProp;
}>;

export default function HistoryScreen({ route }: Props) {
  const [sessions, setSessions] = useState<PomodoroSession[]>(route.params.sessions);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useFocusEffect(
    React.useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      const loadedSessions = await getPomodoroSessions();
      const validSessions = loadedSessions.map(session => ({
        ...session,
        actualDuration: Math.max(0, session.actualDuration || 0),
        focusDuration: Math.max(0, session.focusDuration || 0),
        distractions: Math.max(0, session.distractions || 0),
      }));
      console.log('Loaded history sessions:', validSessions); // For debugging
      setSessions(sortSessions(validSessions, sortOrder));
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const sortSessions = (sessionsList: PomodoroSession[], order: 'asc' | 'desc') => {
    return [...sessionsList].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setSessions(sortSessions(sessions, newOrder));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateStats = () => {
    if (sessions.length === 0) return null;

    const completedSessions = sessions.filter(session => session.completed);
    
    const totalFocusTime = sessions.reduce((sum, session) => 
      sum + (session.actualDuration || 0), 0);
    
    const totalDistractions = sessions.reduce((sum, session) => 
      sum + (session.distractions || 0), 0);
    
    const avgFocusTime = totalFocusTime / sessions.length;
    const avgDistractions = totalDistractions / sessions.length;
    const completionRate = (completedSessions.length / sessions.length) * 100;

    const stats = {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      completionRate: completionRate.toFixed(1),
      totalFocusHours: (totalFocusTime / 3600).toFixed(1),
      avgFocusMinutes: Math.round(avgFocusTime / 60),
      avgDistractions: Math.round(avgDistractions),
    };

    console.log('Calculated stats:', stats); // For debugging
    return stats;
  };

  const stats = calculateStats();

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
      <Text style={styles.title}>Session History</Text>
      
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Overall Statistics</Text>
          <Text style={styles.statsText}>Total Sessions: {stats.totalSessions}</Text>
          <Text style={styles.statsText}>
            Completed Sessions: {stats.completedSessions} ({stats.completionRate}%)
          </Text>
          <Text style={styles.statsText}>Total Focus Time: {stats.totalFocusHours}h</Text>
          <Text style={styles.statsText}>Avg. Focus Time: {stats.avgFocusMinutes}min</Text>
          <Text style={styles.statsText}>Avg. Distractions: {stats.avgDistractions}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.sortButton} 
        onPress={toggleSortOrder}
      >
        <Text style={styles.sortButtonText}>
          Sort {sortOrder === 'asc' ? '↑' : '↓'}
        </Text>
      </TouchableOpacity>

      {sessions.length > 0 ? (
        sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <Text style={styles.sessionDate}>
              {formatDate(session.date)}
              <Text style={[
                styles.completionStatus, 
                session.completed ? styles.completedStatus : styles.incompletedStatus
              ]}>
                {session.completed ? ' ✓' : ' ⨯'}
              </Text>
            </Text>
            <View style={styles.sessionDetails}>
              <Text style={styles.sessionDetail}>
                Focus Time: {Math.round(session.actualDuration / 60)}/{Math.round(session.focusDuration / 60)} minutes
              </Text>
              <Text style={styles.sessionDetail}>
                Break Time: {Math.round(session.breakDuration / 60)} minutes
              </Text>
              <Text style={styles.sessionDetail}>
                Distractions: {session.distractions || 0}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No session history available</Text>
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
  statsTitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  statsText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
  },
  sortButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionCard: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sessionDate: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  completionStatus: {
    fontSize: 16,
    marginLeft: 8,
  },
  completedStatus: {
    color: '#4CAF50',
  },
  incompletedStatus: {
    color: '#f44336',
  },
  sessionDetails: {
    marginLeft: 10,
  },
  sessionDetail: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
  },
  noDataText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
});