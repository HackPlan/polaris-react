---
name: Resource list
category: Lists and tables
keywords:
  - ResourceList
  - collections
  - items
  - objects
  - list of products
  - list of orders
  - product lists
  - order lists
  - collections lists
  - collection lists
  - list of collections
  - product listings list
  - channel lists
  - resource list attributes
  - list attributes
  - exceptions list
  - list secondary actions
  - secondary actions in a list
  - list of resources
  - filter
  - sort
---

# Resource list

A resource list displays a collection of objects of the same type, like products or customers. The main job of a resource list is to help merchants find an object and navigate to a full-page representation of it.

Resource lists can also:

- Support [customized list items](/components/lists-and-tables/resource-item)
- Include bulk actions so merchants can act on multiple objects at once
- Support sorting and [filtering](/components/lists-and-tables/filters) of long lists
- Be paired with pagination to make long lists digestible

---

## Examples

### Simple resource list

A resource list with simple items and no bulk actions, sorting, or filtering.

```jsx
<Card>
  <ResourceList
    resourceName={{singular: 'customer', plural: 'customers'}}
    items={[
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ]}
    renderItem={(item) => {
      const {id, url, name, location} = item;
      const media = <Avatar customer size="medium" name={name} />;

      return (
        <ResourceItem
          id={id}
          url={url}
          media={media}
          accessibilityLabel={`View details for ${name}`}
        >
          <h3>
            <TextStyle variation="strong">{name}</TextStyle>
          </h3>
          <div>{location}</div>
        </ResourceItem>
      );
    }}
  />
</Card>
```

### Resource List with selection and no bulk actions

A resource list with simple items and selection.

```jsx
class ResourceListExample extends React.Component {
  state = {
    selectedItems: [],
  };

  handleSelectionChange = (selectedItems) => {
    this.setState({selectedItems});
  };

  renderItem = (item) => {
    const {id, url, name, location} = item;
    const media = <Avatar customer size="medium" name={name} />;

    return (
      <ResourceItem
        id={id}
        url={url}
        media={media}
        accessibilityLabel={`View details for ${name}`}
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const resourceName = {
      singular: 'customer',
      plural: 'customers',
    };

    const items = [
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ];

    return (
      <Card>
        <ResourceList
          resourceName={resourceName}
          items={items}
          renderItem={this.renderItem}
          selectedItems={this.state.selectedItems}
          onSelectionChange={this.handleSelectionChange}
          selectable
        />
      </Card>
    );
  }
}
```

### Simple resource list with drag and drop

