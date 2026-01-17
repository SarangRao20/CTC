// Mock API service for development
// This can be replaced with real API calls later

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

const api = {
  get: async <T,>(url: string): Promise<ApiResponse<T>> => {
    // Mock implementation
    console.log(`[API GET] ${url}`);
    return {
      data: [] as unknown as T,
      status: 200,
    };
  },

  post: async <T,>(url: string, data?: any): Promise<ApiResponse<T>> => {
    console.log(`[API POST] ${url}`, data);
    return {
      data: {} as T,
      status: 201,
    };
  },

  put: async <T,>(url: string, data?: any): Promise<ApiResponse<T>> => {
    console.log(`[API PUT] ${url}`, data);
    return {
      data: {} as T,
      status: 200,
    };
  },

  delete: async <T,>(url: string): Promise<ApiResponse<T>> => {
    console.log(`[API DELETE] ${url}`);
    return {
      data: {} as T,
      status: 204,
    };
  },
};

export default api;
