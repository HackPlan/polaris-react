import React, {useMemo} from 'react';
import range from 'lodash/range';
import {ArrowLeftMinor, ArrowRightMinor} from '@shopify/polaris-icons';
import {classNames} from '../../utilities/css';
import isInputFocused from '../../utilities/isInputFocused';
import {withAppProvider, WithAppProviderProps} from '../AppProvider';
import Icon from '../Icon';
import UnstyledLink from '../UnstyledLink';
import Tooltip from '../Tooltip';
import KeypressListener from '../KeypressListener';
import {Key} from '../../types';
import {handleMouseUpByBlurring} from '../../utilities/focus';

import styles from './Pagination.scss';

export interface PaginationDescriptor {
  /** Keyboard shortcuts for the next button */
  nextKeys?: Key[];
  /** Keyboard shortcuts for the previous button */
  previousKeys?: Key[];
  /** Tooltip for the next button */
  nextTooltip?: string;
  /** Tooltip for the previous button */
  previousTooltip?: string;
  /** The URL of the next page */
  nextURL?: string;
  /** The URL of the previous page */
  previousURL?: string;
  /** Whether there is a next page to show */
  hasNext?: boolean;
  /** Whether there is a previous page to show */
  hasPrevious?: boolean;
  /** Accessible label for the pagination */
  accessibilityLabel?: string;
  /** Callback when next button is clicked */
  onNext?(): void;
  /** Callback when previous button is clicked */
  onPrevious?(): void;
  /** Current page */
  currentPage?: number;
  /** Total page */
  totalPage?: number;
  /** Callback when page number button is clicked */
  onPageChange?(page: number): void;
}

export interface Props extends PaginationDescriptor {
  /** A more subdued control for use in headers */
  plain?: boolean;
}

export type CombinedProps = Props & WithAppProviderProps;

