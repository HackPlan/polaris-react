import React from 'react';
import {CaretUpMinor, CaretDownMinor} from '@shopify/polaris-icons';

import {classNames} from '../../../../utilities/css';
import {headerCell} from '../../../shared';
import {withAppProvider, WithAppProviderProps} from '../../../AppProvider';
import Icon from '../../../Icon';
import {SortDirection} from '../../types';

import styles from '../../ResourceTable.scss';

export interface Props {
  testID?: string;
  height?: number;
  content?: React.ReactNode;
  contentType?: string;
  fixed?: boolean;
  truncate?: boolean;
  header?: boolean;
  total?: boolean;
  footer?: boolean;
  sorted?: boolean;
  sortable?: boolean;
  sortDirection?: SortDirection;
  defaultSortDirection?: SortDirection;
  onSort?(): void;
  onClick?: (
    event: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>,
  ) => void;
  isDragOccurring?: boolean;
}

export type CombinedProps = Props & WithAppProviderProps;

export interface State {}

export interface Snapshot {
  width: number;
  height: number;
}

export class Cell extends React.Component<CombinedProps, State, Snapshot> {
  tdRef: HTMLElement | null;

  state: State = {};

  getSnapshotBeforeUpdate(prevProps: CombinedProps): Snapshot | null {
    if (!this.tdRef) {
      return null;
    }

    const isDragStarting: boolean =
      Boolean(this.props.isDragOccurring) && !prevProps.isDragOccurring;

    if (!isDragStarting) {
      return null;
    }

    const {width, height} = this.tdRef.getBoundingClientRect();
    return {width, height};
  }

  componentDidUpdate(
    _prevProps: CombinedProps,
    _prevState: State,
    snapshot?: Snapshot,
  ) {
    const ref = this.tdRef;
    if (!ref) {
      return;
    }

    if (snapshot) {
      if (parseInt(ref.style.width || '0', 10) === snapshot.width) {
        return;
      }
      ref.style.width = `${snapshot.width}px`;
      ref.style.height = `${snapshot.height}px`;
    }

    if (this.props.isDragOccurring) {
      return;
    }

    // inline styles not applied
    if (ref.style.width == null) {
      return;
    }

    // no snapshot and drag is finished - clear the inline styles
    ref.style.removeProperty('height');
    ref.style.removeProperty('width');
  }

  render() {
    const {
      height,
      content,
      contentType,
      fixed,
      truncate,
      header,
      total,
      footer,
      sorted,
      sortable,
      sortDirection,
      defaultSortDirection,
      polaris: {
        intl: {translate},
      },
      onSort,
      onClick,
    } = this.props;

    const numeric = contentType === 'numeric';

    const className = classNames(
      styles.Cell,
      fixed && styles['Cell-fixed'],
      fixed && truncate && styles['Cell-truncated'],
      header && styles['Cell-header'],
      total && styles['Cell-total'],
      footer && styles['Cell-footer'],
      numeric && styles['Cell-numeric'],
      sortable && styles['Cell-sortable'],
      sorted && styles['Cell-sorted'],
    );

    const headerClassName = classNames(
      header && styles.Heading,
      header && contentType === 'text' && styles['Heading-left'],
    );

    const iconClassName = classNames(sortable && styles.Icon);

    const style = {
      height: height ? `${height}px` : undefined,
    };

    const direction = sorted ? sortDirection : defaultSortDirection;
    const source = direction === 'ascending' ? CaretUpMinor : CaretDownMinor;
    const oppositeDirection =
      sortDirection === 'ascending' ? 'descending' : 'ascending';

    const sortAccessibilityLabel = translate(
      'Polaris.DataTable.sortAccessibilityLabel',
      {direction: sorted ? oppositeDirection : direction},
    );

    const iconMarkup = (
      <span className={iconClassName}>
        <Icon source={source} accessibilityLabel={sortAccessibilityLabel} />
      </span>
    );

    const sortableHeadingContent = (
      <button className={headerClassName} onClick={onSort}>
        {iconMarkup}
        {content}
      </button>
    );

    const columnHeadingContent = sortable ? sortableHeadingContent : content;

    const headingMarkup = header ? (
      <th
        {...headerCell.props}
        className={className}
        scope="col"
        aria-sort={sortDirection}
        style={style}
      >
        {columnHeadingContent}
      </th>
    ) : (
      <th className={className} scope="row" style={style}>
        {content}
      </th>
    );

    const cellMarkup =
      header || fixed ? (
        headingMarkup
      ) : (
        <td
          ref={(ref) => {
            this.tdRef = ref;
          }}
          className={className}
          style={style}
          onClick={onClick}
        >
          {content}
        </td>
      );

    return cellMarkup;
  }
}

export default withAppProvider<Props>()(Cell);
