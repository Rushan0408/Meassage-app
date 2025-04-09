# Guide for Setting Up UI Components

This guide provides instructions for downloading and setting up all required UI components for your messaging application.

## 1. Tailwind CSS Setup

The Tailwind CSS installation is already complete. To ensure it builds properly:

```bash
# Build Tailwind CSS
npm run build:tailwind

# For development with auto-reloading
npm run build:watch
```

## 2. Existing UI Components

The following UI components have already been created:

- Button (`components/ui/button.js`)
- Card (`components/ui/card.js`)
- Input (`components/ui/input.js`)
- Avatar (`components/ui/avatar.js`)
- DropdownMenu (`components/ui/dropdown-menu.js`)

## 3. Starting the Application

To start the application with Tailwind CSS properly built:

```bash
# Use our custom script
node start-app.js

# Or run these commands separately
npm run build:tailwind
npm start
```

## 4. Troubleshooting

If you encounter Tailwind CSS styling issues:

1. Ensure the CSS imports in `index.js` are in the correct order
2. Rebuild the Tailwind CSS file using `npm run build:tailwind`
3. Restart the application
4. Check for any errors in the browser console

Remember to run the Tailwind build step whenever you update your Tailwind configuration or add new UI components that use custom Tailwind classes. 