function Pagination({
  hasNext,
  hasPrevious,
  nextURL,
  previousURL,
  onNext,
  onPrevious,
  nextTooltip,
  previousTooltip,
  nextKeys,
  previousKeys,
  plain,
  accessibilityLabel,
  polaris: {intl},
  currentPage,
  totalPage,
  onPageChange,
}: CombinedProps) {
  const node: React.RefObject<HTMLElement> = React.createRef();
  let label: string;

  if (accessibilityLabel) {
    label = accessibilityLabel;
  } else {
    label = intl.translate('Polaris.Pagination.pagination');
  }

  const className = classNames(styles.Pagination, plain && styles.plain);
  const previousClassName = classNames(styles.Button, styles.PreviousButton);
  const pageNumbersClassName = classNames(
    styles.Button,
    styles.PageNumberButton,
  );
  const nextClassName = classNames(styles.Button, styles.NextButton);

  const previousButton = previousURL ? (
    <UnstyledLink
      className={previousClassName}
      url={previousURL}
      onMouseUp={handleMouseUpByBlurring}
      aria-label={intl.translate('Polaris.Pagination.previous')}
      id="previousURL"
    >
      <Icon source={ArrowLeftMinor} />
    </UnstyledLink>
  ) : (
    <button
      onClick={onPrevious}
      type="button"
      onMouseUp={handleMouseUpByBlurring}
      className={previousClassName}
      aria-label={intl.translate('Polaris.Pagination.previous')}
      disabled={!hasPrevious}
    >
      <Icon source={ArrowLeftMinor} />
    </button>
  );

  const nextButton = nextURL ? (
    <UnstyledLink
      className={nextClassName}
      url={nextURL}
      onMouseUp={handleMouseUpByBlurring}
      aria-label={intl.translate('Polaris.Pagination.next')}
      id="nextURL"
    >
      <Icon source={ArrowRightMinor} />
    </UnstyledLink>
  ) : (
    <button
      onClick={onNext}
      type="button"
      onMouseUp={handleMouseUpByBlurring}
      className={nextClassName}
      aria-label={intl.translate('Polaris.Pagination.next')}
      disabled={!hasNext}
    >
      <Icon source={ArrowRightMinor} />
    </button>
  );

  const constructedPrevious = previousTooltip ? (
    <Tooltip content={previousTooltip}>{previousButton}</Tooltip>
  ) : (
    previousButton
  );

  const constructedNext = nextTooltip ? (
    <Tooltip content={nextTooltip}>{nextButton}</Tooltip>
  ) : (
    nextButton
  );

  const previousButtonEvents =
    previousKeys &&
    (previousURL || onPrevious) &&
    hasPrevious &&
    previousKeys.map((key) => (
      <KeypressListener
        key={key}
        keyCode={key}
        handler={
          previousURL
            ? handleCallback(clickPaginationLink('previousURL', node))
            : handleCallback(onPrevious as () => void)
        }
      />
    ));

  const nextButtonEvents =
    nextKeys &&
    (nextURL || onNext) &&
    hasNext &&
    nextKeys.map((key) => (
      <KeypressListener
        key={key}
        keyCode={key}
        handler={
          nextURL
            ? handleCallback(clickPaginationLink('nextURL', node))
            : handleCallback(onNext as () => void)
        }
      />
    ));

  const PageNumberButton = (props: {
    key?: number;
    title: string;
    nonInteractive?: boolean;
    selected?: boolean;
    onClick?: () => void;
  }) => {
    const className = [
      pageNumbersClassName,
      ...(props.nonInteractive ? [styles.NonInteractive] : []),
      ...(props.selected ? [styles.Selected] : []),
    ].join(' ');
    return (
      <button
        onClick={() => {
          !props.nonInteractive && props.onClick && props.onClick();
        }}
        type="button"
        onMouseUp={handleMouseUpByBlurring}
        className={className}
        aria-label={intl.translate('Polaris.Pagination.previous')}
      >
        {props.title}
      </button>
    );
  };

  const pageNumbersMarkup = useMemo(
    () => {
      if (!currentPage || !totalPage || currentPage > totalPage) return null;

      const maxShowPageNumberLength = 5;
      const pageNumberData: {
        title: string;
        nonInteractive: boolean;
        selected: boolean;
      }[] = range(1, totalPage + 1).map((i) => ({
        title: String(i),
        nonInteractive: false,
        selected: false,
      }));

      const leftHideLength = currentPage - 4 < 0 ? 0 : currentPage - 4;
      const leftShowLength = (currentPage > 4 ? 3 : currentPage) - 1;
      const rightShowLength = maxShowPageNumberLength - leftShowLength - 1;
      const rightHideLength = totalPage - currentPage - rightShowLength - 1;

      if (rightHideLength > 0) {
        pageNumberData.splice(currentPage + rightShowLength, rightHideLength);
        pageNumberData.splice(pageNumberData.length - 1, 0, {
          title: '...',
          nonInteractive: true,
          selected: false,
        });
      }
      if (leftHideLength > 0) {
        pageNumberData.splice(1, leftHideLength);
        pageNumberData.splice(1, 0, {
          title: '...',
          nonInteractive: true,
          selected: false,
        });
      }
      const selectedPageNumber = pageNumberData.find(
        (i) => i.title === String(currentPage),
      );
      if (selectedPageNumber) {
        if (pageNumberData.length > 1) {
          selectedPageNumber.selected = true;
        } else {
          selectedPageNumber.nonInteractive = true;
        }
      }

      return (
        <React.Fragment>
          {pageNumberData.map((i, index) => (
            <PageNumberButton
              key={index}
              {...i}
              onClick={() => {
                onPageChange && onPageChange(Number(i.title));
              }}
            />
          ))}
        </React.Fragment>
      );
    },
    [currentPage, totalPage, onPageChange],
  );

  return (
    <nav className={className} aria-label={label} ref={node}>
      {previousButtonEvents}
      {constructedPrevious}
      {pageNumbersMarkup}
      {nextButtonEvents}
      {constructedNext}
    </nav>
  );
}

function clickPaginationLink(id: string, node: React.RefObject<HTMLElement>) {
  return () => {
    if (node.current == null) {
      return;
    }

    const link: HTMLAnchorElement | null = node.current.querySelector(`#${id}`);
    if (link) {
      link.click();
    }
  };
}

function handleCallback(fn: () => void) {
  return () => {
    if (isInputFocused()) {
      return;
    }

    fn();
  };
}

export default withAppProvider<Props>()(Pagination);
