import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { ME } from './graphql/operations';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const client = useApolloClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sa_token');
    if (token) {
      client.query({ query: ME, fetchPolicy: 'network-only' })
        .then(({ data }) => { if (data?.me) setUser(data.me); })
        .catch(() => localStorage.removeItem('sa_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [client]);

  const login = (token, userData) => {
    localStorage.setItem('sa_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('sa_token');
    setUser(null);
    client.clearStore();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
