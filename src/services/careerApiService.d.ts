export interface CareerApiService {
    sendCareerChatMessage(
        data: { conversationId?: string; message: string; selectedChips?: string[] },
        token: string,
        onChunk: (chunk: string) => void,
        onComplete: (data: any) => void,
        onError: (error: any) => void
    ): void;
    healthCheck(): Promise<any>;
    generateEmbedding(data: { text: string; table: string; id: string; type?: string }, token?: string): Promise<any>;
    // Add other methods as needed based on usage
    [key: string]: any;
}

declare const careerApiService: CareerApiService;
export default careerApiService;
