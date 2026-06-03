/**
 * Enhanced Progress Tracking System
 * Comprehensive learning analytics and metrics
 */

import { ClassLevel } from '../context/UserContext';

export interface ProgressMetric {
  topicId: string;
  topicName: string;
  classLevel: ClassLevel;
  lastAccessed: number; // timestamp
  viewCount: number;
  questionsAttempted: number;
  questionsCorrect: number;
  videosWatched: number;
  totalVideoMinutes: number;
  estimatedCompletion: number; // 0-100%
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
}

export interface LearningStats {
  totalTopicsStarted: number;
  totalTopicsCompleted: number;
  totalTopicsMastered: number;
  totalStudyHours: number;
  averageAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  classLevel: ClassLevel;
}

export interface StudySession {
  id: string;
  topicId: string;
  topicName: string;
  startTime: number;
  endTime: number;
  duration: number;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  videosWatched: number;
  totalVideoMinutes: number;
  notes?: string;
}

export class ProgressTracker {
  private static storageKey = 'axyomis_progress';
  private static statsKey = 'axyomis_stats';
  private static sessionKey = 'axyomis_session';

  /**
   * Record a topic view/access
   */
  static recordTopicAccess(
    topicId: string,
    topicName: string,
    classLevel: ClassLevel
  ): ProgressMetric {
    const metrics = this.getMetric(topicId) || this.createMetric(topicId, topicName, classLevel);
    
    metrics.lastAccessed = Date.now();
    metrics.viewCount += 1;
    
    if (metrics.status === 'not-started') {
      metrics.status = 'in-progress';
    }

    this.saveMetric(topicId, metrics);
    this.updateStats();
    
    return metrics;
  }

  /**
   * Record question attempt
   */
  static recordQuestionAttempt(
    topicId: string,
    isCorrect: boolean
  ): ProgressMetric {
    const metrics = this.getMetric(topicId);
    if (!metrics) return {} as ProgressMetric;

    metrics.questionsAttempted += 1;
    if (isCorrect) {
      metrics.questionsCorrect += 1;
    }

    const accuracy = metrics.questionsCorrect / metrics.questionsAttempted;
    if (accuracy >= 0.9 && metrics.questionsAttempted >= 10) {
      metrics.status = 'mastered';
    } else if (metrics.questionsAttempted > 0) {
      metrics.status = 'in-progress';
    }

    metrics.estimatedCompletion = Math.min(100, (metrics.questionsCorrect / 5) * 100);

    this.saveMetric(topicId, metrics);
    this.updateStats();

    return metrics;
  }

  /**
   * Record video watched
   */
  static recordVideoWatched(
    topicId: string,
    durationMinutes: number
  ): ProgressMetric {
    const metrics = this.getMetric(topicId);
    if (!metrics) return {} as ProgressMetric;

    metrics.videosWatched += 1;
    metrics.totalVideoMinutes += durationMinutes;

    if (metrics.status === 'not-started') {
      metrics.status = 'in-progress';
    }

    metrics.estimatedCompletion = Math.min(
      100,
      ((metrics.questionsCorrect + metrics.videosWatched * 2) / 10) * 100
    );

    this.saveMetric(topicId, metrics);
    this.updateStats();

    return metrics;
  }

  /**
   * Get all progress for a class level
   */
  static getProgressByClass(classLevel: ClassLevel): ProgressMetric[] {
    const all = this.getAllMetrics();
    return all.filter(m => m.classLevel === classLevel);
  }

  /**
   * Get learning statistics
   */
  static getStats(classLevel?: ClassLevel): LearningStats {
    const stats = this.loadStats();
    if (classLevel) {
      const metrics = this.getProgressByClass(classLevel);
      return {
        ...stats,
        classLevel,
        totalTopicsStarted: metrics.filter(m => m.viewCount > 0).length,
        totalTopicsCompleted: metrics.filter(m => m.status === 'completed').length,
        totalTopicsMastered: metrics.filter(m => m.status === 'mastered').length,
      };
    }
    return stats;
  }

  /**
   * Get topic-specific metrics
   */
  static getMetric(topicId: string): ProgressMetric | null {
    const metrics = this.getAllMetrics();
    return metrics.find(m => m.topicId === topicId) || null;
  }

  /**
   * Calculate study streak
   */
  static calculateStreak(): { current: number; longest: number } {
    const sessions = this.getAllSessions();
    if (sessions.length === 0) return { current: 0, longest: 0 };

    sessions.sort((a, b) => b.startTime - a.startTime);

    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;

    for (const session of sessions) {
      const sessionDate = new Date(session.startTime).toDateString();
      const currentDate = new Date().toDateString();

      if (lastDate === null) {
        if (sessionDate === currentDate) {
          currentStreak = 1;
        }
        lastDate = new Date(session.startTime);
        longestStreak = 1;
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - session.startTime) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          currentStreak += 1;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else if (daysDiff > 1) {
          currentStreak = 0;
        }

        lastDate = new Date(session.startTime);
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Export progress data
   */
  static exportProgress(): string {
    const data = {
      metrics: this.getAllMetrics(),
      stats: this.loadStats(),
      sessions: this.getAllSessions(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Private helpers
   */
  private static createMetric(
    topicId: string,
    topicName: string,
    classLevel: ClassLevel
  ): ProgressMetric {
    return {
      topicId,
      topicName,
      classLevel,
      lastAccessed: Date.now(),
      viewCount: 0,
      questionsAttempted: 0,
      questionsCorrect: 0,
      videosWatched: 0,
      totalVideoMinutes: 0,
      estimatedCompletion: 0,
      status: 'not-started',
    };
  }

  private static getAllMetrics(): ProgressMetric[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveMetric(topicId: string, metric: ProgressMetric) {
    const all = this.getAllMetrics();
    const index = all.findIndex(m => m.topicId === topicId);
    if (index >= 0) {
      all[index] = metric;
    } else {
      all.push(metric);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  }

  private static loadStats(): LearningStats {
    try {
      const data = localStorage.getItem(this.statsKey);
      return data
        ? JSON.parse(data)
        : {
            totalTopicsStarted: 0,
            totalTopicsCompleted: 0,
            totalTopicsMastered: 0,
            totalStudyHours: 0,
            averageAccuracy: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: 0,
            preferredStudyTime: 'afternoon',
            classLevel: 'Grade 10',
          };
    } catch {
      return {
        totalTopicsStarted: 0,
        totalTopicsCompleted: 0,
        totalTopicsMastered: 0,
        totalStudyHours: 0,
        averageAccuracy: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: 0,
        preferredStudyTime: 'afternoon',
        classLevel: 'Grade 10',
      };
    }
  }

  private static updateStats() {
    const metrics = this.getAllMetrics();
    const stats = this.loadStats();

    stats.totalStudyHours = metrics.reduce((sum, m) => sum + m.totalVideoMinutes, 0) / 60;
    stats.averageAccuracy =
      metrics.reduce((sum, m) => sum + (m.questionsCorrect / (m.questionsAttempted || 1)), 0) /
        metrics.length || 0;
    stats.lastStudyDate = Math.max(...metrics.map(m => m.lastAccessed), 0);

    const { current, longest } = this.calculateStreak();
    stats.currentStreak = current;
    stats.longestStreak = longest;

    localStorage.setItem(this.statsKey, JSON.stringify(stats));
  }

  private static getAllSessions(): StudySession[] {
    try {
      const data = localStorage.getItem(this.sessionKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
