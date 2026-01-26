import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({ title: '', message: '' });

  const showAlert = useCallback((options: AlertOptions) => {
    setConfig({
      ...options,
      buttons: options.buttons || [{ text: 'OK', style: 'default', onPress: () => {} }]
    });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert 
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons?.map(btn => ({
          ...btn,
          onPress: () => {
             if (btn.onPress) btn.onPress();
             // We don't auto-close here because some actions might be async or need to stay open
             // But for standard alerts, we usually want to close.
             // Let's modify CustomAlert to handle closing, or wrap here.
             // wrapper:
          }
        }))}
        icon={config.icon}
        iconColor={config.iconColor}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
