# 100xBetter.ai Style Guide

This style guide outlines the design system used in the 100xBetter.ai application. The app leverages **Tailwind CSS v4** and follows a **Shadcn UI** inspired color variable system, utilizing modern `oklch` colors for vibrant and accurate rendering.

## 1. Typography

The application uses two primary fonts provided by Google Fonts:

- **Sans / Body Font:** [Inter](https://fonts.google.com/specimen/Inter)
- **Display / Heading Font:** [Lexend](https://fonts.google.com/specimen/Lexend)

### Usage in Tailwind v4
These are defined as CSS variables in your layout and mapped into Tailwind's v4 `@theme` directive:
```css
--font-sans: var(--font-inter);
--font-display: var(--font-lexend);
```

## 2. Color Palette (OKLCH)

The color system is fully defined in CSS variables using `oklch`. This ensures a highly consistent and perceivably uniform color scale across both Light and Dark modes.

### Light Mode (`:root`)
- **Background:** White `oklch(1 0 0)`
- **Foreground:** Dark Gray `oklch(0.145 0 0)`
- **Primary:** Dark Gray/Black `oklch(0.205 0 0)`
- **Primary Foreground:** Off-White `oklch(0.985 0 0)`
- **Secondary / Muted / Accent:** Light Gray `oklch(0.97 0 0)`
- **Destructive:** Red `oklch(0.577 0.245 27.325)`
- **Border / Input:** Very Light Gray `oklch(0.922 0 0)`
- **Ring:** Medium Gray `oklch(0.708 0 0)`
- **Chart Colors:** Various vibrant colors for data visualization.

### Dark Mode (`.dark`)
- **Background:** Dark Gray `oklch(0.145 0 0)`
- **Foreground:** Off-White `oklch(0.985 0 0)`
- **Primary:** Light Gray `oklch(0.922 0 0)`
- **Primary Foreground:** Dark Gray `oklch(0.205 0 0)`
- **Secondary / Muted / Accent:** Darker Gray `oklch(0.269 0 0)`
- **Destructive:** Light Red `oklch(0.704 0.191 22.216)`
- **Border / Input:** Subtle transparent white `oklch(1 0 0 / 10%)`
- **Ring:** Medium Gray `oklch(0.556 0 0)`

## 3. Tailwind v4 Configuration

To replicate this styling in another Next.js + Tailwind v4 project, you need the following `globals.css` file. Note how Tailwind v4 uses the `@theme inline` directive instead of a `tailwind.config.js` file:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --font-sans: var(--font-inter);
  --font-display: var(--font-lexend);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

## 6. Background Blob Gradients

The app uses a popular pattern to create abstract, glowing background blobs (often seen in the `Hero`, `Pricing`, and `Contact` sections). This is achieved by creating an empty `div`, applying a complex polygon `clipPath`, filling it with a linear gradient, and blurring the parent container heavily.

Here is the exact code snippet used to create these blobs. You can place this absolutely positioned block at the top of your relatively positioned sections (`relative isolate`):

```jsx
<div
  aria-hidden="true"
  className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
>
  <div
    style={{
      clipPath:
        "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
    }}
    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
  />
</div>
```

**Key Tailwind Classes Used:**
- `blur-3xl`: The massive blur that makes the harsh polygon look like a soft, glowing blob.
- `transform-gpu`: Ensures the blur and rotation are hardware-accelerated for performance.
- `bg-gradient-to-tr from-[#ff80b5] to-[#9089fc]`: Defines the gradient colors (a soft pink to a light purple). You can swap these hex codes to match your brand.
- `opacity-30`: Keeps the glow subtle so it doesn't overpower text.
```

## 4. Custom Scrollbar & Global Base Styles

Your global stylesheet also implements custom scrollbar styling, highlighting the accent color `#4f39f6`:

```css
html {
  scroll-behavior: smooth;
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  background: #4f39f6;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4f39f6;
}
```

## 5. Required Dependencies

To successfully copy this layout to another project, ensure you have these dependencies in your `package.json`:

```json
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    "next-themes": "^0.4.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.5"
  }
```
