import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SETTINGS_KEY = '@pomodoro_settings';
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

export interface TimerSettings {
  focusTime: number;
  breakTime: number;
}

export default function SettingsScreen() {
  const [focusMinutes, setFocusMinutes] = useState('25');
  const [breakMinutes, setBreakMinutes] = useState('5');
  const navigation = useNavigation();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings: TimerSettings = JSON.parse(savedSettings);
        setFocusMinutes((settings.focusTime / 60).toString());
        setBreakMinutes((settings.breakTime / 60).toString());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    const focus = parseInt(focusMinutes);
    const break_ = parseInt(breakMinutes);

    if (isNaN(focus) || isNaN(break_) || focus <= 0 || break_ <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid numbers greater than 0');
      return;
    }

    try {
      const settings: TimerSettings = {
        focusTime: focus * 60,
        breakTime: break_ * 60,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      Alert.alert('Success', 'Settings saved successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const resetToDefaults = async () => {
    try {
      const settings: TimerSettings = {
        focusTime: DEFAULT_FOCUS_MINUTES * 60,
        breakTime: DEFAULT_BREAK_MINUTES * 60,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setFocusMinutes(DEFAULT_FOCUS_MINUTES.toString());
      setBreakMinutes(DEFAULT_BREAK_MINUTES.toString());
      Alert.alert('Success', 'Settings reset to defaults');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset settings');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Focus Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={focusMinutes}
          onChangeText={setFocusMinutes}
          keyboardType="numeric"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Break Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={breakMinutes}
          onChangeText={setBreakMinutes}
          keyboardType="numeric"
          placeholderTextColor="#666"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
        <Text style={styles.buttonText}>Save Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.saveButton, styles.resetButton]} 
        onPress={resetToDefaults}
      >
        <Text style={styles.buttonText}>Reset to Defaults</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});