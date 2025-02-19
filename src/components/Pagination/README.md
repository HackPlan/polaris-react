---
name: Pagination
category: Navigation
platforms:
  - android
  - ios
  - web
keywords:
  - lists
  - detail
  - page
  - pager
  - previous
  - next
  - navigation between pages
  - page arrows
  - list navigation
  - list arrows
  - list pagination
  - list pages
  - previous next buttons
  - previous buttons
  - next buttons
  - ios
  - android
---

# Pagination

Use pagination to let merchants move through an ordered collection of items that has been split into pages. On the web, pagination uses buttons to move back and forth between pages. On iOS and Android, pagination uses infinite scrolling.

---

## Best practices

On all platforms, pagination should:

- Only be used for lists with more than 25 items

Web pagination should:

- Be placed at the bottom of a long list that has been split up into pages
- Pagination should navigate to the previous and next set of items in the paged list
- Hint when merchants are at the first or the last page by disabling the corresponding button

iOS and Android pagination should:

- Start loading items when merchants are close to the bottom, roughly 5 items from the end
- Show [a spinner](/components/feedback-indicators/spinner) below the list to indicate that items have been requested

---

## Examples

### Default pagination

<!-- example-for: web -->

Use for pagination at the bottom of lists.

```jsx
<Pagination
  hasPrevious
  onPrevious={() => {
    console.log('Previous');
  }}
  hasNext
  onNext={() => {
    console.log('Next');
  }}
/>
```

### Pagination with keyboard navigation

<!-- example-for: web -->

Attach standard keyboard shortcuts to important pagination controls.

```jsx
<div style={{height: '100px'}}>
  <Pagination
    hasPrevious
    previousKeys={[74]}
    previousTooltip="j"
    onPrevious={() => {
      console.log('Previous');
    }}
    hasNext
    nextKeys={[75]}
    nextTooltip="k"
    onNext={() => {
      console.log('Next');
    }}
  />
</div>
```

### Default pagination with page numbers

<!-- example-for: web -->

Use for pagination at the bottom of lists.

```jsx
class PaginationNumberDemo extends React.Component {
  state = {
    currentPage: 4,
    totalPage: 10,
  }

  render() {
    return (
      <Pagination
        hasPrevious={this.state.currentPage > 1}
        onPrevious={() => {
          this.setState((prevState) => ({ currentPage: prevState.currentPage-1 }))
        }}
        hasNext={this.state.currentPage < this.state.totalPage}
        onNext={() => {
          this.setState((prevState) => ({ currentPage: prevState.currentPage+1 }))
        }}
        currentPage={this.state.currentPage}
        totalPage={this.state.totalPage}
        onPageChange={(page) => { console.log(page); this.setState({ currentPage: page }) }}
        showGotoPageButton
      />
    )
  }
}

```

### Infinite scroll

<!-- example-for: ios, android -->

Use for lists longer than 25 items. In mobile apps it’s natural to scroll to the bottom of the screen to load more items.

<!-- content-for: android -->

![Infinite scroll pagination on Android](/public_images/components/Pagination/android/default@2x.png)

<!-- /content-for -->

<!-- content-for: ios -->

![Infinite scroll pagination on iOS](/public_images/components/Pagination/ios/default@2x.png)

<!-- /content-for -->

---

## Related components

- To see how pagination is used on a page, see the [page component](/components/structure/page)
- To add primary and secondary calls to action at the bottom of a page, see the [page actions component](/components/structure/page-actions)
- The [resource list component](/components/lists-and-tables/resource-list) is often combined with pagination to handle long lists of resources such as orders or customers
- To create stand-alone navigational links or calls to action, use the [button component](/components/actions/button)
- To embed actions or pathways to more information within a sentence, use the [link component](/components/navigation/link)
