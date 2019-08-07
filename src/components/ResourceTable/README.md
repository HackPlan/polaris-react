---
name: Resource table
category: Lists and tables
keywords:
  - ResourceTable
  - data
  - table
  - tabular
  - index
---

# Resource table

Resource tables are used to organize and display all information from a data set. While a data visualization represents part of data set, a resource table lets merchants view details from the entire set. This helps merchants compare and analyze the data.

---

## Examples

### Default resource table

Use to present small amounts of data for merchants to view statically.

```jsx
class ResourceTableExample extends React.Component {
  render() {
    const rowIds = ['row1', 'row2', 'row3'];
    const rows = [
      ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00'],
      ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00'],
      [
        'Navy Merino Wool Blazer with khaki chinos and yellow belt',
        '$445.00',
        124518,
        32,
        '$14,240.00',
      ],
    ];

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
            totals={['', '', '', 255, '$155,830.00']}
            onRowClicked={(index) => { console.log(index) }}
          />
        </Card>
      </Page>
    );
  }
}
```

### Default resource table with input

Use to present small amounts of data for merchants to view statically.

```jsx
class ResourceTableExample extends React.Component {
  state = {
    input: ''
  }

  render() {
    const rowIds = ['row1', 'row2', 'row3'];
    const rows = [
      ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00'],
      ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00'],
      [
        'Navy Merino Wool Blazer with khaki chinos and yellow belt',
        '$445.00',
        124518,
        32,
        <TextField value={this.state.input} onChange={(value) => this.setState({ input: value }) } />
      ],
    ];

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
            totals={['', '', '', 255, '$155,830.00']}
            onRowClicked={(index) => { console.log(index) }}
          />
        </Card>
      </Page>
    );
  }
}
```

### Resource table with drag and drop

Use to present small amounts of data for merchants to view statically.

```jsx
class ResourceTableExample extends React.Component {
  state = {
    rowIds: ['row1', 'row2', 'row3'],
    rows: [
      ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00'],
      ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00'],
      [
        'Navy Merino Wool Blazer with khaki chinos and yellow belt',
        '$445.00',
        124518,
        32,
        '$14,240.00',
      ],
    ],
  }

  render() {
    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={this.state.rowIds}
            rows={this.state.rows}
            totals={['', '', '', 255, '$155,830.00']}
            onRowClicked={(index) => { console.log(index) }}
            onDragEnd={(result) => {
              // dropped outside the list
              if (!result.destination) {
                return;
              }
              const {rows} = this.state;
              rows.splice(result.destination.index, 0, rows.splice(result.source.index, 1)[0]);

              this.setState({
                rows
              });
            }}
          />
        </Card>
      </Page>
    );
  }
}
```

### Sortable resource table

Use when clarity of the table’s content is needed. For example, to note the number of rows currently shown in a resource table with pagination.

```jsx
class SortableResourceTableExample extends React.Component {
  state = {
    sortedRows: null,
  };

  sortCurrency = (rows, index, direction) => {
    return [...rows].sort((rowA, rowB) => {
      const amountA = parseFloat(rowA[index].substring(1));
      const amountB = parseFloat(rowB[index].substring(1));

      return direction === 'descending' ? amountB - amountA : amountA - amountB;
    });
  };

  handleSort = (rows) => (index, direction) => {
    this.setState({sortedRows: this.sortCurrency(rows, index, direction)});
  };

  render() {
    const {sortedRows} = this.state;
    const rowIds = ['row1', 'row2', 'row3'];
    const initiallySortedRows = [
      ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00'],
      ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00'],
      [
        'Navy Merino Wool Blazer with khaki chinos and yellow belt',
        '$445.00',
        124518,
        32,
        '$14,240.00',
      ],
    ];
    const rows = sortedRows ? sortedRows : initiallySortedRows;

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
            totals={['', '', '', 255, '$155,830.00']}
            sortable={[false, true, false, false, true]}
            defaultSortDirection="descending"
            initialSortColumnIndex={4}
            onSort={this.handleSort(rows)}
          />
        </Card>
      </Page>
    );
  }
}
```

### Resource table with footer

Use when clarity of the table’s content is needed. For example, to note the number of rows currently shown in a resource table with pagination.

```jsx
class ResourceTableFooterExample extends React.Component {
  render() {
    const rowIds = ['row1', 'row2', 'row3'];
    const rows = [
      ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00'],
      ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00'],
      [
        'Navy Merino Wool Blazer with khaki chinos and yellow belt',
        '$445.00',
        124518,
        32,
        '$14,240.00',
      ],
    ];

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
            totals={['', '', '', 255, '$155,830.00']}
            footerContent={`Showing ${rows.length} of ${rows.length} results`}
          />
        </Card>
      </Page>
    );
  }
}
```

