import React from 'react';
import isEqual from 'lodash/isEqual';
import debounce from 'lodash/debounce';
import range from 'lodash/range';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  ResponderProvided,
} from 'react-beautiful-dnd';

import Spinner from '../Spinner';
import EmptySearchResult from '../EmptySearchResult';
import Checkbox from '../Checkbox';

import {classNames} from '../../utilities/css';
import {headerCell} from '../shared';
import {withAppProvider, WithAppProviderProps} from '../AppProvider';
import EventListener from '../EventListener';
import {
  Cell,
  CellProps,
  Navigation,
  BulkActions,
  BulkActionsProps,
  CheckableButton,
} from './components';
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
  /** Collection of IDs for the currently selected indexes */
  selectedIndexes?: number[];
  /**
   * this callback will be triggered if user select or unselect some row of table.
   * @param selectedIndexes Selected indexes of rows in table
   */
  onSelection?: (selectedRowIndexes: number[]) => void;
  /**
   * this callback will be triggered if user clicked a row.
   */
  onRowClicked?: (index: number) => void;
  /** Actions available on the currently selected items */
  bulkActions?: BulkActionsProps['actions'];
  /**
   * this react node will inject into table BulkActions and Navigation Stack section
   */
  headerNode?: React.ReactNode;
  /**
   * items of ResourceList will be allowed to drag and drop if this prop specified
   */
  onDragEnd?(result: DropResult, provided: ResponderProvided): void;
}

const IsDraggingContext = React.createContext<boolean>(false);

export class ResourceTable extends React.PureComponent<
  CombinedProps,
  ResourceTableState
