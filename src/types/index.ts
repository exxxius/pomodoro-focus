export interface PomodoroSession {
  id: string;
  date: string;
  focusDuration: number;   // in seconds
  actualDuration: number;  // in seconds
  breakDuration: number;   // in seconds
  distractions: number;
  completed: boolean;
}

export interface CurrentSession {
  focusTime: number;    // in seconds
  breakTime: number;    // in seconds
  distractions: number;
}

export interface ActiveSession {
  isRunning: boolean;
  isBreak: boolean;
  timeLeft: number;     // in milliseconds
  startTime: number;    // timestamp
  distractions: number;
  focusTime: number;    // in milliseconds
  breakTime: number;    // in milliseconds
}

export interface TimerSettings {
  focusTime: number;    // in seconds
  breakTime: number;    // in seconds
}

export type NavigationParams = {
  Timer: undefined;
  Stats: {
    sessions: PomodoroSession[];
    currentSession: CurrentSession;
  };
  History: {
    sessions: PomodoroSession[];
  };
  Settings: undefined;
}