### Resource table with row heading links

Use to help merchants find relevant, finer grained data sets.

```jsx
class ResourceTableLinkExample extends React.Component {
  render() {
    const rowIds = ['row1', 'row2', 'row3'];
    const rows = [
      [
        <Link url="https://www.example.com">Emerald Silk Gown</Link>,
        '$875.00',
        124689,
        140,
        '$122,500.00',
      ],
      [
        <Link url="https://www.example.com">Mauve Cashmere Scarf</Link>,
        '$230.00',
        124533,
        83,
        '$19,090.00',
      ],
      [
        <Link url="https://www.example.com">
          Navy Merino Wool Blazer with khaki chinos and yellow belt
        </Link>,
        '$445.00',
        124518,
        32,
        '$14,240.00',
      ],
    ];

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
            totals={['', '', '', 255, '$155,830.00']}
          />
        </Card>
      </Page>
    );
  }
}
```

### Resource table with all of its elements

Use as a broad example that includes most props available to resource table.

```jsx
class FullResourceTableExample extends React.Component {
  state = {
    sortedRows: null,
  };

  sortCurrency = (rows, index, direction) => {
    return [...rows].sort((rowA, rowB) => {
      const amountA = parseFloat(rowA[index].substring(1));
      const amountB = parseFloat(rowB[index].substring(1));

      return direction === 'descending' ? amountB - amountA : amountA - amountB;
    });
  };

  handleSort = (rows) => (index, direction) => {
    this.setState({sortedRows: this.sortCurrency(rows, index, direction)});
  };

  render() {
    const {sortedRows} = this.state;
    const rowIds = ['row1', 'row2', 'row3'];
    const initiallySortedRows = [
      [
        <Link url="https://www.example.com">Emerald Silk Gown</Link>,
        '$875.00',
        124689,
        140,
        '$121,500.00',
      ],
      [
        <Link url="https://www.example.com">Mauve Cashmere Scarf</Link>,
        '$230.00',
        124533,
        83,
        '$19,090.00',
      ],
      [
        <Link url="https://www.example.com">
          Navy Merino Wool Blazer with khaki chinos and yellow belt
        </Link>,
        '$445.00',
        124518,
        32,
        '$14,240.00',
      ],
    ];

    const rows = sortedRows ? sortedRows : initiallySortedRows;

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
            totals={['', '', '', 255, '$155,830.00']}
            sortable={[false, true, false, false, true]}
            defaultSortDirection="descending"
            initialSortColumnIndex={4}
            onSort={this.handleSort(rows)}
            footerContent={`Showing ${rows.length} of ${rows.length} results`}
          />
        </Card>
      </Page>
    );
  }
}
```

### Loading resource table

Use to present small amounts of data for merchants to view statically.

```jsx
class ResourceTableExample extends React.Component {
  render() {
    const rowIds = ['row1', 'row2', 'row3'];
    const rows = [
      ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00'],
      ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00'],
      [
        'Navy Merino Wool Blazer with khaki chinos and yellow belt',
        '$445.00',
        124518,
        32,
        '$14,240.00',
      ],
    ];

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            loading={true}
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
            totals={['', '', '', 255, '$155,830.00']}
          />
        </Card>
      </Page>
    );
  }
}
```

### Empty state resource table

Use to present small amounts of data for merchants to view statically.

```jsx
class ResourceTableExample extends React.Component {
  render() {
    const rowIds = [];
    const rows = [
    ];

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
            ]}
            rowIds={rowIds}
            rows={rows}
          />
        </Card>
      </Page>
    );
  }
}
```

### Resource table with selection

Use to present small amounts of data for merchants to view statically.

