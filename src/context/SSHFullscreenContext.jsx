import { createContext, useContext, useState } from 'react';

const SSHFullscreenContext = createContext(null);

export function SSHFullscreenProvider({ children }) {
  const [sshFullscreen, setSshFullscreen] = useState(null);
  return (
    <SSHFullscreenContext.Provider value={{ sshFullscreen, setSshFullscreen }}>
      {children}
    </SSHFullscreenContext.Provider>
  );
}

export const useSSHFullscreen = () => {
  const context = useContext(SSHFullscreenContext);
  if (!context) return { sshFullscreen: null, setSshFullscreen: () => {} };
  return context;
};
