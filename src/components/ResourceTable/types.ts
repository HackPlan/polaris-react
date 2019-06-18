export type SortDirection = 'ascending' | 'descending' | 'none';

export interface ColumnVisibilityData {
  leftEdge: number;
  rightEdge: number;
  isVisible?: boolean;
}

interface ScrollPosition {
  left?: number;
  top?: number;
}

export interface ResourceTableState {
  collapsed: boolean;
  columnVisibilityData: ColumnVisibilityData[];
  previousColumn?: ColumnVisibilityData;
  currentColumn?: ColumnVisibilityData;
  sortedColumnIndex?: number;
  sortDirection?: SortDirection;
  heights: number[];
  preservedScrollPosition: ScrollPosition;
  isScrolledFarthestLeft?: boolean;
  isScrolledFarthestRight?: boolean;
  selections: boolean[];
}
