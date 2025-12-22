import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
// Mock Supabase client
vi.mock('../../lib/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'mock-token' } },
                error: null
            })
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'job-123',
                            processing_status: 'completed',
                            summary: 'test summary',
                            // Add other required fields if necessary
                        },
                        error: null
                    }),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    order: vi.fn(() => ({
                        limit: vi.fn(() => ({
                            single: vi.fn().mockResolvedValue({ data: null, error: null })
                        }))
                    }))
                })),
                order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: null, error: null })
                    }))
                }))
            }))
        }))
    }
}));

describe('Backend Migration Services', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        // Set environment variables
        vi.stubEnv('VITE_CAREER_API_URL', 'https://career-api.worker');
        vi.stubEnv('VITE_PAYMENTS_API_URL', 'https://payments-api.worker');
        vi.stubEnv('VITE_USER_API_URL', 'https://user-api.worker');
        vi.stubEnv('VITE_STORAGE_API_URL', 'https://storage-api.worker');
        vi.stubEnv('VITE_STREAK_API_URL', 'https://streak-api.worker');
        vi.stubEnv('VITE_COURSE_API_URL', 'https://course-api.worker');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('careerApiService', () => {
        it('generateEmbedding calls the correct worker endpoint', async () => {
            const careerApiService = (await import('../careerApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, embedding: [0.1, 0.2] })
            });

            await careerApiService.generateEmbedding({
                text: 'test text',
                table: 'opportunities',
                id: '123',
                type: 'opportunity'
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://career-api.worker/generate-embedding',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        text: 'test text',
                        table: 'opportunities',
                        id: '123',
                        type: 'opportunity'
                    })
                })
            );
        });

        it('healthCheck calls the correct worker endpoint', async () => {
            const careerApiService = (await import('../careerApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'ok' })
            });

            await careerApiService.healthCheck();

            expect(mockFetch).toHaveBeenCalledWith(
                'https://career-api.worker/health',
                expect.objectContaining({ method: 'GET' })
            );
        });
    });

    describe('userApiService', () => {
        it('createStudent calls the correct worker endpoint', async () => {
            const userApiService = (await import('../userApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { id: 'student-123' } })
            });

            const studentData = {
                userEmail: 'admin@school.com',
                schoolId: 'school-123',
                student: { name: 'John Doe', email: 'john@example.com' }
            };

            await userApiService.createStudent(studentData, 'mock-token');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://user-api.worker/create-student',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-token'
                    }),
                    body: JSON.stringify(studentData)
                })
            );
        });

        it('sendInterviewReminder calls the correct worker endpoint', async () => {
            const userApiService = (await import('../userApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            const reminderData = {
                interviewId: 'int-123',
                recipientEmail: 'student@example.com',
                recipientName: 'Student Name',
                interviewDetails: 'Details'
            };

            await userApiService.sendInterviewReminder(reminderData, 'mock-token');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://user-api.worker/send-interview-reminder',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(reminderData)
                })
            );
        });
    });

    describe('paymentsApiService', () => {
        it('createEventOrder calls the correct worker endpoint', async () => {
            const paymentsApiService = (await import('../paymentsApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'order_123' })
            });

            await paymentsApiService.createEventOrder(
                {
                    amount: 500,
                    currency: 'INR',
                    registrationId: 'receipt_123',
                    planName: 'Basic Plan',
                    userEmail: 'test@example.com',
                    userName: 'Test User',
                    origin: 'web'
                },
                'mock-token'
            );

            expect(mockFetch).toHaveBeenCalledWith(
                'https://payments-api.worker/create-event-order',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        amount: 500,
                        currency: 'INR',
                        registrationId: 'receipt_123',
                        planName: 'Basic Plan',
                        userEmail: 'test@example.com',
                        userName: 'Test User',
                        origin: 'web'
                    })
                })
            );
        });
    });

    describe('storageApiService', () => {
        it('getPresignedUrl calls the correct worker endpoint', async () => {
            const storageApiService = (await import('../storageApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ url: 'https://r2.bucket/upload' })
            });

            const params = {
                filename: 'test.pdf',
                contentType: 'application/pdf',
                fileSize: 1024,
                courseId: 'c1',
                lessonId: 'l1'
            };

            await storageApiService.getPresignedUrl(params, 'mock-token');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://storage-api.worker/presigned',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(params)
                })
            );
        });

        it('confirmUpload calls the correct worker endpoint', async () => {
            const storageApiService = (await import('../storageApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            const params = {
                fileKey: 'key123',
                fileName: 'test.pdf',
                fileSize: 1024,
                fileType: 'application/pdf'
            };

            await storageApiService.confirmUpload(params, 'mock-token');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://storage-api.worker/confirm',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(params)
                })
            );
        });
    });

    describe('streakApiService', () => {
        it('getStudentStreak calls the correct worker endpoint', async () => {
            const streakApiService = (await import('../streakApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ currentStreak: 5 })
            });

            await streakApiService.getStudentStreak('student-123', 'mock-token');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://streak-api.worker/student-123',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-token'
                    })
                })
            );
        });

        it('completeStreak calls the correct worker endpoint', async () => {
            const streakApiService = (await import('../streakApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            await streakApiService.completeStreak('student-123', 'mock-token');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://streak-api.worker/student-123/complete',
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });
    });

    describe('courseApiService', () => {
        it('getFileUrl calls the correct worker endpoint', async () => {
            const courseApiService = (await import('../courseApiService')).default;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ url: 'https://r2.bucket/file' })
            });

            await courseApiService.getFileUrl('file-key-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://course-api.worker/get-file-url',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ fileKey: 'file-key-123' })
                })
            );
        });
    });

    describe('videoSummarizerService', () => {
        it('processVideo calls the correct worker endpoint', async () => {
            const { processVideo } = await import('../videoSummarizerService');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'job-123', processing_status: 'pending' })
            });

            // Mock checkProcessingStatus to return completed immediately to avoid loop
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'job-123', processing_status: 'completed', summary: 'test summary' })
            });

            await processVideo({
                videoUrl: 'https://youtube.com/watch?v=123',
                courseId: 'c1'
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://course-api.worker/ai-video-summarizer',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"videoUrl":"https://youtube.com/watch?v=123"')
                })
            );
        });
    });

    describe('tutorService', () => {
        it('getSuggestedQuestions calls the correct worker endpoint', async () => {
            const { getSuggestedQuestions } = await import('../tutorService');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ questions: ['Q1', 'Q2'] })
            });

            await getSuggestedQuestions('lesson-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://course-api.worker/ai-tutor-suggestions',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ lessonId: 'lesson-123' })
                })
            );
        });

        it('getCourseProgress calls the correct worker endpoint', async () => {
            const { getCourseProgress } = await import('../tutorService');

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ completedLessons: 5 })
            });

            await getCourseProgress('course-123');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://course-api.worker/ai-tutor-progress?courseId=course-123',
                expect.objectContaining({
                    method: 'GET'
                })
            );
        });
    });
});