A resource list with simple items and no bulk actions, sorting, or filtering. See the [case study below](#study) for implementation details.

```jsx
class ResourceListExample extends React.Component {
  state = {
    items: [
      {
        id: 341,
        url: '',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: '',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ]
  }

  render() {
    return (
      <Card>
        <ResourceList
          resourceName={{singular: 'customer', plural: 'customers'}}
          items={this.state.items}
          renderItem={(item, xxx, index) => {
            const {id, url, name, location} = item;
            const media = <Avatar customer size="medium" name={name} />;

            return (
              <ResourceList.Item
                id={id}
                url={url}
                media={media}
                accessibilityLabel={`View details for ${name}`}
              >
                <h3>
                  <TextStyle variation="strong">{name}</TextStyle>
                </h3>
                <div>{location}</div>
              </ResourceList.Item>
            );
          }}
          onDragEnd={(result) => {
            // dropped outside the list
            if (!result.destination) {
              return;
            }
            const {items} = this.state;
            items.splice(result.destination.index, 0, items.splice(result.source.index, 1)[0]);

            this.setState({
              items
            });
          }}
        />
      </Card>
    )
  }
}
```

### Resource list with bulk actions

Allows merchants to select items and perform an action on the selection.

```jsx
class ResourceListExample extends React.Component {
  state = {
    selectedItems: [],
  };

  handleSelectionChange = (selectedItems) => {
    this.setState({selectedItems});
  };

  renderItem = (item) => {
    const {id, url, name, location} = item;
    const media = <Avatar customer size="medium" name={name} />;

    return (
      <ResourceItem
        id={id}
        url={url}
        media={media}
        accessibilityLabel={`View details for ${name}`}
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const resourceName = {
      singular: 'customer',
      plural: 'customers',
    };

    const items = [
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ];

    const promotedBulkActions = [
      {
        content: 'Edit customers',
        onAction: () => console.log('Todo: implement bulk edit'),
      },
    ];

    const bulkActions = [
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
    ];

    return (
      <Card>
        <ResourceList
          resourceName={resourceName}
          items={items}
          renderItem={this.renderItem}
          selectedItems={this.state.selectedItems}
          onSelectionChange={this.handleSelectionChange}
          promotedBulkActions={promotedBulkActions}
          bulkActions={bulkActions}
        />
      </Card>
    );
  }
}
```

### Resource list with loading state

Notifies merchants that list items are being processed.

```jsx
class ResourceListExample extends React.Component {
  state = {
    selectedItems: [],
  };

  handleSelectionChange = (selectedItems) => {
    this.setState({selectedItems});
  };

  renderItem = (item) => {
    const {id, url, name, location} = item;
    const media = <Avatar customer size="medium" name={name} />;

    return (
      <ResourceItem
        id={id}
        url={url}
        media={media}
        accessibilityLabel={`View details for ${name}`}
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const resourceName = {
      singular: 'customer',
      plural: 'customers',
    };

    const items = [
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ];

    const promotedBulkActions = [
      {
        content: 'Edit customers',
        onAction: () => console.log('Todo: implement bulk edit'),
      },
    ];

    const bulkActions = [
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
    ];

    return (
      <Card>
        <ResourceList
          resourceName={resourceName}
          items={items}
          renderItem={this.renderItem}
          selectedItems={this.state.selectedItems}
          onSelectionChange={this.handleSelectionChange}
          promotedBulkActions={promotedBulkActions}
          bulkActions={bulkActions}
          loading={true}
        />
      </Card>
    );
  }
}
```

### Resource list with sorting

Allows merchants to change the way the list is sorted by selecting one of several options from a [Select](/components/forms/select) control.

```jsx
class ResourceListExample extends React.Component {
  state = {
    sortValue: 'DATE_MODIFIED_DESC',
  };

  handleSortChange = (sortValue) => {
    this.setState({sortValue});
  };

  renderItem = (item) => {
    const {id, url, name, location} = item;
    const media = <Avatar customer size="medium" name={name} />;

    return (
      <ResourceItem
        id={id}
        url={url}
        media={media}
        accessibilityLabel={`View details for ${name}`}
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const resourceName = {
      singular: 'customer',
      plural: 'customers',
    };

    const items = [
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ];

    return (
      <Card>
        <ResourceList
          resourceName={resourceName}
          items={items}
          renderItem={this.renderItem}
          sortValue={this.state.sortValue}
          sortOptions={[
            {label: 'Newest update', value: 'DATE_MODIFIED_DESC'},
            {label: 'Oldest update', value: 'DATE_MODIFIED_ASC'},
          ]}
          onSortChange={(selected) => {
            this.setState({sortValue: selected});
            console.log(`Sort option changed to ${selected}.`);
          }}
        />
      </Card>
    );
  }
}
```

### Resource list with alternate tool

Allows merchants to add an alternate tool in the current sort option location when sort may not be the most relevant action for the current list.

```jsx
class ResourceListExample extends React.Component {
  renderItem = (item) => {
    const {id, url, name, location} = item;
    const media = <Avatar customer size="medium" name={name} />;

    return (
      <ResourceItem
        id={id}
        url={url}
        media={media}
        accessibilityLabel={`View details for ${name}`}
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const resourceName = {
      singular: 'Customer',
      plural: 'Customers',
    };

    const items = [
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ];

    return (
      <Card>
        <ResourceList
          items={items}
          renderItem={this.renderItem}
          resourceName={resourceName}
          alternateTool={<Button>Email customers</Button>}
        />
      </Card>
    );
  }
}
```

### Resource list with filtering

Allows merchants to narrow the resource list to a subset of the original items.

```jsx
class ResourceListExample extends React.Component {
  state = {
    taggedWith: 'VIP',
    queryValue: null,
  };

  renderItem = (item) => {
    const {id, url, name, location} = item;
    const media = <Avatar customer size="medium" name={name} />;

    return (
      <ResourceItem id={id} url={url} media={media}>
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const {taggedWith, queryValue} = this.state;
    const resourceName = {
      singular: 'customer',
      plural: 'customers',
    };

    const items = [
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
    ];

    const filters = [
      {
        key: 'taggedWith',
        label: 'Tagged with',
        filter: (
          <TextField
            label="Tagged with"
            value={taggedWith}
            onChange={this.handleChange('taggedWith')}
            labelHidden
          />
        ),
        shortcut: true,
      },
    ];

    const appliedFilters = Object.keys(this.state)
      .filter((key) => !isEmpty(this.state[key]) && key === 'taggedWith')
      .map((key) => {
        return {
          key,
          label: disambiguateLabel(key, this.state[key]),
          onRemove: this.handleRemove,
        };
      });

    const filterControl = (
      <Filters
        queryValue={queryValue}
        filters={filters}
        appliedFilters={appliedFilters}
        onQueryChange={this.handleChange('queryValue')}
        onQueryClear={this.handleQueryClear}
        onClearAll={this.handleClearAll}
      >
        <div style={{paddingLeft: '8px'}}>
          <Button onClick={() => console.log('New filter saved')}>Save</Button>
        </div>
      </Filters>
    );

    return (
      <Card>
        <ResourceList
          resourceName={resourceName}
          items={items}
          renderItem={this.renderItem}
          filterControl={filterControl}
        />
      </Card>
    );
  }

  handleChange = (key) => (value) => {
    this.setState({[key]: value});
  };

  handleRemove = (key) => {
    this.setState({[key]: null});
  };

  handleQueryClear = () => {
    this.setState({queryValue: null});
  };

  handleClearAll = () => {
    this.setState({
      taggedWith: null,
      queryValue: null,
    });
  };
}

function disambiguateLabel(key, value) {
  switch (key) {
    case 'taggedWith':
      return `Tagged with ${value}`;
    default:
      return value;
  }
}

function isEmpty(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  } else {
    return value === '' || value == null;
  }
}
```

### Resource list with item shortcut actions

Shortcut actions are intended to provide quick access to popular actions from the resource’s details page. They are shown when the mouse is hovered over the list item, and are not shown on small screen devices, so the action must also be accessible in another way.

```jsx
<Card>
  <ResourceList
    resourceName={{singular: 'customer', plural: 'customers'}}
    items={[
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
        latestOrderUrl: 'orders/1456',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
        latestOrderUrl: 'orders/1457',
      },
    ]}
    renderItem={(item) => {
      const {id, url, name, location, latestOrderUrl} = item;
      const media = <Avatar customer size="medium" name={name} />;
      const shortcutActions = latestOrderUrl
        ? [
            {
              content: 'View latest order',
              accessibilityLabel: `View ${name}'s latest order`,
              url: latestOrderUrl,
            },
          ]
        : null;

      return (
        <ResourceItem
          id={id}
          url={url}
          media={media}
          accessibilityLabel={`View details for ${name}`}
          shortcutActions={shortcutActions}
        >
          <h3>
            <TextStyle variation="strong">{name}</TextStyle>
          </h3>
          <div>{location}</div>
        </ResourceItem>
      );
    }}
  />
