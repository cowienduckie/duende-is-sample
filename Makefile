SHELL := /bin/bash

.PHONY: seed authserver webclient run-all

seed:
	dotnet run --project src/AuthServer/AuthServer.csproj -- /seed

authserver:
	dotnet run --project src/AuthServer/AuthServer.csproj

webclient:
	cd src/WebClient && npm run dev

run-all:
	@echo "Starting AuthServer and WebClient..."
	@(dotnet run --project src/AuthServer/AuthServer.csproj & \
	AUTH_PID=$$!; \
	cd src/WebClient; npm run dev & \
	WEB_PID=$$!; \
	trap 'kill $$AUTH_PID $$WEB_PID 2>/dev/null || true' INT TERM EXIT; \
	wait $$AUTH_PID $$WEB_PID)
