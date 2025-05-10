# Signal Desktop Development Guide

This guide provides comprehensive instructions for setting up and developing the Signal Desktop application, including details on the content filtering feature implementation.

## Environment Setup

### Node.js Setup

Signal Desktop requires a specific version of Node.js:

1. Install [nvm](https://github.com/creationix/nvm) (or [nvm-windows](https://github.com/coreybutler/nvm-windows) on Windows)
2. Use the required Node.js version:
   ```
   nvm install 22.14.0
   nvm use 22.14.0
   ```

### Package Manager Setup

Signal Desktop uses pnpm for package management:

1. Install pnpm globally:
   ```
   npm install -g pnpm@10.6.4
   ```

### Installing Dependencies

1. Clone the repository and install dependencies:
   ```
   git clone https://github.com/signalapp/Signal-Desktop.git
   cd Signal-Desktop
   pnpm install
   ```

2. Generate necessary assets:
   ```
   pnpm run generate
   ```

## Development Workflow

### Running the Application

Start the application in development mode:
```
pnpm start
```

For hot-reloading during development, run these in separate terminal windows:
```
pnpm run dev:transpile  # Recompiles TypeScript files
pnpm run dev:sass       # Recompiles SCSS files
```

### Building the Application

Create a production build:
```
pnpm run build
```

Run tests:
```
pnpm test
```

## Content Filtering Feature

The Signal Desktop application includes a content filtering system that can detect and filter duplicate or unwanted content in messages and attachments.

### FilterService

The core of the filtering functionality is the `FilterService` class located in `app/filter/FilterService.ts`. It provides methods to:

- Filter image attachments using perceptual hashing
- Filter text messages using similarity detection
- Check for duplicates in local and global databases

### Key Components

1. **Image Filtering**: Uses perceptual hashing via `getImageHash()` in `app/filter/imageHash.js` to generate and compare image fingerprints.

2. **Text Filtering**: Uses `getTextSimilarity()` from `app/filter/textFilter.js` to detect similar text content.

3. **AttachmentFilterToggle**: A UI component in `ts/components/attachment/AttachmentFilterToggle.tsx` that allows users to enable/disable filtering when uploading attachments.

4. **Filter Settings**: Configuration UI in `ts/components/settings/FilterSettings.tsx` for adjusting filter sensitivity and enabling/disabling features.

### Usage and Integration

The filter toggle is integrated into the composition area of conversations, allowing users to optionally filter attachments before sending. The filter settings are accessible from the application settings panel.

Key settings that can be configured:
- Enable/disable content filtering
- Use global database for filtering
- Adjust similarity threshold

## Testing

### Unit Testing

Run unit tests with:
```
pnpm test
```

The filter components have dedicated tests in:
```
ts/components/attachment/__tests__/AttachmentFilterToggle_test.tsx
```

### Manual Testing

1. Enable the filter toggle when sending attachments
2. Adjust settings in the Filter Settings panel
3. Send similar images or text to verify filtering behavior

## Troubleshooting

### Common Issues

1. **Missing dependencies**: Run `pnpm install` to ensure all dependencies are installed
2. **Build errors**: Clear the build cache with `pnpm run clean-transpile` then rebuild
3. **Type errors**: Check for missing type definitions and run `pnpm run check:types`

## Contributing

Follow the contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md) when making changes to the codebase. For filter-specific contributions:

1. Write tests for any new filter functionality
2. Ensure filter performance remains efficient
3. Follow the existing patterns for filter toggle state management
4. Document any changes to the filter threshold algorithm

## Additional Resources

- Signal Desktop repository: https://github.com/signalapp/Signal-Desktop
- Filter algorithm documentation (internal)
- Content hash database documentation (internal)

This documentation is maintained alongside the Signal Desktop codebase and is updated as the filtering functionality evolves.