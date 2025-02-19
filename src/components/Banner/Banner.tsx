import React from 'react';
import {
  CancelSmallMinor,
  CircleTickMajorTwotone,
  FlagMajorTwotone,
  CircleAlertMajorTwotone,
  CircleDisabledMajorTwotone,
  CircleInformationMajorTwotone,
} from '@shopify/polaris-icons';

import {BannerContext} from '../../utilities/banner-context';
import {classNames, variationName} from '../../utilities/css';
import {
  Action,
  DisableableAction,
  LoadableAction,
  IconProps,
} from '../../types';
import Button, {buttonFrom} from '../Button';
import Heading from '../Heading';
import ButtonGroup from '../ButtonGroup';
import UnstyledLink from '../UnstyledLink';
import Icon from '../Icon';

import {WithinContentContext} from '../../utilities/within-content-context';

import styles from './Banner.scss';

export type Status = 'success' | 'info' | 'warning' | 'critical';

export interface Props {
  /** Title content for the banner. */
  title?: string;
  /** Icon to display in the banner. Use only major, duotone icons */
  icon?: IconProps['source'];
  /** Sets the status of the banner. */
  status?: Status;
  /** The child elements to render in the banner. */
  children?: React.ReactNode;
  /** Action for banner */
  action?: DisableableAction & LoadableAction;
  /** Action | Displays a secondary action */
  secondaryAction?: Action;
  /** Callback when banner is dismissed */
  onDismiss?(): void;
  /** Disables screen reader announcements when changing the content of the banner */
  stopAnnouncements?: boolean;
}

export default class Banner extends React.PureComponent<Props, never> {
  private wrapper = React.createRef<HTMLDivElement>();

  public focus() {
    this.wrapper.current && this.wrapper.current.focus();
  }

  render() {
    return (
      <BannerContext.Provider value>
        <WithinContentContext.Consumer>
          {(withinContentContainer) => {
            const {
              icon,
              action,
              secondaryAction,
              title,
              children,
              status,
              onDismiss,
              stopAnnouncements,
            } = this.props;
            let color: IconProps['color'];
            let defaultIcon: IconProps['source'];
            let ariaRoleType = 'status';

            switch (status) {
              case 'success':
                color = 'greenDark';
                defaultIcon = CircleTickMajorTwotone;
                break;
              case 'info':
                color = 'tealDark';
                defaultIcon = CircleInformationMajorTwotone;
                break;
              case 'warning':
                color = 'yellowDark';
                defaultIcon = CircleAlertMajorTwotone;
                ariaRoleType = 'alert';
                break;
              case 'critical':
                color = 'redDark';
                defaultIcon = CircleDisabledMajorTwotone;
                ariaRoleType = 'alert';
                break;
              default:
                color = 'inkLighter';
                defaultIcon = FlagMajorTwotone;
            }
            const className = classNames(
              styles.Banner,
              status && styles[variationName('status', status)],
              onDismiss && styles.hasDismiss,
              withinContentContainer
                ? styles.withinContentContainer
                : styles.withinPage,
            );

            const id = uniqueID();
            const iconName = icon || defaultIcon;

            let headingMarkup: React.ReactNode = null;
            let headingID: string | undefined;

            if (title) {
              headingID = `${id}Heading`;
              headingMarkup = (
                <div className={styles.Heading} id={headingID}>
                  <Heading element="p">{title}</Heading>
                </div>
              );
            }

            const buttonSizeValue = withinContentContainer ? 'slim' : undefined;

            const secondaryActionMarkup = secondaryAction
              ? secondaryActionFrom(secondaryAction)
              : null;

            const actionMarkup = action ? (
              <div className={styles.Actions}>
                <ButtonGroup>
                  <div className={styles.PrimaryAction}>
                    {buttonFrom(action, {outline: true, size: buttonSizeValue})}
                  </div>
                  {secondaryActionMarkup}
                </ButtonGroup>
              </div>
            ) : null;

            let contentMarkup = null;
            let contentID: string | undefined;

            if (children || actionMarkup) {
              contentID = `${id}Content`;
              contentMarkup = (
                <div className={styles.Content} id={contentID}>
                  {children}
                  {actionMarkup}
                </div>
              );
            }

            const dismissButton = onDismiss ? (
              <div className={styles.Dismiss}>
                <Button
                  plain
                  icon={CancelSmallMinor}
                  onClick={onDismiss}
                  accessibilityLabel="Dismiss notification"
                />
              </div>
            ) : null;

            return (
              <div
                className={className}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
                ref={this.wrapper}
                role={ariaRoleType}
                aria-live={stopAnnouncements ? 'off' : 'polite'}
                onMouseUp={handleMouseUp}
                aria-labelledby={headingID}
                aria-describedby={contentID}
              >
                {dismissButton}
                {icon !== null && (
                  <div className={styles.Ribbon}>
                    <Icon source={iconName} color={color} backdrop />
                  </div>
                )}
                <div>
                  {headingMarkup}
                  {contentMarkup}
                </div>
              </div>
            );
          }}
        </WithinContentContext.Consumer>
      </BannerContext.Provider>
    );
  }
}

let index = 1;
function uniqueID() {
  return `Banner${index++}`;
}

function handleMouseUp({currentTarget}: React.MouseEvent<HTMLDivElement>) {
  currentTarget.blur();
}

function secondaryActionFrom(action: Action) {
  if (action.url) {
    return (
      <UnstyledLink
        className={styles.SecondaryAction}
        url={action.url}
        external={action.external}
      >
        <span className={styles.Text}>{action.content}</span>
      </UnstyledLink>
    );
  }

  return (
    <button className={styles.SecondaryAction} onClick={action.onAction}>
      <span className={styles.Text}>{action.content}</span>
    </button>
  );
}
