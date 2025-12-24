export interface StreakApiService {
    getStudentStreak(studentId: string, token?: string): Promise<any>;
    completeStreak(studentId: string, token?: string): Promise<any>;
    getNotificationHistory(studentId: string, limit?: number, token?: string): Promise<any>;
    processStreak(studentId: string, token?: string): Promise<any>;
    healthCheck(): Promise<any>;
    [key: string]: any;
}

declare const streakApiService: StreakApiService;
export default streakApiService;
