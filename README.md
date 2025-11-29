# Fixed Juice Shop

## ⚠️ Important Disclaimer

**This project is based on the OWASP Juice Shop source code and has been patched for security vulnerabilities to meet assignment requirements.**

Since known vulnerabilities have been fixed, some features originally designed to demonstrate vulnerabilities may no longer function, resulting in behavior different from the original version.

## Prerequisites

Please ensure your system has the following software installed:

- **Node.js**: Version 20.x - 24.x (Node.js 20 LTS is recommended)
- **npm**: Usually installed with Node.js

## How to Build

Run the following command in the project root directory to install dependencies and build the project:

```bash
npm install
```

This command automatically executes the `postinstall` script, which includes:
1. Installing frontend dependencies
2. Building the frontend (`npm run build:frontend`)
3. Building the backend server (`npm run build:server`)

## How to Run

After building, run the following command to start the server:

```bash
npm start
```

Once the server is running, open your browser and visit:

[http://localhost:3000](http://localhost:3000)