</Card>
```

### Resource list with persistent item shortcut actions

Use persistent shortcut actions in rare cases when the action cannot be made available on the item’s details page. Persistent shortcut actions roll up into an overflow menu on small screens.

```jsx
<Card>
  <ResourceList
    resourceName={{singular: 'customer', plural: 'customers'}}
    items={[
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
        latestOrderUrl: 'orders/1456',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
        latestOrderUrl: 'orders/1457',
      },
    ]}
    renderItem={(item) => {
      const {id, url, name, location, latestOrderUrl} = item;
      const media = <Avatar customer size="medium" name={name} />;
      const shortcutActions = latestOrderUrl
        ? [
            {
              content: 'View latest order',
              accessibilityLabel: `View ${name}'s latest order`,
              url: latestOrderUrl,
            },
          ]
        : null;

      return (
        <ResourceItem
          id={id}
          url={url}
          media={media}
          accessibilityLabel={`View details for ${name}`}
          shortcutActions={shortcutActions}
          persistActions
        >
          <h3>
            <TextStyle variation="strong">{name}</TextStyle>
          </h3>
          <div>{location}</div>
        </ResourceItem>
      );
    }}
  />
</Card>
```

### Resource list with multiselect

Allows merchants to select or deselect multiple items at once.

```jsx
class ResourceListExample extends React.Component {
  state = {
    selectedItems: [],
  };

  handleSelectionChange = (selectedItems) => {
    this.setState({selectedItems});
  };

