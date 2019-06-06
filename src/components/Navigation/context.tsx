import React from 'react';

interface NavigationContextType {
  location: string;
  iconOnly?: boolean;
  onNavigationDismiss?(): void;
  withinContentContainer?: boolean;
}

export const NavigationContext = React.createContext<NavigationContextType>({
  location: '',
});
