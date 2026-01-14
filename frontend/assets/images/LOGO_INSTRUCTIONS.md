# App Logo Setup Instructions

## Logo File Location
Save your app logo image as: `frontend/assets/images/app-logo.png`

## Image Requirements
- **Format**: PNG (with transparency preferred)
- **Recommended Size**: 512x512 pixels or higher (for best quality)
- **Aspect Ratio**: Square (1:1)
- **Background**: Transparent or white background

## Where the Logo is Used

The app logo (`app-logo.png`) is now used in the following screens:

1. **SplashScreen** (`src/screens/SplashScreen.js`)
   - Displayed in the center of the splash screen
   - Size: 80x80 pixels

2. **AboutUsScreen** (`src/screens/AboutUsScreen.js`)
   - Displayed in the logo section at the top
   - Size: 120x120 pixels (with padding)

3. **LoginScreen** (`src/screens/LoginScreen.js`)
   - Displayed in the top-left corner
   - Size: 50x50 pixels (with padding)

## Steps to Add Your Logo

1. Save your logo image file as `app-logo.png`
2. Place it in the `frontend/assets/images/` directory
3. The app will automatically use it in all the screens listed above

## Note
If you need to update the logo in the future, simply replace the `app-logo.png` file with your new logo while keeping the same filename.

