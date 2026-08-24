# --- Build stage -----------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Cache dependencies separately from source for faster rebuilds.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package

# --- Runtime stage -----------------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# curl is needed by the docker-compose healthcheck (GET /actuator/health) --
# eclipse-temurin:21-jre doesn't ship an HTTP client. Installed before
# switching to the unprivileged user; kept to just curl (no wget) to stay
# minimal.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system gateway && adduser --system --ingroup gateway gateway
COPY --from=build /build/target/api-gateway-*.jar /app/api-gateway.jar
RUN chown -R gateway:gateway /app
USER gateway

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/api-gateway.jar"]
