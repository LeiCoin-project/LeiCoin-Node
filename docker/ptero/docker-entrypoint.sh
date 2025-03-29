#!/bin/bash

function check_cpu_arch {
    local arch=$(uname -m)
    if [ "$arch" = "x86_64" ]; then
        declare -g ARCH="linux-x64"
    elif [ "$arch" = "aarch64" ]; then
        declare -g ARCH="linux-arm64"
    else
        echo "Unsupported architecture: $arch"
        exit 1
    fi
}

function extract_env_bool {
    local var_name=$1
    if [[ "${!var_name}" == "1" ]]; then
        eval "$var_name=true"
    else
        eval "$var_name=false"
    fi
}

function get_latest_version {
    local include_prereleases=$1
    local api_url="https://api.github.com/repos/LeiCoin-project/LeiCoin-Node/releases"

    # Fetch releases from GitHub API
    local releases_json=$(curl -s "$api_url")

    if [ "$include_prereleases" == "true" ]; then
        # Include prereleases
        echo "$releases_json" | jq -r '.[0].tag_name'
    else
        # Exclude prereleases, find the first stable release
        echo "$releases_json" | jq -r '[.[] | select(.prerelease == false)][0].tag_name'
    fi
}

function get_current_version {
    local version=$(./leicoin-node --version 2>/dev/null)
    echo $version | cut -d ' ' -f 2
}

function download_binary {
    local version=$1
    local arch=$2
    local url="https://github.com/LeiCoin-project/LeiCoin-Node/releases/download/${version}/leicoin-node-${version}-${arch}"

    echo "Downloading LeiCoin-Node version $version for architecture $arch..."

    http_response_code="$(curl --write-out '%{http_code}' -sL -o leicoin-node "$url")"

    if [ "$http_response_code" != "200" ]; then
        echo "Failed to download LeiCoin-Node binary. HTTP response code: $http_response_code"
        exit 1
    fi

    chmod +x leicoin-node

    echo "LeiCoin-Node $version downloaded successfully."
}

function main {

    echo "Starting..."

    cd /home/container

    check_cpu_arch

    # Extract Startup CMD
    STARTUP_CMD=$(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')
    extract_env_bool EXPERIMENTAL
    
    LOCAL_VERSION=$(get_current_version)

    if [ "$VERSION" == "latest" ]; then
        
        REMOTE_VERSION=$(get_latest_version $EXPERIMENTAL)

        if [ "$REMOTE_VERSION" != "v$LOCAL_VERSION" ]; then
            echo "New version available: $REMOTE_VERSION. Downloading..."
            download_binary $REMOTE_VERSION $ARCH
        else
            echo "The latest version is already installed. Continuing..."
        fi
    else
        
        if [[ "v$VERSION" != "v$LOCAL_VERSION" ]]; then
            echo "Requested version $VERSION is not installed. Downloading..."
            download_binary v$VERSION $ARCH
        else
            echo "Requested version $VERSION is already installed. Continuing..."
        fi        

    fi

    # echo -e ":/home/container$ ./leicoin-node run --port=${SERVER_PORT} $AF"
    eval ${STARTUP_CMD}
}

main
