[![Node.js CI](https://github.com/Moros1138/hamster-server/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Moros1138/hamster-server/actions/workflows/node.js.yml)

# Hamster Server

This is the server developed in a joint effort by Moros1138 and sigonasr2 as part of the OneLoneCoder 2024 CodeJam. It is tailored for that project and presented here for educational and mockery purposes!

# Setup

**This has been built with NodeJS 20.x. The author makes no guarantees on other version os NodeJS.**

The ``.env.example`` contains an example environment configuration. rename it to ``.env`` and make changes appropriate to your environment.

**PORT** - This is the port express will listeon on - default: ``3000``

**SESSION_SECRET** - this variable is used to encrypt session data. It should be changed! - default: ``totally-a-secret``

``PUBLIC_DIRECTORY`` - this is the directory express will use to serve static files. - default: ``public``

**Note: It is useful to point this to the emscripten build directory of the Hamster project!** 

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
