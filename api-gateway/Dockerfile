FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system gateway && adduser --system --ingroup gateway gateway
COPY --from=build /build/target/api-gateway-*.jar /app/api-gateway.jar
RUN chown -R gateway:gateway /app
USER gateway

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/api-gateway.jar"]