  renderItem = (item, _, index) => {
    const {id, url, name, location} = item;
    const media = <Avatar customer size="medium" name={name} />;

    return (
      <ResourceItem
        id={id}
        url={url}
        media={media}
        sortOrder={index}
        accessibilityLabel={`View details for ${name}`}
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const resourceName = {
      singular: 'customer',
      plural: 'customers',
    };

    const items = [
      {
        id: 231,
        url: 'customers/231',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
      },
      {
        id: 246,
        url: 'customers/246',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
      },
      {
        id: 276,
        url: 'customers/276',
        name: 'Joe Smith',
        location: 'Arizona, USA',
      },
      {
        id: 349,
        url: 'customers/349',
        name: 'Haden Jerado',
        location: 'Decatur, USA',
      },
      {
        id: 419,
        url: 'customers/419',
        name: 'Tom Thommas',
        location: 'Florida, USA',
      },
      {
        id: 516,
        url: 'customers/516',
        name: 'Emily Amrak',
        location: 'Texas, USA',
      },
    ];

    const promotedBulkActions = [
      {
        content: 'Edit customers',
        onAction: () => console.log('Todo: implement bulk edit'),
      },
    ];

    const bulkActions = [
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
    ];

    return (
      <Card>
        <ResourceList
          resourceName={resourceName}
          items={items}
          renderItem={this.renderItem}
          selectedItems={this.state.selectedItems}
          onSelectionChange={this.handleSelectionChange}
          promotedBulkActions={promotedBulkActions}
          bulkActions={bulkActions}
          resolveItemId={resolveItemIds}
        />
      </Card>
    );
  }
}

function resolveItemIds({id}) {
  return id;
}
```

### Resource list with all of its elements

Use as a broad example that includes most props available to resource list.

```jsx
class ResourceListExample extends React.Component {
  state = {
    selectedItems: [],
    sortValue: 'DATE_MODIFIED_DESC',
    taggedWith: 'VIP',
    queryValue: null,
  };

  renderItem = (item) => {
    const {id, url, name, location, latestOrderUrl} = item;
    const media = <Avatar customer size="medium" name={name} />;
    const shortcutActions = latestOrderUrl
      ? [{content: 'View latest order', url: latestOrderUrl}]
      : null;
    return (
      <ResourceItem
        id={id}
        url={url}
        media={media}
        accessibilityLabel={`View details for ${name}`}
        shortcutActions={shortcutActions}
        persistActions
      >
        <h3>
          <TextStyle variation="strong">{name}</TextStyle>
        </h3>
        <div>{location}</div>
      </ResourceItem>
    );
  };

  render() {
    const {taggedWith, queryValue} = this.state;
    const resourceName = {
      singular: 'customer',
      plural: 'customers',
    };

    const items = [
      {
        id: 341,
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
        latestOrderUrl: 'orders/1456',
      },
      {
        id: 256,
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
        latestOrderUrl: 'orders/1457',
      },
    ];

    const promotedBulkActions = [
      {
        content: 'Edit customers',
        onAction: () => console.log('Todo: implement bulk edit'),
      },
    ];

    const bulkActions = [
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
    ];

    const filters = [
      {
        key: 'taggedWith',
        label: 'Tagged with',
        filter: (
          <TextField
            label="Tagged with"
            value={taggedWith}
            onChange={this.handleChange('taggedWith')}
            labelHidden
          />
        ),
        shortcut: true,
      },
    ];

    const appliedFilters = Object.keys(this.state)
      .filter((key) => !isEmpty(this.state[key]) && key === 'taggedWith')
      .map((key) => {
        return {
          key,
          label: disambiguateLabel(key, this.state[key]),
          onRemove: this.handleRemove,
        };
      });

    const filterControl = (
      <Filters
        queryValue={queryValue}
        filters={filters}
        appliedFilters={appliedFilters}
        onQueryChange={this.handleChange('queryValue')}
        onQueryClear={this.handleQueryClear}
        onClearAll={this.handleClearAll}
      >
        <div style={{paddingLeft: '8px'}}>
          <Button onClick={() => console.log('New filter saved')}>Save</Button>
        </div>
      </Filters>
    );

    return (
      <Card>
        <ResourceList
          resourceName={resourceName}
          items={items}
          renderItem={this.renderItem}
          selectedItems={this.state.selectedItems}
          onSelectionChange={this.handleSelectionChange}
          promotedBulkActions={promotedBulkActions}
          bulkActions={bulkActions}
          sortValue={this.state.sortValue}
          sortOptions={[
            {label: 'Newest update', value: 'DATE_MODIFIED_DESC'},
            {label: 'Oldest update', value: 'DATE_MODIFIED_ASC'},
          ]}
          onSortChange={(selected) => {
            this.setState({sortValue: selected});
            console.log(`Sort option changed to ${selected}.`);
          }}
          filterControl={filterControl}
        />
      </Card>
    );
  }

