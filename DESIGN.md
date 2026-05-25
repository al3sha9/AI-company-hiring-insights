---
name: Precision & Performance
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5a5e6b'
  on-secondary: '#ffffff'
  secondary-container: '#dcdfee'
  on-secondary-container: '#5e626f'
  tertiary: '#00533b'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e4f'
  on-tertiary-container: '#5af5bd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dfe2f1'
  secondary-fixed-dim: '#c3c6d5'
  on-secondary-fixed: '#171b26'
  on-secondary-fixed-variant: '#434653'
  tertiary-fixed: '#63fcc3'
  tertiary-fixed-dim: '#3edfa9'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
  cell-input: '#EBF5FF'
  cell-result: '#FEF9C3'
  cell-historical: '#DCFCE7'
  comparison-up: '#21CE99'
  comparison-down: '#EF4444'
  surface-muted: '#F8FAFC'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  mono-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  grid-margin: 24px
  grid-gutter: 12px
  cell-padding-x: 12px
  cell-padding-y: 8px
---

## Brand & Style

The design system is engineered for high-performance financial analysis, prioritizing data density, clarity, and trust. It balances the utilitarian efficiency of a spreadsheet with the refined aesthetics of a modern fintech platform. The personality is analytical and authoritative, designed to make complex numerical relationships immediately accessible.

The visual direction follows a **Corporate / Modern** style with a focus on **Minimalism**. It utilizes a strict grid-based structure to handle high-density information without visual clutter. The interface remains neutral to allow functional color coding—crucial for financial interpretation—to stand out as the primary signal.

## Colors

The palette is strategically divided between brand identity and functional utility. Indigo serves as the primary anchor for navigation and global actions, while the functional colors follow a strict semantic logic to guide the user through data entry and analysis.

- **Primary Indigo**: Used for branding, focus states, and primary calls to action.
- **Functional Cell Colors**: 
    - **Blue (#EBF5FF)**: Clearly identifies user-editable inputs.
    - **Yellow (#FEF9C3)**: Highlights calculated results and key takeaways.
    - **Green (#DCFCE7)**: Signifies read-only historical or archival data.
- **Comparison Indicators**: High-contrast Red and Green are used exclusively for performance delta and market direction.
- **Neutrals**: Utilize a range of cool grays derived from the professional blue-black palette of institutional tools to maintain a serious tone.

## Typography

This design system uses **Inter** for all applications. Inter’s tall x-height and clean apertures ensure that numerical data remains legible even at small sizes in dense table layouts.

The hierarchy is optimized for data-heavy environments. A specialized `mono-data` weight is suggested for tabular figures to ensure alignment, while `label-caps` provides clear distinction for table headers and metadata. For mobile views, large headlines should scale down to `headline-md` to maintain screen real estate for the data tables.

## Layout & Spacing

The layout model is a **Fluid Grid** designed for maximum screen utilization. It uses a 12-column system on desktop that collapses to a single column on mobile.

The spacing rhythm is tight, based on a 4px baseline to accommodate the "spreadsheet-style" interface. To maintain readability in high-density views, use horizontal internal padding in cells while keeping vertical padding minimal. 

- **Desktop**: 24px outer margins with 12px gutters.
- **Tablet**: 16px margins, 8px gutters.
- **Mobile**: 12px margins; prioritize vertical scrolling for tables or use horizontal "pinned-column" reflow for large datasets.

## Elevation & Depth

To maintain the precision of a professional tool, the design system utilizes **Low-contrast outlines** and **Tonal layers** rather than heavy shadows. 

Depth is achieved through subtle shifts in background saturation. The main dashboard surface is white, while the navigation sidebar and top toolbar use a slightly muted off-white or very light gray (`#F8FAFC`) to create a clear structural distinction. 

Borders are 1px wide and use a subtle gray (`#E2E8F0`) to define data cells and containers. Elevated elements like tooltips or dropdown menus use a single, crisp, low-opacity ambient shadow (Blur: 8px, Y: 4px, Opacity: 0.08) to float above the workspace without breaking the flat "grid" aesthetic.

## Shapes

The design system employs a **Soft** shape language. A 4px border radius (`roundedness: 1`) is applied to buttons, input fields, and cards. This slight rounding provides a modern feel while maintaining the rigid structural integrity required for a grid-based financial tool. 

Table cells remain sharp-cornered to preserve the spreadsheet aesthetic, but container headers and secondary components (like chips) use the soft 4px radius to distinguish them from the raw data.

## Components

### Data Tables
Tables are the core of the experience. Headers must be sticky, using `label-caps` typography and a solid bottom border. Rows should have a subtle hover state (`#F1F5F9`) to assist tracking across wide datasets. 

### Input Fields
Inputs use the `cell-input` background color (#EBF5FF). On focus, the background remains, but the border changes to `primary-color` with a 2px indigo glow. 

### Comparison Indicators
Price movements or percentage changes must include a small directional icon (chevron) and use the semantic Green or Red colors.

### Persistent Top Toolbar
A slim, high-density toolbar contains global filters, time-range selectors, and export actions. Use small-scale icons and `body-sm` text to maximize vertical workspace.

### Contextual Tooltips
Tooltips should be dark-themed (`#1E222D`) with white text to provide maximum contrast against the light-themed data cells. They provide detailed definitions for financial terms and calculation methodologies.

### Chips
Used for active filters. These should use a slightly more rounded shape (`rounded-lg`) than the standard buttons to differentiate them from actionable commands.
