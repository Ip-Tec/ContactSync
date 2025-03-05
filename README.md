# ContactSync

## Overview

ContactSync is a lightweight mobile and web application designed to help small businesses easily manage and synchronize their contacts. With a straightforward interface and efficient contact management, ContactSync aims to simplify your workflow.

## Features

- **Mobile:** Sync contacts directly from your device
- **Web:** Efficiently manage and view contact lists
- User-friendly interface for both platforms

## Getting Started

1. **Clone the repository.**
2. **Install dependencies.**
3. **Set up your Supabase backend:**
   - Create a project on [Supabase](https://supabase.com/).
   - Configure your database and generate your API keys.
   - Add the Supabase keys to your environment variables in the `.env` file.
4. **Run the app on your desired platform.**

## Tech Stack

- **Frontend:** React (Web), React Native (Expo) for Mobile
- **Backend:** [Supabase](https://supabase.com/) for database, authentication, and real-time data synchronization

## Contributing

Feel free to fork this repository and submit pull requests. All contributions are welcome!

---

## Project Structure

This project contains two main applications: a web application built with React and a mobile application built with Expo (React Native).

### React (Web) App

#### Web App Folder Structure

``` text
ContactSync/
└── web-app/
    ├── public/                     # Static assets
    │   ├── images/
    │   ├── favicon.ico
    │   └── index.html
    ├── src/                        # Main source code
    │   ├── assets/                 # Static files (images, fonts, etc.)
    │   ├── components/             # Reusable UI components
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   └── ...
    │   ├── pages/                  # Page components (routes)
    │   │   ├── Home.jsx
    │   │   ├── About.jsx
    │   │   ├── Profile.jsx
    │   │   ├── Settings.jsx
    │   │   └── ...
    │   ├── context/                # Context API for global state
    │   ├── hooks/                  # Custom hooks
    │   ├── services/               # API calls (e.g., Axios)
    │   ├── styles/                 # CSS or Tailwind
    │   │   ├── global.css
    │   │   ├── theme.js
    │   │   └── ...
    │   ├── App.jsx                 # Main component
    │   ├── main.jsx                # Entry point
    │   └── router.jsx              # React Router configuration
    ├── .env                        # Environment variables
    ├── .gitignore
    ├── package.json
    ├── vite.config.js
    └── README.md
```

### Mobile App (React Native + Expo)

#### Mobile App Folder Structure

``` text
ContactSync/
└── mobile-app/
    ├── assets/                   # Images, fonts, etc.
    ├── src/                      # Main source
    │   ├── components/           # Reusable UI components
    │   │   ├── Button.js
    │   │   ├── Card.js
    │   │   ├── Header.js
    │   │   ├── Footer.js
    │   │   └── ...
    │   ├── screens/              # Pages (screens)
    │   │   ├── HomeScreen.js
    │   │   ├── ProfileScreen.js
    │   │   ├── SettingsScreen.js
    │   │   └── ...
    │   ├── navigation/           # React Navigation config
    │   │   ├── StackNavigator.js
    │   │   ├── TabNavigator.js
    │   │   └── ...
    │   ├── context/              # Context API for global state
    │   ├── hooks/                # Custom hooks
    │   ├── services/             # API calls
    │   ├── styles/               # Global styles
    │   │   ├── theme.js
    │   │   ├── colors.js
    │   │   └── ...
    │   ├── App.js                # Main App entry
    │   └── index.js              # Entry point
    ├── .env                      # Environment variables
    ├── .gitignore
    ├── app.json                  # Expo config
    ├── package.json
    └── README.md
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
