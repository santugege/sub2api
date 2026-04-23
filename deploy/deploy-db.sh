#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

COMPOSE_FILE="docker-compose.db.yml"
ENV_FILE=".env.db"
ENV_EXAMPLE=".env.db.example"

info() {
    printf '[INFO] %s\n' "$1"
}

success() {
    printf '[SUCCESS] %s\n' "$1"
}

warning() {
    printf '[WARNING] %s\n' "$1"
}

fail() {
    printf '[ERROR] %s\n' "$1" >&2
    exit 1
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

compose() {
    docker compose "$@"
}

generate_secret() {
    if command_exists openssl; then
        openssl rand -hex 32
        return
    fi

    if [ -r /dev/urandom ] && command_exists od; then
        od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
        printf '\n'
        return
    fi

    fail "Cannot generate secrets. Install openssl or provide ${ENV_FILE} manually."
}

replace_env_value() {
    local key="$1"
    local value="$2"
    local escaped

    escaped="$(printf '%s' "$value" | sed 's/[\/&]/\\&/g')"
    if grep -q "^${key}=" "${ENV_FILE}"; then
        sed -i "s/^${key}=.*/${key}=${escaped}/" "${ENV_FILE}"
    else
        printf '%s=%s\n' "$key" "$value" >>"${ENV_FILE}"
    fi
}

get_env_value() {
    local key="$1"

    grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 | cut -d= -f2- || true
}

ensure_secret_value() {
    local key="$1"
    local value

    value="$(get_env_value "$key")"
    case "$value" in
        ""|change_this*)
            info "Generating ${key}"
            replace_env_value "$key" "$(generate_secret)"
            ;;
    esac
}

ensure_env_file() {
    if [ -f "${ENV_FILE}" ]; then
        info "Using existing ${ENV_FILE}"
    else
        [ -f "${ENV_EXAMPLE}" ] || fail "Missing ${ENV_EXAMPLE}"

        info "Creating ${ENV_FILE} from ${ENV_EXAMPLE}"
        cp "${ENV_EXAMPLE}" "${ENV_FILE}"
        chmod 600 "${ENV_FILE}" 2>/dev/null || true
    fi

    ensure_secret_value "POSTGRES_PASSWORD"
    ensure_secret_value "JWT_SECRET"
    ensure_secret_value "TOTP_ENCRYPTION_KEY"
}

check_requirements() {
    command_exists docker || fail "Docker is not installed or not in PATH."
    docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required. Install the Docker Compose plugin."
    [ -f "${COMPOSE_FILE}" ] || fail "Missing ${COMPOSE_FILE}"
}

main() {
    echo "=========================================="
    echo "  Sub2API Single-Server Docker Deploy"
    echo "=========================================="

    check_requirements
    ensure_env_file

    info "Creating persistent data directories"
    mkdir -p data postgres_data redis_data

    info "Validating Docker Compose configuration"
    compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config >/dev/null

    info "Building and starting services"
    compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build

    success "Deployment started"
    echo ""
    echo "Useful commands:"
    echo "  docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} ps"
    echo "  docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} logs -f sub2api"
    echo ""
    echo "Web UI:"
    echo "  http://localhost:$(grep -E '^SERVER_PORT=' "${ENV_FILE}" | cut -d= -f2- || printf '8080')"
    echo ""
    warning "Keep ${ENV_FILE} secure. It contains database and application secrets."
}

main "$@"
