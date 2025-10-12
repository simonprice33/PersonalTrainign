# Node.js v24.5.0 Compatibility Setup

## Changes Made for Node.js v24.5.0 Compatibility

### Package.json Updates:
- ✅ **Removed CRACO**: No longer needed, using standard react-scripts
- ✅ **React Version**: Downgraded from v19 to v18.3.1 for better compatibility
- ✅ **React Router**: Downgraded from v7.5.1 to v6.26.2 for stability
- ✅ **Scripts Updated**: Now uses standard react-scripts commands

### Scripts Changed:
```json
{
  "start": "react-scripts start",    // Was: "craco start"
  "build": "react-scripts build",   // Was: "craco build"
  "test": "react-scripts test",     // Was: "craco test"
  "eject": "react-scripts eject"    // New
}
```

## Setup Instructions After Git Pull:

1. **Clean Install Dependencies:**
```powershell
# Navigate to frontend directory
cd frontend

# Remove existing node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Fresh install
npm install --legacy-peer-deps
```

2. **Start Development Server:**
```powershell
npm start
```

3. **Build for Production:**
```powershell
npm run build
```

## What's Different:
- No more CRACO configuration needed
- Standard Create React App setup
- Tailwind CSS still works via postcss.config.js
- All Shadcn/UI components still functional
- Dark theme and all styling preserved

## If You Still Get Errors:
Try these alternative install methods:

```powershell
# Option 1: Force install
npm install --force

# Option 2: Use exact versions
npm ci

# Option 3: Clear npm cache first
npm cache clean --force
npm install --legacy-peer-deps
```

## Troubleshooting:
- If you see any CRACO errors, make sure you've pulled the latest changes
- The app should now start without the "ajv/dist/compile/codegen" error
- All functionality remains the same, just using standard React Scripts now