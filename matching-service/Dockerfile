# --- Build stage -----------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Cache les dependances separement du code source
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B package -DskipTests

# --- Runtime stage -----------------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Le endpoint /actuator/health (200, sans auth) est sonde par le healthcheck
# defini au niveau docker-compose (cf. docs/INTEGRATION.md §10). curl est
# installe ici pour cela : eclipse-temurin:21-jre n'embarque aucun client
# HTTP par defaut. Installe avant le passage a l'utilisateur non privilegie ;
# limite a curl (pas de wget en plus) pour rester minimal.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --create-home --shell /usr/sbin/nologin matching
COPY --from=build /build/target/matching-service-*.jar /app/matching-service.jar
USER matching

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app/matching-service.jar"]
