const API_URL = 'http://localhost:8080/api';

export type UserUpdateData = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
};

export type SearchParams = {
  search?: string;
};

export const userService = {
  // Get users with search (GET /api/users)
  getUsers: async (params: SearchParams, token: string) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search.trim());

    try {
      const response = await fetch(`${API_URL}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
  
      return response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID (GET /api/users/{id})
  getUserById: async (userId: string, token: string) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  },

  // Update user information (PUT /api/users/{id})
  updateUser: async (userId: string, userData: UserUpdateData, token: string) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  },

  // Update user status (PUT /api/users/status)
  updateStatus: async (status: string, token: string) => {
    const response = await fetch(`${API_URL}/users/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }

    return response.json();
  },

  // Update profile picture (PUT /api/users/profile-picture)
  updateProfilePicture: async (imageFile: File, token: string) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_URL}/users/profile-picture`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to update profile picture');
    }

    return response.json();
  }
}; 