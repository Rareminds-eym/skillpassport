export interface CourseApiService {
  getFileUrl(fileKey: string): Promise<string>;
  getAiTutorSuggestions(lessonId: string, token?: string): Promise<any>;
  sendAiTutorMessage(
    data: { conversationId?: string; courseId: string; lessonId?: string; message: string },
    token: string,
    onToken?: (token: string) => void,
    onDone?: (data: any) => void,
    onError?: (error: any) => void
  ): Promise<void>;
  submitAiTutorFeedback(
    data: { conversationId: string; messageIndex: number; rating: number; feedbackText?: string },
    token: string
  ): Promise<any>;
  getAiTutorProgress(courseId: string, token: string): Promise<any>;
  updateAiTutorProgress(
    data: { courseId: string; lessonId: string; status: string },
    token: string
  ): Promise<any>;
  summarizeVideo(
    data: { videoUrl: string; lessonId?: string; courseId?: string; language?: string },
    token: string
  ): Promise<any>;
  [key: string]: any;
}

declare const courseApiService: CourseApiService;
export default courseApiService;
