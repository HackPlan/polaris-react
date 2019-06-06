import React from 'react';
import classNames from 'classnames';

import Scrollable from '../Scrollable';

import {WithinContentContext} from '../../utilities/within-content-context';
import {NavigationContext} from './context';
import {Section, Item} from './components';
import {SectionType} from './types';

import styles from './Navigation.scss';

export interface Props {
  location: string;
  sections?: SectionType[];
  children?: React.ReactNode;
  contextControl?: React.ReactNode;
  iconOnly?: boolean;
  onDismiss?(): void;
}

export default class Navigation extends React.Component<Props, never> {
  static Item = Item;
  static Section = Section;

  render() {
    const {
      children,
      contextControl,
      location,
      onDismiss,
      iconOnly,
    } = this.props;

    const navClassName = classNames(
      styles.Navigation,
      iconOnly && styles['Navigation-IconOnly'],
    );

    const contextControlMarkup = contextControl && (
      <div className={styles.ContextControl}>{contextControl}</div>
    );

    const context = {
      location,
      onNavigationDismiss: onDismiss,
    };

    return (
      <NavigationContext.Provider value={context}>
        <WithinContentContext.Provider value>
          <nav className={navClassName}>
            {contextControlMarkup}
            <Scrollable className={styles.PrimaryNavigation}>
              {children}
            </Scrollable>
          </nav>
        </WithinContentContext.Provider>
      </NavigationContext.Provider>
    );
  }
}
