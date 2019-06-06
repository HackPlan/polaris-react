import React, {
  useEffect,
  useCallback,
  useContext,
  useState,
  MouseEvent,
  ReactNode,
  Fragment,
} from 'react';

import {classNames} from '@shopify/css-utilities';
import {navigationBarCollapsed} from '../../../../utilities/breakpoints';

import NavigationContext from '../../context';
import Badge from '../../../Badge';
import Popover from '../../../Popover';
import Icon, {Props as IconProps} from '../../../Icon';
import Indicator from '../../../Indicator';
import UnstyledLink from '../../../UnstyledLink';
import {usePolaris} from '../../../../hooks';

import styles from '../../Navigation.scss';

import {Secondary} from './components';

interface ItemURLDetails {
  url?: string;
  matches?: boolean;
  exactMatch?: boolean;
  matchPaths?: string[];
  excludePaths?: string[];
}

export interface SubNavigationItem extends ItemURLDetails {
  url: string;
  label: string;
  disabled?: boolean;
  new?: boolean;
  onClick?(event: MouseEvent<HTMLElement>): void;
}

interface SecondaryAction {
  url: string;
  accessibilityLabel: string;
  icon: IconProps['source'];
}

export interface Props extends ItemURLDetails {
  icon?: IconProps['source'];
  /** @deprecated The iconBody prop is deprecated and will be removed. Pass a string into the icon prop instead */
  iconBody?: string;
  badge?: ReactNode;
  label: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  selected?: boolean;
  exactMatch?: boolean;
  new?: boolean;
  iconOnly?: boolean;
  className?: string;
  buttonClassName?: string;
  itemClassName?: string;
  subNavigationItems?: SubNavigationItem[];
  secondaryAction?: SecondaryAction;
  onClick?(): void;
}

enum MatchState {
  MatchForced,
  MatchUrl,
  MatchPaths,
  Excluded,
  NoMatch,
}

