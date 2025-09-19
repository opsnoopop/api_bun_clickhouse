# Bun API with ClickHouse

A simple Bun API application and ClickHouse, containerized with Docker.


## Technology Stack

**Bun Container: FROM oven/bun:1**
- OS Alpine Linux 3.20.6
- Bun: 1.2.18
- ClickHouse2: 3.14.1 # bun add @clickhouse/client

**ClickHouse Container: FROM clickhouse:25.8**
- OS Ubuntu 22.04.5 LTS
- ClickHouse: 25.8

**Grafana/k6 Container: FROM grafana/k6:1.1.0**
- OS Alpine Linux: 3.22.0
- Grafana/k6: 1.1.0


## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/opsnoopop/api_bun_clickhouse.git
```

### 2. Navigate to Project Directory
```bash
cd api_bun_clickhouse
```

### 3. Start the Application
```bash
docker compose up -d --build
```

### 4. Create table users
```bash
docker exec -i container_clickhouse clickhouse-client -u testuser --password testpass --multiquery --query "
CREATE TABLE IF NOT EXISTS testdb.users (
  user_id UUID DEFAULT generateUUIDv4(),
  username  String,
  email     String,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree
ORDER BY user_id;"
```


## API Endpoints

### Health Check
```bash
curl -X GET http://localhost/
```

### Create user
```bash
curl -X POST http://localhost/users -H 'Content-Type: application/json' -d '{"username":"optest","email":"opsnoopop@hotmail.com"}'
```

### Get user
```bash
curl -X GET http://localhost/users/74bb5d3a-2266-4ca6-b92b-4cc3fbe9f2e4
```


## Test Performance by grafana/k6

### grafana/k6 test Health Check
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_1_ramping_health_check.js
```

### grafana/k6 test Insert Create user
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_2_ramping_create_user.js
```

### grafana/k6 test Select Get user by id
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_optest \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_3_ramping_get_user_by_id.js
```


## Test Performance by wrk

### wrk test Health Check
```bash
docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s http://172.16.0.11:3000
```

### wrk test Insert Create user
```bash
docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s -s /wrk/create_user.lua http://172.16.0.11:3000/users
```

### wrk test Select Get user by id
```bash
docker run \
--name container_wrk \
--rm \
-it \
--network global_optest \
-v ./wrk/:/wrk/ \
opsnoopop/ubuntu:24.04 \
wrk -c1000 -t2 -d10s http://172.16.0.11:3000/users/74bb5d3a-2266-4ca6-b92b-4cc3fbe9f2e4
```


## Stop the Application

### Truncate table users
```bash
docker exec -i container_clickhouse clickhouse-client -u testuser --password testpass --multiquery --query "
Truncate testdb.users;"
```

### Delete table users
```bash
docker exec -i container_clickhouse clickhouse-client -u testuser --password testpass --multiquery --query "
DELETE FROM testdb.users;"
```

### Stop the Application
```bash
docker compose down
```