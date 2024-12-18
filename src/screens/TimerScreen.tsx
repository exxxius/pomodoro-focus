import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AppState,
  AppStateStatus,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationParams } from '../types';
import { formatTime } from '../utils/timeFormatter';
import { 
  savePomodoroSession, 
  saveActiveSession, 
  getActiveSession, 
  clearActiveSession, 
  getPomodoroSessions 
} from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerSettings } from './SettingsScreen';

const SETTINGS_KEY = '@pomodoro_settings';
const DEFAULT_FOCUS_TIME = 25 * 60 * 1000;
const DEFAULT_BREAK_TIME = 5 * 60 * 1000;

export default function TimerScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_FOCUS_TIME);
  const [isBreak, setIsBreak] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const [focusTime, setFocusTime] = useState(DEFAULT_FOCUS_TIME);
  const [breakTime, setBreakTime] = useState(DEFAULT_BREAK_TIME);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialFocusTimeRef = useRef<number>(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation<StackNavigationProp<NavigationParams>>();

  useEffect(() => {
    loadActiveSession();
    return () => {
      if (isRunning && !isBreak && focusTime - timeLeft > 1000) {
        const session = createSessionObject(false);
        savePomodoroSession(session);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isRunning, timeLeft, isBreak, distractions, focusTime, breakTime]);

  const createSessionObject = (completed: boolean) => {
    const actualDuration = Math.max(0, initialFocusTimeRef.current - timeLeft);
    return {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      focusDuration: initialFocusTimeRef.current / 1000,
      actualDuration: actualDuration / 1000,
      breakDuration: breakTime / 1000,
      distractions: distractions,
      completed: completed,
    };
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings: TimerSettings = JSON.parse(savedSettings);
        const newFocusTime = settings.focusTime * 1000;
        const newBreakTime = settings.breakTime * 1000;
        setFocusTime(newFocusTime);
        setBreakTime(newBreakTime);
        if (!isRunning) {
          setTimeLeft(isBreak ? newBreakTime : newFocusTime);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      if (isRunning) {
        await saveActiveSession({
          isRunning: true,
          isBreak,
          timeLeft,
          startTime: startTimeRef.current,
          distractions,
          focusTime,
          breakTime,
        });
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else if (nextAppState === 'active') {
      loadActiveSession();
    }
  };

  const loadActiveSession = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings: TimerSettings = JSON.parse(savedSettings);
        setFocusTime(settings.focusTime * 1000);
        setBreakTime(settings.breakTime * 1000);
      }

      const activeSession = await getActiveSession();
      if (activeSession) {
        setIsBreak(activeSession.isBreak);
        setDistractions(activeSession.distractions);
        setFocusTime(activeSession.focusTime);
        setBreakTime(activeSession.breakTime);

        if (activeSession.isRunning) {
          const elapsedTime = Date.now() - activeSession.startTime;
          const remainingTime = activeSession.timeLeft - elapsedTime;

          if (remainingTime > 0) {
            setTimeLeft(remainingTime);
            startTimeRef.current = Date.now() - (activeSession.focusTime - remainingTime);
            initialFocusTimeRef.current = activeSession.focusTime;
            resumeTimer();
          } else {
            handleTimerComplete();
          }
        } else {
          setTimeLeft(activeSession.timeLeft);
        }
      } else {
        setTimeLeft(focusTime);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  };

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (!isBreak) {
        initialFocusTimeRef.current = focusTime;
      }
      startTimeRef.current = Date.now() - (focusTime - timeLeft);
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const total = isBreak ? breakTime : focusTime;
        const remaining = total - elapsed;
        
        if (remaining <= 0) {
          handleTimerComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 10);

      saveActiveSession({
        isRunning: true,
        isBreak,
        timeLeft,
        startTime: startTimeRef.current,
        distractions,
        focusTime,
        breakTime,
      });
    } else {
      pauseTimer();
    }
  };

  const resumeTimer = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const total = isBreak ? breakTime : focusTime;
      const remaining = total - elapsed;
      
      if (remaining <= 0) {
        handleTimerComplete();
      } else {
        setTimeLeft(remaining);
      }
    }, 10);

    saveActiveSession({
      isRunning: true,
      isBreak,
      timeLeft,
      startTime: startTimeRef.current,
      distractions,
      focusTime,
      breakTime,
    });
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    
    saveActiveSession({
      isRunning: false,
      isBreak,
      timeLeft,
      startTime: startTimeRef.current,
      distractions,
      focusTime,
      breakTime,
    });
  };

  const handleTimerComplete = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    
    if (!isBreak) {
      const session = createSessionObject(true);
      console.log('Saving completed session:', session);
      await savePomodoroSession(session);
      await clearActiveSession();

      const updatedSessions = await getPomodoroSessions();
      navigation.setParams({ sessions: updatedSessions });
    }

    setIsBreak(!isBreak);
    setTimeLeft(!isBreak ? breakTime : focusTime);
    setDistractions(0);
  };

  const handleDistraction = async () => {
    const newDistractions = distractions + 1;
    setDistractions(newDistractions);
    
    if (isRunning) {
      await saveActiveSession({
        isRunning,
        isBreak,
        timeLeft,
        startTime: startTimeRef.current,
        distractions: newDistractions,
        focusTime,
        breakTime,
      });
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetTimer = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Save incomplete session if it was a focus session
    if (!isBreak && focusTime - timeLeft > 1000) {
      const session = createSessionObject(false);
      console.log('Saving incomplete session on reset:', session);
      await savePomodoroSession(session);
    }

    setIsRunning(false);
    // Reset to full time based on current mode and toggle the mode
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(focusTime);
    } else {
      setIsBreak(true);
      setTimeLeft(breakTime);
    }
    setDistractions(0);
    await clearActiveSession();
  };

  const navigateToStats = async () => {
    const sessions = await getPomodoroSessions();
    navigation.navigate('Stats', {
      sessions,
      currentSession: {
        focusTime: focusTime / 1000,
        breakTime: breakTime / 1000,
        distractions
      }
    });
  };

  const navigateToHistory = async () => {
    const sessions = await getPomodoroSessions();
    navigation.navigate('History', { sessions });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      <Text style={styles.phaseText}>{isBreak ? 'Break Time' : 'Focus Time'}</Text>
      
      <TouchableOpacity 
        style={[styles.startButton, isRunning && styles.stopButton]}
        onPress={startTimer}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetTimer}
      >
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={styles.distractionButton}
          onPress={handleDistraction}
        >
          <Text style={styles.distractionCount}>{distractions}</Text>
          <Text style={styles.distractionText}>Distractions</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={navigateToStats}
        >
          <Text style={styles.navButtonText}>Session Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={navigateToHistory}
        >
          <Text style={styles.navButtonText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.navButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  phaseText: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    width: 200,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  resetButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    width: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  distractionButton: {
    width: 150,
    height: 150,
    backgroundColor: '#ff4444',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 5,
  },
  distractionCount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  distractionText: {
    color: '#ffffff',
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 30,
  },
  navButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});