import React from 'react';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';

import Spinner from '../Spinner';
import EmptySearchResult from '../EmptySearchResult';
import Checkbox from '../Checkbox';

import {classNames} from '../../utilities/css';
import {headerCell} from '../shared';
import {withAppProvider, WithAppProviderProps} from '../AppProvider';
import EventListener from '../EventListener';
import {Cell, CellProps, Navigation} from './components';
import {measureColumn, getPrevAndCurrentColumns} from './utilities';

import {ResourceTableState, SortDirection} from './types';
import styles from './ResourceTable.scss';

export type CombinedProps = Props & WithAppProviderProps;
export type TableRow = Props['headings'] | Props['rows'] | Props['totals'];
export type TableData = string | number | React.ReactNode;
export type TableHeadingData = string | React.ReactNode;

export type ColumnContentType = 'text' | 'numeric';

export interface Props {
  /** List of data types, which determines content alignment for each column. Data types are "text," which aligns left, or "numeric," which aligns right. */
  columnContentTypes: ColumnContentType[];
  /** List of column headings. */
  headings: TableHeadingData[];
  /** List of numeric column totals, highlighted in the table’s header below column headings. Use empty strings as placeholders for columns with no total. */
  totals?: TableData[];
  /** Lists of data points which map to table body rows. */
  rows: TableData[][];
  /** Truncate content in first column instead of wrapping.
   * @default false
   */
  truncate?: boolean;
  /** Content centered in the full width cell of the table footer row. */
  footerContent?: TableData;
  /** List of booleans, which maps to whether sorting is enabled or not for each column. Defaults to false for all columns.  */
  sortable?: boolean[];
  /**
   * The direction to sort the table rows on first click or keypress of a sortable column heading. Defaults to ascending.
   * @default 'ascending'
   */
  defaultSortDirection?: SortDirection;
  /**
   * The index of the heading that the table rows are initially sorted by. Defaults to the first column.
   * @default 0
   */
  initialSortColumnIndex?: number;
  /** Callback fired on click or keypress of a sortable column heading. */
  onSort?(headingIndex: number, direction: SortDirection): void;
  /** Overlays item list with a spinner while a background action is being performed */
  loading?: boolean;
  /** Name of the resource, such as customers or products */
  resourceName?: {
    singular: string;
    plural: string;
  };
  /**
   * There will be a special selection column in table if true.
   * Default: false
   */
  selectable?: boolean;
  /**
   * this callback will be triggered if user select or unselect some row of table.
   * @param selectedIndex Selected index of rows in table
   */
  onSelection?: (selectedRowIndex: number[]) => void;
  /**
   * this callback will be triggered if user clicked a row.
   */
  onRowClicked?: (index: number) => void;
}

export class ResourceTable extends React.PureComponent<
  CombinedProps,
  ResourceTableState
