import React from 'react';

import debounce from 'lodash/debounce';
import {EnableSelectionMinor} from '@shopify/polaris-icons';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  ResponderProvided,
} from 'react-beautiful-dnd';

import {classNames} from '../../utilities/css';
import Button from '../Button';
import EventListener from '../EventListener';
import Sticky from '../Sticky';
import Spinner from '../Spinner';
import {
  withAppProvider,
  WithAppProviderProps,
} from '../../utilities/with-app-provider';
import {
  ResourceListContext,
  SelectedItems,
  SELECT_ALL_ITEMS,
} from '../../utilities/resource-list';
import Select, {SelectOption} from '../Select';
import EmptySearchResult from '../EmptySearchResult';
import ResourceItem from '../ResourceItem';

import {
  BulkActions,
  BulkActionsProps,
  CheckableButton,
  FilterControl,
} from './components';

import styles from './ResourceList.scss';

const SMALL_SCREEN_WIDTH = 458;
const SMALL_SPINNER_HEIGHT = 28;
const LARGE_SPINNER_HEIGHT = 45;

export type Items = any[];

interface State {
  selectMode: boolean;
  loadingPosition: number;
  lastSelected: number | null;
  smallScreen: boolean;
}

export interface Props {
  /** Item data; each item is passed to renderItem */
  items: Items;
  filterControl?: React.ReactNode;
  /** Name of the resource, such as customers or products */
  resourceName?: {
    singular: string;
    plural: string;
  };
  /** Up to 2 bulk actions that will be given more prominence */
  promotedBulkActions?: BulkActionsProps['promotedActions'];
  /** Actions available on the currently selected items */
  bulkActions?: BulkActionsProps['actions'];
  /** Collection of IDs for the currently selected items */
  selectedItems?: SelectedItems;
  /** Renders a Select All button at the top of the list and checkboxes in front of each list item. For use when bulkActions aren't provided. **/
  selectable?: boolean;
  /** If there are more items than currently in the list */
  hasMoreItems?: boolean;
  /** Overlays item list with a spinner while a background action is being performed */
  loading?: boolean;
  /** Boolean to show or hide the header */
  showHeader?: boolean;
  /** Current value of the sort control */
  sortValue?: string;
  /** Collection of sort options to choose from */
  sortOptions?: SelectOption[];
  /** ReactNode to display instead of the sort control */
  alternateTool?: React.ReactNode;
  /** Callback when sort option is changed */
  onSortChange?(selected: string, id: string): void;
  /** Callback when selection is changed */
  onSelectionChange?(selectedItems: SelectedItems): void;
  /** Function to render each list item	 */
  renderItem(item: any, id: string, index: number): React.ReactNode;
  /** Function to customize the unique ID for each item */
  idForItem?(item: any, index: number): string;
  /** Function to resolve an id from a item */
  resolveItemId?(item: any): string;
  /** items of ResourceList will be allowed to drag and drop if this prop specified */
  onDragEnd?(result: DropResult, provided: ResponderProvided): void;
  /**
   * Custom title of EmptyStateView
   */
  emptyTitle?: string
  /**
   * Custom description of EmptyStateView
   */
  emptyDescription?: string
  /**
   * Custom EmptyStateView shows when rows data is empty
   */
  emptyView?: JSX.Element
}

type CombinedProps = Props & WithAppProviderProps;

class ResourceList extends React.Component<CombinedProps, State> {
  static Item = ResourceItem;
  static FilterControl = FilterControl;

  private defaultResourceName: {singular: string; plural: string};
  private listRef: React.RefObject<HTMLUListElement> = React.createRef();

  private handleResize = debounce(
    () => {
      const {selectedItems} = this.props;
      const {selectMode, smallScreen} = this.state;
      const newSmallScreen = isSmallScreen();

      if (
        selectedItems &&
        selectedItems.length === 0 &&
        selectMode &&
        !newSmallScreen
      ) {
        this.handleSelectMode(false);
      }

      if (smallScreen !== newSmallScreen) {
        this.setState({smallScreen: newSmallScreen});
      }
    },
    50,
    {leading: true, trailing: true, maxWait: 50},
  );

