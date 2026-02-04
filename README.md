# Redis Lua Quota

This project demonstrates a Redis race condition and its fix using Lua scripts in a NestJS application.

It exposes two endpoints:
- One that is intentionally broken due to concurrent access
- One that is fixed using a Redis Lua script (atomic execution)

## Problem
A common quota implementation does the following:

1. Read a counter from Redis
2. Check if it is below a limit
3. Increment the counter

Under concurrent requests, multiple requests can pass the check before the increment happens, causing the counter to exceed the limit.

## Solution
Redis Lua scripts run atomically.

By moving the read, check, and increment logic into a single Lua script, Redis guarantees that no two requests can interleave and exceed the limit.
