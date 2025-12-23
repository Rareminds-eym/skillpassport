export interface StorageApiService {
    uploadFile(file: File, options: { folder?: string; filename?: string; contentType?: string }, token: string): Promise<any>;
    deleteFile(fileKey: string, token: string): Promise<any>;
    extractContent(fileUrl: string, token: string): Promise<any>;
    getPresignedUrl(data: { filename: string; contentType: string; fileSize: number; courseId?: string; lessonId?: string }, token: string): Promise<any>;
    confirmUpload(data: { fileKey: string; fileName: string; fileSize: number; fileType: string }, token: string): Promise<any>;
    getFileUrl(fileKey: string, token: string): Promise<any>;
    listFiles(courseId: string, lessonId: string, token: string): Promise<any>;
    [key: string]: any;
}

declare const storageApiService: StorageApiService;
export default storageApiService;
