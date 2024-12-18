import AsyncStorage from '@react-native-async-storage/async-storage';
import { PomodoroSession, ActiveSession } from '../types';

const STORAGE_KEY = '@pomodoro_sessions';
const ACTIVE_SESSION_KEY = '@pomodoro_active_session';
const SETTINGS_KEY = '@pomodoro_settings';

export const DEFAULT_SETTINGS = {
  focusTime: 25 * 60, // 25 minutes in seconds
  breakTime: 5 * 60,  // 5 minutes in seconds
};

export const savePomodoroSession = async (session: PomodoroSession): Promise<void> => {
  try {
    const existingSessions = await getPomodoroSessions();
    existingSessions.push(session);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingSessions));
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

export const saveActiveSession = async (session: ActiveSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving active session:', error);
  }
};

export const getActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const session = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Error loading active session:', error);
    return null;
  }
};

export const clearActiveSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing active session:', error);
  }
};

export const initializeSettings = async (): Promise<void> => {
  try {
    const existingSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!existingSettings) {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};

export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: typeof DEFAULT_SETTINGS): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};