```jsx
class ResourceTableExample extends React.Component {
  state = {
    selectedIndexes: [],
    rowIds: ['row1', 'row2', 'row3'],
    rows: [
      ['Emerald Silk Gown', '$875.00', 124689, 140, '$122,500.00', <Button size="slim" primary>Button</Button>],
      ['Mauve Cashmere Scarf', '$230.00', 124533, 83, '$19,090.00', <Button size="slim" primary>Button</Button>],
      [
        'Navy Merino Wool Blazer with khaki chinos and yellow belt',
        '$445.00',
        124518,
        32,
        '$14,240.00',
        <Button size="slim" primary onClick={(event) => { console.log('button clicked'); }}>Button</Button>,
      ],
    ]
  }

  render() {

    return (
      <Page title="Sales by product">
        <Card>
          <ResourceTable
            selectable={true}
            selectedIndexes={this.state.selectedIndexes}
            onSelection={(selectedIndexes) => {
              this.setState({ selectedIndexes })
              console.log(selectedIndexes)
            }}
            columnContentTypes={[
              'text',
              'numeric',
              'numeric',
              'numeric',
              'numeric',
              'text',
            ]}
            headings={[
              'Product',
              'Price',
              'SKU Number',
              'Net quantity',
              'Net sales',
              'Actions',
            ]}
            rowIds={this.state.rowIds}
            rows={this.state.rows}
            onRowClicked={(index) => { console.log(index) }}
            bulkActions={[
              {
                content: 'Add tags',
                onAction: () => console.log('Todo: implement bulk add tags'),
              },
              {
                content: 'Remove tags',
                onAction: () => console.log('Todo: implement bulk remove tags'),
              },
              {
                content: 'Delete customers',
                onAction: () => console.log('Todo: implement bulk delete'),
              },
            ]}
            headerNode={<Button>Button</Button>}
          />
        </Card>
      </Page>
    );
  }
}
```

---

## Best practices

Resource tables should:

- Show values across multiple categories and measures.
- Allow for filtering and ordering when comparison is not a priority.
- Help merchants visualize and scan many values from an entire data set.
- Help merchants find other values in the data hierarchy through use of links.
- Minimize clutter by only including values that supports the data’s purpose.
- Include a summary row to surface the column totals.
- Not include calculations within the summary row.
- Wrap instead of truncate content. This is because if row titles start with the same word, they’ll all appear the same when truncated.
- Not to be used for an actionable list of items that link to details pages. For this functionality, use the [resource list] component.

### Alignment

Column content types are built into the component props so the following alignment rules are followed:

- Numerical = Right aligned
- Textual data = Left aligned
- Align headers with their related data
- Don’t center align

---

## Content guidelines

Headers should:

- Be informative and descriptive
- Concise and scannable
- Include units of measurement symbols so they aren’t repeated throughout the columns
- Use sentence case (first word capitalized, rest lowercase)

<!-- usagelist -->

#### Do

Temperature °C

#### Don’t

Temperature

<!-- end -->

Column content should:

- Be concise and scannable
- Not include units of measurement symbols (put those symbols in the headers)
- Use sentence case (first word capitalized, rest lowercase)

### Decimals

Keep decimals consistent. For example, don’t use 3 decimals in one row and 2 in others.

---

## Related components

- To create an actionable list of related items that link to details pages, such as a list of customers, use the [resource list component](/components/lists-and-tables/resource-list).

---

## Accessibility

<!-- content-for: android -->

See Material Design and development documentation about accessibility for Android:

- [Accessible design on Android](https://material.io/design/usability/accessibility.html)
- [Accessible development on Android](https://developer.android.com/guide/topics/ui/accessibility/)

<!-- /content-for -->

<!-- content-for: ios -->

See Apple’s Human Interface Guidelines and API documentation about accessibility for iOS:

- [Accessible design on iOS](https://developer.apple.com/design/human-interface-guidelines/ios/app-architecture/accessibility/)
- [Accessible development on iOS](https://developer.apple.com/accessibility/ios/)

<!-- /content-for -->

<!-- content-for: web -->

### Structure

Native HTML tables provide a large amount of structural information to screen reader users. Merchants who rely on screen readers can navigate tables and identify relationships between data cells (`<td>`) and headers (`<th>`) using keys specific to their screen reader.

Sortable tables use the `aria-sort` attribute to convey which columns are sortable (and in what direction). They also use `aria-label` on sorting buttons to convey what activating the button will do.

<!-- usageblock -->

#### Do

Use tables for tabular data.

#### Don’t

Use tables for layout. For a table-like layout that doesn’t use table HTML elements, use the [resource list component](/components/lists-and-tables/resource-list).

<!-- end -->

### Keyboard support

Sorting controls for the resource table component are implemented with native HTML buttons.

- Give buttons keyboard focus with the <kbd>tab</kbd> key (or <kbd>shift</kbd> + <kbd>tab</kbd> when tabbing backwards)
- Activate buttons with the <kbd>enter</kbd>/<kbd>return</kbd> and <kbd>space</kbd> keys

<!-- /content-for -->