  constructor(props: CombinedProps) {
    super(props);

    const {
      selectedItems,
      polaris: {intl},
    } = props;

    this.defaultResourceName = {
      singular: intl.translate('Polaris.ResourceList.defaultItemSingular'),
      plural: intl.translate('Polaris.ResourceList.defaultItemPlural'),
    };

    // eslint-disable-next-line react/state-in-constructor
    this.state = {
      selectMode: Boolean(selectedItems && selectedItems.length > 0),
      loadingPosition: 0,
      lastSelected: null,
      smallScreen: isSmallScreen(),
    };
  }

  private get selectable() {
    const {promotedBulkActions, bulkActions, selectable} = this.props;

    return Boolean(
      (promotedBulkActions && promotedBulkActions.length > 0) ||
        (bulkActions && bulkActions.length > 0) ||
        selectable,
    );
  }

  private get bulkSelectState(): boolean | 'indeterminate' {
    const {selectedItems, items} = this.props;
    let selectState: boolean | 'indeterminate' = 'indeterminate';
    if (
      !selectedItems ||
      (Array.isArray(selectedItems) && selectedItems.length === 0)
    ) {
      selectState = false;
    } else if (
      selectedItems === SELECT_ALL_ITEMS ||
      (Array.isArray(selectedItems) && selectedItems.length === items.length)
    ) {
      selectState = true;
    }
    return selectState;
  }

  private get headerTitle() {
    const {
      resourceName = this.defaultResourceName,
      items,
      polaris: {intl},
      loading,
    } = this.props;

    const itemsCount = items.length;
    const resource =
      itemsCount === 1 && !loading
        ? resourceName.singular
        : resourceName.plural;

    const headerTitleMarkup = loading
      ? intl.translate('Polaris.ResourceList.loading', {resource})
      : intl.translate('Polaris.ResourceList.showing', {
          itemsCount,
          resource,
        });

    return headerTitleMarkup;
  }

  private get bulkActionsLabel() {
    const {
      selectedItems = [],
      items,
      polaris: {intl},
    } = this.props;

    const selectedItemsCount =
      selectedItems === SELECT_ALL_ITEMS
        ? `${items.length}+`
        : selectedItems.length;

    return intl.translate('Polaris.ResourceList.selected', {
      selectedItemsCount,
    });
  }

