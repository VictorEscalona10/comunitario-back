import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/api';
import toast from 'react-hot-toast';


export interface User {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Comprobar si hay sesión activa con la cookie HttpOnly al montar la app
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        toast.success(`¡Bienvenido de nuevo, ${res.data.user.name}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Error al iniciar sesión. Verifica tus credenciales.');
      toast.error(message);
      return false;
    }
  };

  const register = async (
    name: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const res = await api.post('/auth/register', {
        name,
        last_name: lastName,
        email,
        password,
      });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        toast.success('¡Cuenta creada e inicio de sesión completado!');
        return true;
      }
      return false;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Error al crear la cuenta');
      toast.error(message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
      toast.success('Has cerrado sesión correctamente');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
