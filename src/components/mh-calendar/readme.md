# mh-calendar

<!-- Auto Generated Below -->

## Properties

| Property | Attribute | Description | Type                 | Default       |
| -------- | --------- | ----------- | -------------------- | ------------- |
| `events` | `events`  |             | `MHCalendarEvents[]` | `MOCK_EVENTS` |

## Dependencies

### Depends on

- [mh-calendar-navigation](../mh-calendar-navigation)
- [mh-calendar-week](../mh-calendar-week)

### Graph

```mermaid
graph TD;
  mh-calendar --> mh-calendar-navigation
  mh-calendar --> mh-calendar-week
  mh-calendar-week --> mh-calendar-header
  mh-calendar-week --> mh-calendar-day
  mh-calendar-day --> mh-calendar-event
  style mh-calendar fill:#f9f,stroke:#333,stroke-width:4px
```

---

_Built with [StencilJS](https://stenciljs.com/)_