  private get bulkActionsAccessibilityLabel() {
    const {
      resourceName = this.defaultResourceName,
      selectedItems = [],
      items,
      polaris: {intl},
    } = this.props;

    const selectedItemsCount = selectedItems.length;
    const totalItemsCount = items.length;
    const allSelected = selectedItemsCount === totalItemsCount;

    if (totalItemsCount === 1 && allSelected) {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxDeselectAllSingle',
        {resourceNameSingular: resourceName.singular},
      );
    } else if (totalItemsCount === 1) {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxSelectAllSingle',
        {
          resourceNameSingular: resourceName.singular,
        },
      );
    } else if (allSelected) {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxDeselectAllMultiple',
        {
          itemsLength: items.length,
          resourceNamePlural: resourceName.plural,
        },
      );
    } else {
      return intl.translate(
        'Polaris.ResourceList.a11yCheckboxSelectAllMultiple',
        {
          itemsLength: items.length,
          resourceNamePlural: resourceName.plural,
        },
      );
    }
  }

  private get paginatedSelectAllText() {
    const {
      hasMoreItems,
      selectedItems,
      items,
      resourceName = this.defaultResourceName,
      polaris: {intl},
    } = this.props;

    if (!this.selectable || !hasMoreItems) {
      return;
    }

    if (selectedItems === SELECT_ALL_ITEMS) {
      return intl.translate('Polaris.ResourceList.allItemsSelected', {
        itemsLength: items.length,
        resourceNamePlural: resourceName.plural,
      });
    }
  }

  private get paginatedSelectAllAction() {
    const {
      hasMoreItems,
      selectedItems,
      items,
      resourceName = this.defaultResourceName,
      polaris: {intl},
    } = this.props;

    if (!this.selectable || !hasMoreItems) {
      return;
    }

    const actionText =
      selectedItems === SELECT_ALL_ITEMS
        ? intl.translate('Polaris.Common.undo')
        : intl.translate('Polaris.ResourceList.selectAllItems', {
            itemsLength: items.length,
            resourceNamePlural: resourceName.plural,
          });

    return {
      content: actionText,
      onAction: this.handleSelectAllItemsInStore,
    };
  }

  private get emptySearchResultText() {
    const {
      polaris: {intl},
      resourceName = this.defaultResourceName,
      emptyTitle,
      emptyDescription,
    } = this.props;

    return {
      title: emptyTitle !== undefined ? emptyTitle : intl.translate('Polaris.ResourceList.emptySearchResultTitle', {
        resourceNamePlural: resourceName.plural,
      }),
      description: emptyDescription !== undefined ? emptyDescription : intl.translate(
        'Polaris.ResourceList.emptySearchResultDescription',
      ),
    };
  }

  componentDidMount() {
    this.forceUpdate();
    if (this.props.loading) {
      this.setLoadingPosition();
    }
  }

  componentDidUpdate({
    loading: prevLoading,
    items: prevItems,
    selectedItems: prevSelectedItems,
  }: Props) {
    const {selectedItems, loading} = this.props;

    if (
      this.listRef.current &&
      this.itemsExist() &&
      !this.itemsExist(prevItems)
    ) {
      this.forceUpdate();
    }

    if (loading && !prevLoading) {
      this.setLoadingPosition();
    }

    if (selectedItems && selectedItems.length > 0 && !this.state.selectMode) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({selectMode: true});
      return;
    }

    if (
      prevSelectedItems &&
      prevSelectedItems.length > 0 &&
      (!selectedItems || selectedItems.length === 0) &&
      !isSmallScreen()
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({selectMode: false});
    }
  }

  onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    this.props.onDragEnd && this.props.onDragEnd(result, provided);
  };

  render() {
    const {
      items,
      promotedBulkActions,
      bulkActions,
      filterControl,
      loading,
      sortOptions,
      sortValue,
      alternateTool,
      selectedItems,
      resourceName = this.defaultResourceName,
      onSortChange,
      polaris: {intl},
      emptyView,
    } = this.props;
    const {selectMode, loadingPosition, smallScreen} = this.state;

    const filterControlMarkup = filterControl ? (
      <div className={styles.FiltersWrapper}>{filterControl}</div>
    ) : null;

    const bulkActionsMarkup = this.selectable ? (
      <div className={styles.BulkActionsWrapper}>
        <BulkActions
          label={this.bulkActionsLabel}
          accessibilityLabel={this.bulkActionsAccessibilityLabel}
          selected={this.bulkSelectState}
          onToggleAll={this.handleToggleAll}
          selectMode={selectMode}
          onSelectModeToggle={this.handleSelectMode}
          promotedActions={promotedBulkActions}
          paginatedSelectAllAction={this.paginatedSelectAllAction}
          paginatedSelectAllText={this.paginatedSelectAllText}
          actions={bulkActions}
          disabled={loading}
        />
      </div>
    ) : null;

    const sortingSelectMarkup =
      sortOptions && sortOptions.length > 0 && !alternateTool ? (
        <div className={styles.SortWrapper}>
          <Select
            label={intl.translate('Polaris.ResourceList.sortingLabel')}
            labelInline={!smallScreen}
            labelHidden={smallScreen}
            options={sortOptions}
            onChange={onSortChange}
            value={sortValue}
            disabled={selectMode}
          />
        </div>
      ) : null;

    const alternateToolMarkup =
      alternateTool && !sortingSelectMarkup ? (
        <div className={styles.AlternateToolWrapper}>{alternateTool}</div>
      ) : null;

    const headerTitleMarkup = (
      <div className={styles.HeaderTitleWrapper} testID="headerTitleWrapper">
        {this.headerTitle}
      </div>
    );

    const selectButtonMarkup = this.selectable ? (
      <div className={styles.SelectButtonWrapper}>
        <Button
          disabled={selectMode}
          icon={EnableSelectionMinor}
          onClick={this.handleSelectMode.bind(this, true)}
        >
          {intl.translate('Polaris.ResourceList.selectButtonText')}
        </Button>
      </div>
    ) : null;

    const checkableButtonMarkup = this.selectable ? (
      <div className={styles.CheckableButtonWrapper}>
        <CheckableButton
          accessibilityLabel={this.bulkActionsAccessibilityLabel}
          label={this.headerTitle}
          onToggleAll={this.handleToggleAll}
          plain
          disabled={loading}
        />
      </div>
    ) : null;

    const headerWrapperOverlay = loading ? (
      <div className={styles['HeaderWrapper-overlay']} />
    ) : null;

    const showEmptyState = !this.itemsExist() && !loading;

    const headerMarkup = !showEmptyState && (
      <div className={styles.HeaderOuterWrapper}>
        <Sticky boundingElement={this.listRef.current}>
          {(isSticky: boolean) => {
            const headerClassName = classNames(
              styles.HeaderWrapper,
              sortOptions &&
                sortOptions.length > 0 &&
                !alternateTool &&
                styles['HeaderWrapper-hasSort'],
              alternateTool && styles['HeaderWrapper-hasAlternateTool'],
              this.selectable && styles['HeaderWrapper-hasSelect'],
              loading && styles['HeaderWrapper-disabled'],
              this.selectable &&
                selectMode &&
                styles['HeaderWrapper-inSelectMode'],
              isSticky && styles['HeaderWrapper-isSticky'],
            );
            return (
              <div className={headerClassName} testID="ResourceList-Header">
                <EventListener event="resize" handler={this.handleResize} />
                {headerWrapperOverlay}
                <div className={styles.HeaderContentWrapper}>
                  {headerTitleMarkup}
                  {checkableButtonMarkup}
                  {alternateToolMarkup}
                  {sortingSelectMarkup}
                  {selectButtonMarkup}
                </div>
                {bulkActionsMarkup}
              </div>
            );
          }}
        </Sticky>
      </div>
    );

    const emptyStateMarkup = showEmptyState ? (
      <div className={styles.EmptySearchResultWrapper}>
        {emptyView || (
          <EmptySearchResult {...this.emptySearchResultText} withIllustration />
        )}
      </div>
    ) : null;

    const defaultTopPadding = 8;
    const topPadding =
      loadingPosition > 0 ? loadingPosition : defaultTopPadding;
    const spinnerStyle = {paddingTop: `${topPadding}px`};

    const spinnerSize = items.length < 2 ? 'small' : 'large';

    const loadingOverlay = loading ? (
      <React.Fragment>
        <div className={styles.SpinnerContainer} style={spinnerStyle}>
          <Spinner size={spinnerSize} accessibilityLabel="Items are loading" />
        </div>
        <div className={styles.LoadingOverlay} />
      </React.Fragment>
    ) : null;

    const className = classNames(
      styles.ItemWrapper,
      loading && styles['ItemWrapper-isLoading'],
    );
    const loadingWithoutItemsMarkup =
      loading && !this.itemsExist() ? (
        <div className={className} tabIndex={-1}>
          {loadingOverlay}
        </div>
      ) : null;

    const resourceListClassName = classNames(
      styles.ResourceList,
      loading && styles.disabledPointerEvents,
      selectMode && styles.disableTextSelection,
    );

    const listMarkup = this.itemsExist() ? (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <ul
          className={resourceListClassName}
          ref={this.listRef}
          aria-live="polite"
          aria-busy={loading}
        >
          {loadingOverlay}
          <Droppable droppableId="droppable">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {items.map(this.renderItem)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </ul>
      </DragDropContext>
    ) : (
      emptyStateMarkup
    );

    const context = {
      selectable: this.selectable,
      selectedItems,
      selectMode,
      resourceName,
      loading,
      onSelectionChange: this.handleSelectionChange,
    };

    return (
      <ResourceListContext.Provider value={context}>
        <div className={styles.ResourceListWrapper}>
          {filterControlMarkup}
          {headerMarkup}
          {listMarkup}
          {loadingWithoutItemsMarkup}
        </div>
      </ResourceListContext.Provider>
    );
  }

  private itemsExist(items?: Items) {
    return (items || this.props.items).length > 0;
  }

  private setLoadingPosition = () => {
    if (this.listRef.current != null) {
      if (typeof window === 'undefined') {
        return;
      }

      const overlay = this.listRef.current.getBoundingClientRect();
      const viewportHeight = Math.max(
        document.documentElement ? document.documentElement.clientHeight : 0,
        window.innerHeight || 0,
      );

      const overflow = viewportHeight - overlay.height;

      const spinnerHeight =
        this.props.items.length === 1
          ? SMALL_SPINNER_HEIGHT
          : LARGE_SPINNER_HEIGHT;

      const spinnerPosition =
        overflow > 0
          ? (overlay.height - spinnerHeight) / 2
          : (viewportHeight - overlay.top - spinnerHeight) / 2;

      this.setState({loadingPosition: spinnerPosition});
    }
  };

  private handleSelectAllItemsInStore = () => {
    const {
      onSelectionChange,
      selectedItems,
      items,
      idForItem = defaultIdForItem,
    } = this.props;

    const newlySelectedItems =
      selectedItems === SELECT_ALL_ITEMS
        ? getAllItemsOnPage(items, idForItem)
        : SELECT_ALL_ITEMS;

    if (onSelectionChange) {
      onSelectionChange(newlySelectedItems);
    }
  };

  private renderItem = (item: any, index: number) => {
    const {renderItem, idForItem = defaultIdForItem, onDragEnd} = this.props;
    const id = idForItem(item, index);

    return (
      <Draggable
        isDragDisabled={!onDragEnd}
        draggableId={id}
        index={index}
        key={id}
      >
        {(provided, snapshot) => {
          const draggableStyle = provided.draggableProps.style;
          const transform = draggableStyle ? draggableStyle.transform : null;
          return (
            <li
              ref={provided.innerRef}
              className={classNames(
                styles.ItemWrapper,
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
              {renderItem(item, id, index)}
            </li>
          );
        }}
      </Draggable>
    );
  };

  private handleMultiSelectionChange = (
    lastSelected: number,
    currentSelected: number,
    resolveItemId: (item: any) => string,
  ) => {
    const min = Math.min(lastSelected, currentSelected);
    const max = Math.max(lastSelected, currentSelected);
    return this.props.items.slice(min, max + 1).map(resolveItemId);
  };

  private handleSelectionChange = (
    selected: boolean,
    id: string,
    sortOrder: number | undefined,
    shiftKey: boolean,
  ) => {
    const {
      onSelectionChange,
      selectedItems,
      items,
      idForItem = defaultIdForItem,
      resolveItemId,
    } = this.props;
    const {lastSelected} = this.state;

    if (selectedItems == null || onSelectionChange == null) {
      return;
    }

    let newlySelectedItems =
      selectedItems === SELECT_ALL_ITEMS
        ? getAllItemsOnPage(items, idForItem)
        : [...selectedItems];

    if (sortOrder !== undefined) {
      this.setState({lastSelected: sortOrder});
    }

    let selectedIds: string[] = [id];

    if (
      shiftKey &&
      lastSelected != null &&
      sortOrder !== undefined &&
      resolveItemId
    ) {
      selectedIds = this.handleMultiSelectionChange(
        lastSelected,
        sortOrder,
        resolveItemId,
      );
    }
    newlySelectedItems = [...new Set([...newlySelectedItems, ...selectedIds])];

    if (!selected) {
      for (let i = 0; i < selectedIds.length; i++) {
        newlySelectedItems.splice(
          newlySelectedItems.indexOf(selectedIds[i]),
          1,
        );
      }
    }

    if (newlySelectedItems.length === 0 && !isSmallScreen()) {
      this.handleSelectMode(false);
    } else if (newlySelectedItems.length > 0) {
      this.handleSelectMode(true);
    }

    if (onSelectionChange) {
      onSelectionChange(newlySelectedItems);
    }
  };

  private handleSelectMode = (selectMode: boolean) => {
    const {onSelectionChange} = this.props;
    this.setState({selectMode});
    if (!selectMode && onSelectionChange) {
      onSelectionChange([]);
    }
  };

  private handleToggleAll = () => {
    const {
      onSelectionChange,
      selectedItems,
      items,
      idForItem = defaultIdForItem,
    } = this.props;

    let newlySelectedItems: string[] = [];

    if (
      (Array.isArray(selectedItems) && selectedItems.length === items.length) ||
      selectedItems === SELECT_ALL_ITEMS
    ) {
      newlySelectedItems = [];
    } else {
      newlySelectedItems = items.map((item, index) => {
        const id = idForItem(item, index);
        return id;
      });
    }

    if (newlySelectedItems.length === 0 && !isSmallScreen()) {
      this.handleSelectMode(false);
    } else if (newlySelectedItems.length > 0) {
      this.handleSelectMode(true);
    }

    if (onSelectionChange) {
      onSelectionChange(newlySelectedItems);
    }
  };
}

function getAllItemsOnPage(
  items: any,
  idForItem: (item: any, index: number) => string,
) {
  return items.map((item: any, index: number) => {
    return idForItem(item, index);
  });
}

function defaultIdForItem(item: any, index: number) {
  return item.hasOwnProperty('id') ? item.id : index.toString();
}

function isSmallScreen() {
  return typeof window === 'undefined'
    ? false
    : window.innerWidth <= SMALL_SCREEN_WIDTH;
}

export default withAppProvider<Props>()(ResourceList);
