 const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://pos-nailart-api.reknotsru.workers.dev';
    
    export async function fetchApi(endpoint, options = {}) {
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
    
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Request failed with status ${response.status}`);
      }
    
      return response.json();
    }
    
    // Contoh fungsi memanggil endpoint health check
    export async function checkBackendHealth() {
      return await fetchApi('/api/health');
    }