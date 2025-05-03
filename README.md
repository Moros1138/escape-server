[![Node.js CI](https://github.com/Moros1138/escape-server/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Moros1138/escape-server/actions/workflows/node.js.yml)

# Escape Server

This is the server that handles the scoreboard of
Aleksandar Sherbula's Escape the Machine!

The original server was developed in a joint effort
by Moros1138 and sigonasr2 as part of the OneLoneCoder
2024 CodeJam. It was tailored for that project and
has now been repurposed for Escape the Machine!

# Setup

**This has been built with NodeJS 20.x. The author makes no guarantees on other version os NodeJS.**

The ``.env.example`` contains an example environment configuration. rename it to ``.env`` and make changes appropriate to your environment.

**PORT** - This is the port express will listeon on - default: ``3000``

**SESSION_SECRET** - this variable is used to encrypt session data. It should be changed! - default: ``totally-a-secret``

``PUBLIC_DIRECTORY`` - this is the directory express will use to serve static files. - default: ``public``

**Note: It is useful to point this to the emscripten build directory of the Escape the Machine project!** 

```
npm install
```

The server creates 2 files, ``races.db`` and ``sessions.db`` they are sqlite3 databases that are responsible for persisting data should the server be shutdown for any reason.

# Deployment

It is expected that this server is used behind a SSL terminating reverse proxy, like nginx. **This project makes no attempt at all to support SSL directly!**

```
npm run start
```

# Development

```
npm run dev
```

# Testing

```
npm test
```