> {
  state: ResourceTableState = {
    collapsed: false,
    columnVisibilityData: [],
    heights: [],
    preservedScrollPosition: {},
    isScrolledFarthestLeft: true,
    isScrolledFarthestRight: false,
    selections: new Array(this.props.rows.length).fill(false),
  };

  private resourceTable = React.createRef<HTMLDivElement>();
  private scrollContainer = React.createRef<HTMLDivElement>();
  private table = React.createRef<HTMLTableElement>();
  private totalsRowHeading: string;

  private handleResize = debounce(() => {
    const {footerContent, truncate} = this.props;
    const {
      table: {current: table},
      scrollContainer: {current: scrollContainer},
    } = this;
    let collapsed = false;
    if (table && scrollContainer) {
      collapsed = table.scrollWidth > scrollContainer.clientWidth;
      scrollContainer.scrollLeft = 0;
    }
    this.setState(
      {
        collapsed,
        heights: [],
        ...this.calculateColumnVisibilityData(collapsed),
      },
      () => {
        if (footerContent || !truncate) {
          this.setHeightsAndScrollPosition();
        }
      },
    );
  });

  constructor(props: CombinedProps) {
    super(props);
    const {translate} = props.polaris.intl;
    this.totalsRowHeading = translate('Polaris.DataTable.totalsRowHeading');
  }

  componentDidMount() {
    // We need to defer the calculation in development so the styles have time to be injected.
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        this.handleResize();
      }, 10);
    } else {
      this.handleResize();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (isEqual(prevProps, this.props)) {
      return;
    }
    this.handleResize();
  }

  get resourceName() {
    const {
      polaris: {intl},
    } = this.props;
    return (
      this.props.resourceName || {
        singular: intl.translate('Polaris.ResourceList.defaultItemSingular'),
        plural: intl.translate('Polaris.ResourceList.defaultItemPlural'),
      }
    );
  }

  get injectColumnContentTypes() {
    const {selectable, columnContentTypes} = this.props;
    return [
      ...(selectable ? ['text' as ColumnContentType] : []),
      ...columnContentTypes,
    ] as ColumnContentType[];
  }

  get injectTotals() {
    const {selectable, totals} = this.props;
    if (!totals) return undefined;
    return [...(selectable ? [''] : []), ...totals] as ColumnContentType[];
  }

  get injectHeadings() {
    const {headings, selectable} = this.props;
    return [...(selectable ? [<div key={Date.now()} />] : []), ...headings];
  }

  get injectRows() {
    const {rows, selectable, onSelection} = this.props;
    const MemoCheckbox = ({rowIndex}: {rowIndex: number}) => {
      const handleOnChange = () => {
        this.setState((prevState) => {
          const selections = prevState.selections;
          selections[rowIndex] = !selections[rowIndex];
          if (onSelection) {
            onSelection(
              selections
                .map((selected, index) => ({selected, index}))
                .filter((i) => i.selected)
                .map((i) => i.index),
            );
          }
          return {selections};
        });
        this.forceUpdate();
      };
      return (
        <Checkbox
          label=""
          checked={this.state.selections[rowIndex]}
          onChange={handleOnChange}
        />
      );
    };

    return rows.map((cells, rowIndex) => {
      return [
        ...(selectable
          ? [<MemoCheckbox key={Date.now()} rowIndex={rowIndex} />]
          : []),
        ...cells,
      ];
    });
  }

  render() {
    const {
      totals,
      truncate,
      footerContent,
      sortable,
      defaultSortDirection = 'ascending',
      initialSortColumnIndex = 0,
      loading,
    } = this.props;

    const {
      polaris: {intl},
    } = this.props;

    const {
      collapsed,
      columnVisibilityData,
      heights,
      sortedColumnIndex = initialSortColumnIndex,
      sortDirection = defaultSortDirection,
      isScrolledFarthestLeft,
      isScrolledFarthestRight,
    } = this.state;

    const className = classNames(
      styles.ResourceTable,
      collapsed && styles.collapsed,
      footerContent && styles.hasFooter,
    );

    const wrapperClassName = classNames(
      styles.TableWrapper,
      collapsed && styles.collapsed,
    );

    const footerClassName = classNames(footerContent && styles.TableFoot);

    const footerMarkup = footerContent ? (
      <tfoot className={footerClassName}>
        <tr>{this.renderFooter()}</tr>
      </tfoot>
    ) : null;

    const totalsMarkup = totals ? (
      <tr>{totals.map(this.renderTotals)}</tr>
    ) : null;

    const headingMarkup = (
      <tr>
        {this.injectHeadings.map((heading, headingIndex) => {
          let sortableHeadingProps;
          const id = `heading-cell-${headingIndex}`;

          if (sortable) {
            const isSortable = sortable[headingIndex];
            const isSorted = sortedColumnIndex === headingIndex;
            const direction = isSorted ? sortDirection : 'none';

            sortableHeadingProps = {
              defaultSortDirection,
              sorted: isSorted,
              sortable: isSortable,
              sortDirection: direction,
              onSort: this.defaultOnSort(headingIndex),
            };
          }

          const height = !truncate ? heights[0] : undefined;

          return (
            <Cell
              header
              key={id}
              testID={id}
              height={height}
              content={heading}
              contentType={this.injectColumnContentTypes[headingIndex]}
              truncate={truncate}
              {...sortableHeadingProps}
            />
          );
        })}
      </tr>
    );

    const bodyMarkup = this.injectRows.map(this.defaultRenderRow);
    const style = footerContent
      ? {marginBottom: `${heights[heights.length - 1]}px`}
      : undefined;

    const loadingMarkup = (
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignContent: 'center',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
          }}
        />
        <Spinner size="large" color="teal" />
      </div>
    );

    const emptyResult = (
      <div style={{paddingTop: 60, paddingBottom: 60}}>
        <EmptySearchResult
          title={intl.translate('Polaris.ResourceList.emptySearchResultTitle', {
            resourceNamePlural: this.resourceName.plural,
          })}
          description={intl.translate(
            'Polaris.ResourceList.emptySearchResultDescription',
          )}
          withIllustration
        />
      </div>
    );

    return (
      <div className={wrapperClassName}>
        <Navigation
          columnVisibilityData={columnVisibilityData}
          isScrolledFarthestLeft={isScrolledFarthestLeft}
          isScrolledFarthestRight={isScrolledFarthestRight}
          navigateTableLeft={this.navigateTable('left')}
          navigateTableRight={this.navigateTable('right')}
        />
        <div className={className} ref={this.resourceTable}>
          <div
            className={styles.ScrollContainer}
            ref={this.scrollContainer}
            style={style}
          >
            <EventListener event="resize" handler={this.handleResize} />
            <EventListener
              capture
              event="scroll"
              handler={this.scrollListener}
            />
            <table className={styles.Table} ref={this.table}>
              <thead>
                {headingMarkup}
                {totalsMarkup}
              </thead>
              <tbody>{bodyMarkup}</tbody>
              {footerMarkup}
            </table>
            {this.injectRows.length === 0 && emptyResult}
            {loading && loadingMarkup}
          </div>
        </div>
      </div>
    );
  }

  private tallestCellHeights = () => {
    const {footerContent, truncate} = this.props;
    const {
      table: {current: table},
    } = this;
    let {heights} = this.state;
    if (table) {
      const rows = Array.from(table.getElementsByTagName('tr'));

      if (!truncate) {
        return (heights = rows.map((row) => {
          const fixedCell = (row.childNodes as NodeListOf<HTMLElement>)[0];
          return Math.max(row.clientHeight, fixedCell.clientHeight);
        }));
      }

      if (footerContent) {
        const footerCellHeight = (rows[rows.length - 1]
          .childNodes as NodeListOf<HTMLElement>)[0].clientHeight;
        heights = [footerCellHeight];
      }
    }

    return heights;
  };

  private resetScrollPosition = () => {
    const {
      scrollContainer: {current: scrollContainer},
    } = this;
    if (scrollContainer) {
      const {
        preservedScrollPosition: {left, top},
      } = this.state;
      if (left) {
        scrollContainer.scrollLeft = left;
      }
      if (top) {
        window.scrollTo(0, top);
      }
    }
  };

  private setHeightsAndScrollPosition = () => {
    this.setState(
      {heights: this.tallestCellHeights()},
      this.resetScrollPosition,
    );
  };

  private calculateColumnVisibilityData = (collapsed: boolean) => {
    const {
      table: {current: table},
      scrollContainer: {current: scrollContainer},
      resourceTable: {current: resourceTable},
    } = this;
    if (collapsed && table && scrollContainer && resourceTable) {
      const headerCells = table.querySelectorAll(
        headerCell.selector,
      ) as NodeListOf<HTMLElement>;
      const collapsedHeaderCells = Array.from(headerCells);
      const firstVisibleColumnIndex = collapsedHeaderCells.length - 1;
      const tableLeftVisibleEdge = scrollContainer.scrollLeft;
      const tableRightVisibleEdge =
        scrollContainer.scrollLeft + resourceTable.offsetWidth;
      const tableData = {
        firstVisibleColumnIndex,
        tableLeftVisibleEdge,
        tableRightVisibleEdge,
      };

      const columnVisibilityData = collapsedHeaderCells.map(
        measureColumn(tableData),
      );

      const lastColumn = columnVisibilityData[columnVisibilityData.length - 1];

      return {
        columnVisibilityData,
        ...getPrevAndCurrentColumns(tableData, columnVisibilityData),
        isScrolledFarthestLeft: tableLeftVisibleEdge === 0,
        isScrolledFarthestRight: lastColumn.rightEdge <= tableRightVisibleEdge,
      };
    }

    return {
      columnVisibilityData: [],
      previousColumn: undefined,
      currentColumn: undefined,
    };
  };

  private scrollListener = () => {
    this.setState((prevState) => ({
      ...this.calculateColumnVisibilityData(prevState.collapsed),
    }));
  };

  private navigateTable = (direction: string) => {
    const {currentColumn, previousColumn} = this.state;
    const {
      scrollContainer: {current: scrollContainer},
    } = this;

    const handleScroll = () => {
      if (!currentColumn || !previousColumn) {
        return;
      }

      if (scrollContainer) {
        scrollContainer.scrollLeft =
          direction === 'right'
            ? currentColumn.rightEdge
            : previousColumn.leftEdge;

        requestAnimationFrame(() => {
          this.setState((prevState) => ({
            ...this.calculateColumnVisibilityData(prevState.collapsed),
          }));
        });
      }
    };

    return handleScroll;
  };

  private renderTotals = (total: TableData, index: number) => {
    const id = `totals-cell-${index}`;
    const {heights} = this.state;
    const {truncate = false} = this.props;

    let content;
    let contentType;

    if (index === 0) {
      content = this.totalsRowHeading;
    }

    if (total !== '' && index > 0) {
      contentType = 'numeric';
      content = total;
    }

    return (
      <Cell
        total
        testID={id}
        key={id}
        height={heights[1]}
        content={content}
        contentType={contentType}
        truncate={truncate}
      />
    );
  };

  private defaultRenderRow = (row: TableData[], index: number) => {
    const {totals, footerContent, truncate = false, onRowClicked} = this.props;
    const {heights} = this.state;
    const bodyCellHeights = totals ? heights.slice(2) : heights.slice(1);

    const className = classNames(styles.TableRow);

    const tableRowClickableClassName = onRowClicked
      ? classNames(styles.TableRowClickable)
      : '';

    const tableRowSelectableClassName = this.state.selections[index]
      ? classNames(styles.TableRowSelected)
      : '';

    if (footerContent) {
      bodyCellHeights.pop();
    }

    return (
      <tr
        key={`row-${index}`}
        className={[
          className,
          tableRowClickableClassName,
          tableRowSelectableClassName,
        ].join(' ')}
        onClick={() => {
          onRowClicked && onRowClicked(index);
        }}
      >
        {row.map((content: CellProps['content'], cellIndex: number) => {
          const id = `cell-${cellIndex}-row-${index}`;
          return (
            <Cell
              key={id}
              testID={id}
              height={bodyCellHeights[index]}
              content={content}
              contentType={this.injectColumnContentTypes[cellIndex]}
              truncate={truncate}
            />
          );
        })}
      </tr>
    );
  };

  private renderFooter = () => {
    const {heights} = this.state;
    const footerCellHeight = heights[heights.length - 1];

    return (
      <Cell
        footer
        testID="footer-cell"
        height={footerCellHeight}
        content={this.props.footerContent}
        truncate={this.props.truncate}
      />
    );
  };

  private defaultOnSort = (headingIndex: number) => {
    const {
      onSort,
      truncate,
      defaultSortDirection = 'ascending',
      initialSortColumnIndex,
    } = this.props;

    const {
      sortDirection = defaultSortDirection,
      sortedColumnIndex = initialSortColumnIndex,
    } = this.state;

    let newSortDirection = defaultSortDirection;

    if (sortedColumnIndex === headingIndex) {
      newSortDirection =
        sortDirection === 'ascending' ? 'descending' : 'ascending';
    }

    const handleSort = () => {
      this.setState(
        {
          sortDirection: newSortDirection,
          sortedColumnIndex: headingIndex,
        },
        () => {
          if (onSort) {
            onSort(headingIndex, newSortDirection);

            if (!truncate && this.scrollContainer.current) {
              const preservedScrollPosition = {
                left: this.scrollContainer.current.scrollLeft,
                top: window.scrollY,
              };

              this.setState({preservedScrollPosition});
              this.handleResize();
            }
          }
        },
      );
    };

    return handleSort;
  };
}

export default withAppProvider<Props>()(ResourceTable);
