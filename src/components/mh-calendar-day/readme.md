# mh-calendar-day

<!-- Auto Generated Below -->

## Properties

| Property          | Attribute           | Description | Type                 | Default            |
| ----------------- | ------------------- | ----------- | -------------------- | ------------------ |
| `day`             | `day`               |             | `Date`               | `undefined`        |
| `events`          | `events`            |             | `MHCalendarEvents[]` | `[]`               |
| `showCurrentDate` | `show-current-date` |             | `boolean`            | `SHOW_DATE_ON_DAY` |

## Dependencies

### Used by

- [mh-calendar-month](../mh-calendar-month)
- [mh-calendar-week](../mh-calendar-week)

### Depends on

- [mh-calendar-event](../mh-calendar-event)

### Graph

```mermaid
graph TD;
  mh-calendar-day --> mh-calendar-event
  mh-calendar-month --> mh-calendar-day
  mh-calendar-week --> mh-calendar-day
  style mh-calendar-day fill:#f9f,stroke:#333,stroke-width:4px
```

---

_Built with [StencilJS](https://stenciljs.com/)_
