#!/bin/bash

# Remove channel components
rm -rf src/components/channels
rm -rf src/components/channel-details

# Remove channel hook
rm -rf src/hooks/use-channels-connector

echo "Channels-related files have been removed." 