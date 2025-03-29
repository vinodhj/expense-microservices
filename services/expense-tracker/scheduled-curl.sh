#!/bin/bash

# Run the scheduled curl command
curl "http://localhost:8502/__scheduled?cron=0+*/6+*+*+*"