> {
  state: ResourceTableState = {
    selectMode: false,
    collapsed: false,
    columnVisibilityData: [],
    heights: [],
    preservedScrollPosition: {},
    isScrolledFarthestLeft: true,
    isScrolledFarthestRight: false,
    isDragging: false,
    rowIds: [],
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
    this.generateRowIds();
  }

  componentDidUpdate(prevProps: Props) {
    if (isEqual(prevProps, this.props)) {
      return;
    }
    this.handleResize();
    this.generateRowIds();
  }

  generateRowIds() {
    this.setState({
      rowIds: this.props.rows.map(() => Math.random().toString()),
    });
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
    const {rows, selectable, selectedIndexes = [], onSelection} = this.props;
    const MemoCheckbox = ({rowIndex}: {rowIndex: number}) => {
      const handleOnChange = () => {
        const selectedIndexesSet = new Set(selectedIndexes);
        if (selectedIndexesSet.has(rowIndex)) {
          selectedIndexesSet.delete(rowIndex);
        } else {
          selectedIndexesSet.add(rowIndex);
        }
        const newSelectedIndexes = [...selectedIndexesSet].sort();
        if (onSelection) {
          onSelection(newSelectedIndexes);
        }
        if (newSelectedIndexes.length === 0) {
          this.handleSelectMode(false);
        } else if (newSelectedIndexes.length > 0) {
          this.handleSelectMode(true);
        }
      };
      return (
        <div style={{marginLeft: 17, width: 10}}>
          <Checkbox
            label=""
            checked={selectedIndexes && selectedIndexes.includes(rowIndex)}
            onChange={handleOnChange}
          />
        </div>
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

  private get resourceName() {
    return (
      this.props.resourceName || {
        singular: this.props.polaris.intl.translate(
          'Polaris.ResourceList.defaultItemSingular',
        ),
        plural: this.props.polaris.intl.translate(
          'Polaris.ResourceList.defaultItemPlural',
        ),
      }
    );
  }

  private get bulkActionsLabel() {
    const {
      selectedIndexes = [],
      polaris: {intl},
    } = this.props;

    const selectedCount = selectedIndexes.length;

    return intl.translate('Polaris.ResourceList.selected', {
      selectedItemsCount: selectedCount,
    });
  }

  private get bulkActionsAccessibilityLabel() {
    const {
      rows,
      selectedIndexes = [],
      polaris: {intl},
    } = this.props;

    const selectedCount = selectedIndexes.length;
    const totalItemsCount = rows.length;
    const allSelected = selectedCount === totalItemsCount;

    if (totalItemsCount === 1 && allSelected) {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxDeselectAllSingle',
        {resourceNameSingular: this.resourceName.singular},
      );
    } else if (totalItemsCount === 1) {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxSelectAllSingle',
        {
          resourceNameSingular: this.resourceName.singular,
        },
      );
    } else if (allSelected) {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxDeselectAllMultiple',
        {
          itemsLength: rows.length,
          resourceNamePlural: this.resourceName.plural,
        },
      );
    } else {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxSelectAllMultiple',
        {
          itemsLength: rows.length,
          resourceNamePlural: this.resourceName.plural,
        },
      );
    }
  }

  private get bulkSelectState(): boolean | 'indeterminate' {
    const {rows, selectedIndexes = []} = this.props;
    let selectState: boolean | 'indeterminate' = 'indeterminate';
    if (
      !selectedIndexes ||
      (Array.isArray(selectedIndexes) && selectedIndexes.length === 0)
    ) {
      selectState = false;
    } else if (selectedIndexes.length === rows.length) {
      selectState = true;
    }
    return selectState;
  }

  private get headerTitle() {
    const {
      rows,
      polaris: {intl},
      loading,
    } = this.props;
    const resourceName = this.resourceName;

    const rowsCount = rows.length;
    const resource =
      rowsCount === 1 && !loading ? resourceName.singular : resourceName.plural;

    const headerTitleMarkup = loading
      ? intl.translate('Polaris.ResourceList.loading', {resource})
      : intl.translate('Polaris.ResourceList.showing', {
          itemsCount: rowsCount,
          resource,
        });

    return headerTitleMarkup;
  }

  onBeforeDragStart = () => {
    this.setState({
      isDragging: true,
    });
  };

  onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    this.setState({
      isDragging: false,
    });
    this.props.onDragEnd && this.props.onDragEnd(result, provided);
  };

  render() {
    const {
      totals,
      truncate,
      footerContent,
      sortable,
      defaultSortDirection = 'ascending',
      initialSortColumnIndex = 0,
      loading,
      bulkActions,
      rows,
      headerNode,
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
      selectMode,
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

    const emptyResultMarkup = (
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

    const checkableButtonMarkup = (
      <div className={selectMode ? styles.HideCheckableButtonWrapper : ''}>
        <CheckableButton
          accessibilityLabel={this.bulkActionsAccessibilityLabel}
          label={this.headerTitle}
          onToggleAll={this.handleToggleAll}
          plain
          disabled={loading}
        />
      </div>
    );

    return (
      <div className={wrapperClassName}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{marginLeft: 8}}>
            {this.props.selectable && checkableButtonMarkup}
            <BulkActions
              label={this.bulkActionsLabel}
              accessibilityLabel={this.bulkActionsAccessibilityLabel}
              selected={this.bulkSelectState}
              onToggleAll={this.handleToggleAll}
              selectMode={selectMode}
              onSelectModeToggle={this.handleSelectMode}
              actions={bulkActions}
              disabled={loading}
            />
            <EventListener event="resize" handler={this.handleResize} />
          </div>
          {this.props.selectable && <div style={{height: 62}} />}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {this.props.selectable && (
              <div style={{marginRight: 16}}>{headerNode}</div>
            )}
            <Navigation
              columnVisibilityData={columnVisibilityData}
              isScrolledFarthestLeft={isScrolledFarthestLeft}
              isScrolledFarthestRight={isScrolledFarthestRight}
              navigateTableLeft={this.navigateTable('left')}
              navigateTableRight={this.navigateTable('right')}
            />
          </div>
        </div>
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
            <IsDraggingContext.Provider value={this.state.isDragging}>
              <DragDropContext
                onBeforeDragStart={this.onBeforeDragStart}
                onDragEnd={this.onDragEnd}
              >
                <table className={styles.Table} ref={this.table}>
                  <thead>
                    {headingMarkup}
                    {totalsMarkup}
                  </thead>
                  <Droppable droppableId="droppable">
                    {(provided) => (
                      <tbody
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {bodyMarkup}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                  {footerMarkup}
                </table>
              </DragDropContext>
            </IsDraggingContext.Provider>
            {!loading && rows.length === 0 && emptyResultMarkup}
            {loading && rows.length === 0 && <div style={{height: 380}} />}
            {loading && loadingMarkup}
          </div>
        </div>
      </div>
    );
  }

  private handleSelectMode = (selectMode: boolean) => {
    this.setState({selectMode});
  };

  private handleToggleAll = () => {
    const {onSelection, rows, selectedIndexes = []} = this.props;

    const shouldSelectAll = selectedIndexes.length !== rows.length;
    const newSelectedIndexes = shouldSelectAll ? range(rows.length) : [];

    if (newSelectedIndexes.length === 0) {
      this.handleSelectMode(false);
    } else if (newSelectedIndexes.length > 0) {
      this.handleSelectMode(true);
    }

    if (onSelection) {
      onSelection(newSelectedIndexes);
    }
  };

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
    const {
      totals,
      footerContent,
      truncate = false,
      onRowClicked,
      selectedIndexes = [],
      onDragEnd,
      onSelection,
    } = this.props;
    const {heights} = this.state;
    const bodyCellHeights = totals ? heights.slice(2) : heights.slice(1);

    const className = classNames(styles.TableRow);

    const tableRowClickableClassName = onRowClicked
      ? classNames(styles.TableRowClickable)
      : '';

    const tableRowSelectableClassName = selectedIndexes.includes(index)
      ? classNames(styles.TableRowSelected)
      : '';

    if (footerContent) {
      bodyCellHeights.pop();
    }

    const draggableId = this.state.rowIds[index] || Math.random().toString();
    return (
      <Draggable
        isDragDisabled={!onDragEnd}
        draggableId={draggableId}
        index={index}
        key={draggableId}
      >
        {(provided, snapshot) => {
          const draggableStyle = provided.draggableProps.style;
          const transform = draggableStyle ? draggableStyle.transform : null;
          return (
            <tr
              ref={provided.innerRef}
              key={`row-${index}`}
              className={classNames(
                className,
                tableRowClickableClassName,
                tableRowSelectableClassName,
                snapshot.isDragging ? styles.IsDragging : '',
              )}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                ...(transform && {
                  transform: `translate(0, ${transform.substring(
                    transform.indexOf(',') + 1,
                    transform.indexOf(')'),
                  )})`,
                }),
              }}
            >
              <IsDraggingContext.Consumer>
                {(isDragging: boolean) => {
                  return row.map(
                    (content: CellProps['content'], cellIndex: number) => {
                      const id = `cell-${cellIndex}-row-${index}`;
                      return (
                        <Cell
                          isSelection={cellIndex === 0 && Boolean(onSelection)}
                          key={id}
                          testID={id}
                          height={bodyCellHeights[index]}
                          content={content}
                          contentType={this.injectColumnContentTypes[cellIndex]}
                          truncate={truncate}
                          onClick={() => {
                            if (this.props.selectable && cellIndex === 0) {
                              return;
                            }
                            onRowClicked && onRowClicked(index);
                          }}
                          isDragOccurring={isDragging}
                        />
                      );
                    },
                  );
                }}
              </IsDraggingContext.Consumer>
              {}
            </tr>
          );
        }}
      </Draggable>
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