export default function Item({
  url,
  icon,
  label,
  subNavigationItems = [],
  secondaryAction,
  disabled,
  onClick,
  accessibilityLabel,
  iconBody,
  selected: selectedOverride,
  badge,
  new: isNew,
  matches,
  exactMatch,
  matchPaths,
  excludePaths,
  iconOnly,
  className,
  buttonClassName,
  itemClassName
}: Props) {
  const {intl} = usePolaris();
  const {location, onNavigationDismiss} = useContext(NavigationContext);
  const [expanded, setExpanded] = useState(false);

  const handleResize = useCallback(
    () => {
      if (!navigationBarCollapsed().matches && expanded) {
        setExpanded(false);
      }
    },
    [expanded],
  );

  useEffect(
    () => {
      navigationBarCollapsed().addListener(handleResize);
      return () => {
        navigationBarCollapsed().removeListener(handleResize);
      };
    },
    [handleResize],
  );

  const tabIndex = disabled ? -1 : 0;

  const hasNewChild =
    subNavigationItems.filter((subNavigationItem) => subNavigationItem.new)
      .length > 0;

  const indicatorMarkup = hasNewChild ? (
    <span className={styles.Indicator}>
      <Indicator pulse />
    </span>
  ) : null;

  if (iconBody) {
    // eslint-disable-next-line no-console
    console.warn(
      'Deprecation: The iconBody prop is deprecated. Pass a string into the icon prop instead',
    );
  }

  const iconBodyOrIcon = iconBody || icon;
  const iconMarkup = iconBodyOrIcon ? (
    <div className={styles.Icon}>
      <Icon source={iconBodyOrIcon} />
    </div>
  ) : null;

  let badgeMarkup: ReactNode = null;
  if (isNew) {
    badgeMarkup = (
      <Badge status="new" size="small">
        {intl.translate('Polaris.Badge.STATUS_LABELS.new')}
      </Badge>
    );
  } else if (typeof badge === 'string') {
    badgeMarkup = (
      <Badge status="new" size="small">
        {badge}
      </Badge>
    );
  } else {
    badgeMarkup = badge;
  }

  const wrappedBadgeMarkup =
    badgeMarkup == null ? null : (
      <div className={styles.Badge}>{badgeMarkup}</div>
    );

  const itemContentMarkup = (
    <Fragment>
      {iconMarkup}
      <span className={styles.Text}>
        {label}
        {indicatorMarkup}
      </span>
      {wrappedBadgeMarkup}
    </Fragment>
  );

  const listClassName = classNames(
    className, styles.ListItem,
    secondaryAction && styles['ListItem-hasAction'],
  );
  const btnClassName = classNames(
    buttonClassName,
    styles.Item,
    disabled && styles['Item-disabled'],
  );

  if (url == null) {
    return (
      <li className={listClassName}>
        <button
          type="button"
          className={btnClassName}
          disabled={disabled}
          aria-disabled={disabled}
          aria-label={accessibilityLabel}
          onClick={getClickHandler(onClick)}
        >
          {itemContentMarkup}
        </button>
      </li>
    );
  }

  const secondaryActionMarkup = secondaryAction && (
    <UnstyledLink
      external
      url={secondaryAction.url}
      className={styles.SecondaryAction}
      tabIndex={tabIndex}
      aria-disabled={disabled}
      aria-label={secondaryAction.accessibilityLabel}
    >
      <Icon source={secondaryAction.icon} />
    </UnstyledLink>
  );

  const matchState = matchStateForItem(
    {url, matches, exactMatch, matchPaths, excludePaths},
    location,
  );

  const matchingSubNavigationItems = subNavigationItems.filter((item) => {
    const subMatchState = matchStateForItem(item, location);
    return (
      subMatchState === MatchState.MatchForced ||
      subMatchState === MatchState.MatchUrl ||
      subMatchState === MatchState.MatchPaths
    );
  });

  const childIsActive = matchingSubNavigationItems.length > 0;

  const selected =
    selectedOverride == null
      ? matchState === MatchState.MatchForced ||
        matchState === MatchState.MatchUrl ||
        matchState === MatchState.MatchPaths
      : selectedOverride;

  const showExpanded = !iconOnly && selected || expanded || childIsActive;
  const showExpandedPopover = iconOnly && selected || childIsActive;

  const compoundItemClassName = classNames(
    itemClassName,
    styles.Item,
    disabled && styles['Item-disabled'],
    selected && subNavigationItems.length === 0 && styles['Item-selected'],
    showExpanded && styles.subNavigationActive,
  );

  let secondaryNavigationMarkup: ReactNode = null;

  const longestMatch = matchingSubNavigationItems.sort(
    ({url: firstUrl}, {url: secondUrl}) => secondUrl.length - firstUrl.length,
  )[0];

  if (subNavigationItems.length > 0 && showExpanded) {
    secondaryNavigationMarkup = (
      <div className={styles.SecondaryNavigation}>
        <Secondary expanded={showExpanded}>
          {subNavigationItems.map((item) => {
            const {label, ...rest} = item;
            return (
              <Item
                {...rest}
                key={label}
                label={label}
                matches={item === longestMatch}
                onClick={onNavigationDismiss}
              />
            );
          })}
        </Secondary>
      </div>
    );
  }

  if (subNavigationItems.length > 0 && showExpandedPopover) {
    const showPopover = () => {
      setExpanded(true)
    };

    const hidePopover = () => {
      setExpanded(false)
    };

    const openArrowSvg = () => (
      <svg width="20" height="20" viewBox="0 0 20 20"><path d="M6.79 5.404l.694-.72 5.446 5.26-5.26 5.446-.72-.694 4.566-4.727" fill-rule="evenodd"></path></svg>
    )
    const activator = (
      <div className={styles.SubItemsPopoverActivator}>
        <Icon source={openArrowSvg} color="inkLighter"/>
      </div>
    );

    secondaryNavigationMarkup = (
      <div
        onFocus={showPopover}
        onBlur={hidePopover}
        onMouseEnter={showPopover}
        onMouseLeave={hidePopover}
        className={styles.SubItemsPopover}>
        <Popover
          active={expanded}
          activator={activator}
          onClose={hidePopover}
          preferredPosition={'right'}
        >
          <Popover.Pane fixed>
            <Popover.Section>
              <p>{label}</p>
            </Popover.Section>
          </Popover.Pane>
          <Popover.Pane>
            {subNavigationItems.map((item) => {
              const {label, ...rest} = item;
              return (
                <Item
                  {...rest}
                  key={label}
                  label={label}
                  itemClassName={styles.SubItemsPopoverItem}
                  matches={item === longestMatch}
                  onClick={onNavigationDismiss}
                />
              );
            })}
          </Popover.Pane>
        </Popover>
      </div>
    );
  }

  return (
    <li className={listClassName}>
      <UnstyledLink
        url={url}
        className={compoundItemClassName}
        tabIndex={tabIndex}
        aria-disabled={disabled}
        aria-label={accessibilityLabel}
        onClick={getClickHandler(onClick)}
      >
        {itemContentMarkup}
      </UnstyledLink>
      {secondaryActionMarkup}
      {secondaryNavigationMarkup}
    </li>
  );

  function getClickHandler(onClick: Props['onClick']) {
    return (event: MouseEvent<HTMLElement>) => {
      const {currentTarget} = event;

      if (currentTarget.getAttribute('href') === location) {
        event.preventDefault();
      }

      if (
        subNavigationItems &&
        subNavigationItems.length > 0 &&
        navigationBarCollapsed().matches
      ) {
        event.preventDefault();
        setExpanded(!expanded);
      } else if (onNavigationDismiss) {
        onNavigationDismiss();
        if (onClick && onClick !== onNavigationDismiss) {
          onClick();
        }
        return;
      }

      if (onClick) {
        onClick();
      }
    };
  }
}

