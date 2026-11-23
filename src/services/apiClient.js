import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_API_APP_TOKEN;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-token': APP_TOKEN, // 🔑 Token de la app (siempre)
  },
});

// Interceptor REQUEST: lee el token seguro del dispositivo
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const userToken = await SecureStore.getItemAsync('user_token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    } catch (e) {
      console.warn('Error leyendo token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor RESPONSE: manejo 401/403
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      await SecureStore.deleteItemAsync('user_token');
      await SecureStore.deleteItemAsync('user_data');
      // El AuthContext escuchará este flag para regresar a Login
      global.__forceLogout = true;
    }

    if (status === 403) {
      // Podrías usar un Alert de React Native aquí
      console.warn('403: acceso restringido');
    }

    if (status === 404) console.warn('404: recurso no encontrado');
    if (status === 500) console.warn('500: error del servidor');

    return Promise.reject(error);
  }
);

export default apiClient; 