export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: {
    code: number;
    message: string;
    details?: any;
  };

  static success<T>(data: T, message = 'OK'): ApiResponseDto<T> {
    const response = new ApiResponseDto<T>();
    response.success = true;
    response.data = data;
    response.message = message;
    return response;
  }

  static error<T>(
    code: number,
    message: string,
    details?: any,
  ): ApiResponseDto<T> {
    const response = new ApiResponseDto<T>();
    response.success = false;
    response.error = { code, message, details };
    response.message = message;
    return response;
  }
}
