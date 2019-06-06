import React from 'react';

export interface NavigationContextType {
  location: string;
  iconOnly?: boolean;
  onNavigationDismiss?(): void;
  withinContentContainer?: boolean;
}

const NavigationContext = React.createContext<NavigationContextType>({
  location: '',
});

export default NavigationContext;
