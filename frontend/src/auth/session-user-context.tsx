import { createContext, type ReactNode, useContext } from 'react';

import type { SessionUser } from '../types/session-user';

const SessionUserContext = createContext<SessionUser | null>(null);

type SessionUserProviderProps = {
  user: SessionUser;
  children: ReactNode;
};

export function SessionUserProvider({ user, children }: SessionUserProviderProps) {
  return <SessionUserContext.Provider value={user}>{children}</SessionUserContext.Provider>;
}

export function useSessionUser(): SessionUser {
  const user = useContext(SessionUserContext);
  if (user === null) {
    throw new Error('useSessionUser must be used inside a SessionUserProvider');
  }
  return user;
}
