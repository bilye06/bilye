### 1. Prerequisites
Before you begin, ensure you have the following installed:
* **Node.js** (LTS version recommended)
* **Expo Go** app on your physical device (Android/iOS) or an Emulator/Simulator.

### 2. Installation
Clone the repository and install dependencies.

```bash
# Clone the repo
git clone <your-repo-url>
cd <your-project-folder>

# Install dependencies (Use npx expo install to ensure version compatibility)
npx expo install

```

### 3. Environment Setup

This project uses **Supabase** for data. You must configure your API keys.

1. Create a file named `.env` in the root directory (same level as `package.json`).
2. Add your Supabase credentials using the `EXPO_PUBLIC_` prefix (this exposes them to the app).

```ini
# .env
EXPO_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
EXPO_PUBLIC_SUPABASE_KEY=your-anon-public-key

```

### 4. Running the App

Start the development server:

```bash
npx expo start

```

* **Physical Device:** Scan the QR code using the **Expo Go** app (Android) or Camera (iOS).
* **Emulator:** Press `a` (Android) or `i` (iOS) in the terminal after the server starts.
