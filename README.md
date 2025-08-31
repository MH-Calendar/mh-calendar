# MHCalendar Core

[![NPM Version](https://img.shields.io/npm/v/mh-calendar-core.svg)](https://www.npmjs.com/package/mh-calendar-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/documentation-site-blue.svg)]([https://mh-calendar.github.io/mh-calendar-docs])

The core Web Component for MHCalendar, a powerful and fully customizable calendar component for any framework, or no framework at all.

![mhcalendar](https://tinypic.host/images/2025/08/31/example.png)


## ✨ Features

-   🗓️ **Multiple Views**: Seamlessly switch between Day, Week, and Month layouts.
-   ⚡️ **Intuitive Drag & Drop**: Move events with ease.
-   🎨 **Highly Customizable**: Style every aspect with standard CSS or CSS-in-JS.
-   🧩 **Framework Agnostic**: Works natively in any project (Vanilla JS, Vue, Angular, Svelte, etc.) WIP.

---

## 🚀 Installation

Install the core package using your preferred package manager:

**npm**
```bash
npm install mh-calendar-core
```

**Yarn**
```bash
yarn add mh-calendar-core
```

**pnpm**
```bash
pnpm add mh-calendar-core
```

**Bun**
```bash
bun add mh-calendar-core
```

---

## Basic Usage

To use MHCalendar as a Web Component, you need to import its loader to define the custom element `<mh-calendar>`.

Here is a full example in a basic `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MHCalendar Core Demo</title>
  <!-- 1. Import and run the loader script -->
  <script type="module">
    import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/mh-calendar-core/loader/index.es2017.js';
    defineCustomElements();
  </script>
</head>
<body>
  
  <h1>My Calendar</h1>

  <!-- 2. Use the component tag in your HTML -->
  <!-- It's recommended to place it inside a container with a defined height -->
  <div style="height: 80vh;">
    <mh-calendar id="my-calendar"></mh-calendar>
  </div>

  <script>
    // 3. (Optional) Configure the component using JavaScript
    document.addEventListener('DOMContentLoaded', () => {
      const calendarElement = document.getElementById('my-calendar');
      
      // Pass configuration via the 'config' property
      calendarElement.config = {
        viewType: 'WEEK',
        events: [
          {
            id: '1',
            title: 'My First Event',
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 60 * 60 * 1000) // 1 hour later
          }
        ]
      };
    });
  </script>

</body>
</html>
```
> **Note**: In a project with a bundler (like Vite or Webpack), you should import from `'mh-calendar-core/loader'` in your main JavaScript file instead of using a CDN link.

---

## 📚 Full Documentation

For detailed information on all configuration options, API methods, and styling guides, please visit our **[full documentation site]([https://mh-calendar.github.io/mh-calendar-docs/])**.

## 📄 License

This project is licensed under the MIT License.

