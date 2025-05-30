#!/bin/bash

# Kill any existing func processes
pkill -f "func start"
sleep 2

# Use Node.js v20
source ~/.nvm/nvm.sh
nvm use v20.18.1

# Start Azure Functions
cd "$(dirname "$0")/../.."
func start