export function isNavigationItemActive(
  navigationItem: Props,
  currentPath: string,
) {
  const matchState = matchStateForItem(navigationItem, currentPath);

  const matchingSubNavigationItems =
    navigationItem.subNavigationItems &&
    navigationItem.subNavigationItems.filter((item) => {
      const subMatchState = matchStateForItem(item, currentPath);
      return (
        subMatchState === MatchState.MatchForced ||
        subMatchState === MatchState.MatchUrl ||
        subMatchState === MatchState.MatchPaths
      );
    });

  const childIsActive =
    matchingSubNavigationItems && matchingSubNavigationItems.length > 0;

  const selected =
    matchState === MatchState.MatchForced ||
    matchState === MatchState.MatchUrl ||
    matchState === MatchState.MatchPaths;

  return selected || childIsActive;
}

function normalizePathname(pathname: string) {
  const barePathname = pathname.split('?')[0].split('#')[0];
  return barePathname.endsWith('/') ? barePathname : `${barePathname}/`;
}

function safeEqual(location: string, path: string) {
  return normalizePathname(location) === normalizePathname(path);
}

function safeStartsWith(location: string, path: string) {
  return normalizePathname(location).startsWith(normalizePathname(path));
}

function matchStateForItem(
  {url, matches, exactMatch, matchPaths, excludePaths}: ItemURLDetails,
  location: string,
) {
  if (url == null) {
    return MatchState.NoMatch;
  }

  if (matches) {
    return MatchState.MatchForced;
  }

  if (
    matches === false ||
    (excludePaths &&
      excludePaths.some((path) => safeStartsWith(location, path)))
  ) {
    return MatchState.Excluded;
  }

  if (matchPaths && matchPaths.some((path) => safeStartsWith(location, path))) {
    return MatchState.MatchPaths;
  }

  const matchesUrl = exactMatch
    ? safeEqual(location, url)
    : safeStartsWith(location, url);
  return matchesUrl ? MatchState.MatchUrl : MatchState.NoMatch;
}
