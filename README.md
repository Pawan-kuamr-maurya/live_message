

# Live Message App

This is a real-time messaging application built with Node.js, Express, and Socket.io. It allows users to chat live with others, send messages, and manage a session-based chat system.

## Features
- **Real-time Messaging**: Uses Socket.io for real-time communication between users.
- **User Authentication**: Implemented user login and session management using Passport.js.
- **Database Integration**: Uses MongoDB to store messages and user data.
- **Scheduled Tasks**: Messages are cleared daily using `node-cron`.

## Technologies Used
- **Node.js**: Server-side JavaScript runtime.
- **Express**: Framework for building web applications.
- **Socket.io**: Enables real-time communication.
- **MongoDB**: NoSQL database to store user and message data.
- **Passport.js**: Handles user authentication with LocalStrategy.
- **EJS**: Templating engine for dynamic HTML rendering.
- **Node-Cron**: Task scheduling for clearing messages daily.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Pawan-kuamr-maurya/live_message.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   node app.js
   ```

Visit `http://localhost:3000` to start using the app.

## Contributing
Feel free to fork, improve, and submit a pull request. Contributions are welcome!

---