  handleSelectionChange = (selectedItems) => {
    this.setState({selectedItems});
  };

  handleChange = (key) => (value) => {
    this.setState({[key]: value});
  };

  handleRemove = (key) => {
    this.setState({[key]: null});
  };

  handleQueryClear = () => {
    this.setState({queryValue: null});
  };

  handleClearAll = () => {
    this.setState({
      taggedWith: null,
      queryValue: null,
    });
  };
}

function disambiguateLabel(key, value) {
  switch (key) {
    case 'taggedWith':
      return `Tagged with ${value}`;
    default:
      return value;
  }
}

function isEmpty(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  } else {
    return value === '' || value == null;
  }
}
```

---

## Build

Using a resource list in a project involves combining the following components and subcomponents:

- ResourceList
- [ResourceItem](/components/lists-and-tables/resource-item) or a customized list item
- [Filters](#subcomponent-filter-control) (optional)
- Pagination component (optional)

<!-- hint -->

The resource list component provides the UI elements for list sorting, filtering, and pagination, but doesn’t provide the logic for these operations. When a sort option is changed, filter added, or second page requested, you’ll need to handle that event (including any network requests) and then update the component with new props.

<!-- end -->

---

## Purpose

Shopify is organized around objects that represent merchants businesses, like customers, products, and orders. Each individual order, for example, is given a dedicated page that can be linked to. In Shopify, we call these types of objects _resources_, and we call the object’s dedicated page its _details page_.

### Problem

Take orders as an example. Merchants may have a lot of them. They need a way to scan their orders, see what state they’re in and find out which ones need action first. In other words, they need a way find an individual order, call up more information about it, and take action on it.

### Solution

Resource lists function as:

- A content format, presenting a set of individual resources in a compact form
- A system for taking action on one or more individual resources
- A way to navigate to an individual resource’s details page

Because a details page displays all the content and actions for an individual resource, you can think of a resource list as a summary of these details pages. In this way resource lists bridge a middle level in Shopify’s navigation hierarchy.

<div class="TypeContainerImage TypeContainerImage--PageBackground">

![Schematic showing content from a details page being surfaced on a resource list](/public_images/resource-list/list-surfacing-show@2x.png)

</div>

<!-- hint -->

#### Hint

#### A resource list isn’t a data table

On wide screens, a resource list often looks like a table, especially if some content is aligned in columns. Despite this, resource lists and data tables have different purposes.

A data table is a form of data visualization. It works best to present highly structured data for comparison and analysis.

If your use case is more about visualizing or analyzing data, use the [data table component](/components/lists-and-tables/data-table). If your use case is more about finding and taking action on objects, use a resource list.

<!-- end -->

---

## Best practices

Resource lists can live in many places in Shopify. You could include a short resource list in a card summarizing recent marketing activities. You could also dedicate an entire page to a resource list like Shopify’s main products list.

Resource lists should:

- Have items that perform an action when clicked. The action should navigate to the resource’s details page or otherwise provide more detail about the item.
- [Customize the content and layout](/components/lists-and-tables/resource-item) of their list items to support merchants’ needs.
- Support sorting if the list can be long, and especially if different merchant tasks benefit from different sort orders.
- Support [filtering](/components/lists-and-tables/filters) if the list can be long.
- Paginate when the current list contains more than 50 items.
- Use the [skeleton page](/components/feedback-indicators/skeleton-page) component on initial page load for the rest of the page if the loading prop is true and items are processing.

Resource lists can optionally:

- Provide bulk actions for tasks that are often applied to many list items at once. For example, merchants may want to add the same tag to a large number of products.

---

## Content guidelines

Resource lists should:

- Identify the type of resource, usually with a heading

  <!-- usagelist -->

  #### Do

  - Products
  - Showing 50 products

  #### Don’t

  - _No heading_

  <!-- end -->

- Indicate when not all members of a resource are being shown. For a card summarizing and linking to recently purchased products:

  <!-- usagelist -->

  #### Do

  - Popular products this week

  #### Don’t

  - Products

  <!-- end -->

- Follow the verb + noun formula for bulk actions

- Follow the [content guidelines for filter options and applied filters](https://polaris.shopify.com/components/lists-and-tables/filters#section-content-guidelines)

---

## Related components

- To present structured data for comparison and analysis, like when helping merchants to gain insights or review analytics, use the [data table component](/components/lists-and-tables/data-table)
- To display a simple list of related content, [use the list component](/components/lists-and-tables/list)
