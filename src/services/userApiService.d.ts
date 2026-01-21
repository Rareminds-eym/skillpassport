export interface UserApiService {
  createStudent(data: any, token: string): Promise<any>;
  createEventUser(data: any, token: string): Promise<any>;
  sendInterviewReminder(data: any, token: string): Promise<any>;
  importStudents(data: any, token: string): Promise<any>;
  // Add other methods as needed based on usage
  [key: string]: any;
}

declare const userApiService: UserApiService;
export default userApiService;
