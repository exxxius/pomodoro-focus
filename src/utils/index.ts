// src/utils/timeFormatter.ts
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // src/utils/storage.ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { PomodoroSession } from '../types';
  
  const STORAGE_KEY = '@pomodoro_sessions';
  
  export const savePomodoroSession = async (session: PomodoroSession): Promise<void> => {
    try {
      const existingSessions = await AsyncStorage.getItem(STORAGE_KEY);
      const sessions: PomodoroSession[] = existingSessions ? JSON.parse(existingSessions) : [];
      sessions.push(session);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };
  
  export const getPomodoroSessions = async (): Promise<PomodoroSession[]> => {
    try {
      const sessions = await AsyncStorage.getItem(STORAGE_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  };