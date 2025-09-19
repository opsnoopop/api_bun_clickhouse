// bun-clickhouse-server.ts
import { serve } from "bun";
import { createClient, ClickHouseClient } from "@clickhouse/client";

// ===== Env =====
const DB_HOST = process.env.DB_HOST || "container_clickhouse";
const DB_PORT = Number(process.env.DB_PORT || 8123);  // ClickHouse HTTP
const DB_USER = process.env.DB_USER || "testuser";
const DB_PASSWORD = process.env.DB_PASSWORD || "testpass";
const DB_NAME = process.env.DB_NAME || "testdb";

// ===== ClickHouse Client (HTTP) =====
const ch: ClickHouseClient = createClient({
  host: `http://${DB_HOST}:${DB_PORT}`,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  // คุณอาจใส่ settings เพิ่มได้ เช่น request_timeout, compression ฯลฯ
});

// ====== Helper ======
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isUUID(v: string): boolean {
  // ตรวจสอบรูปแบบ UUID v4/v5 เบื้องต้น
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// ====== HTTP Server ======
serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // GET /
    if (method === "GET" && path === "/") {
      return json({ message: "Hello World from Bun (ClickHouse)" });
    }

    // POST /users
    if (method === "POST" && path === "/users") {
      try {
        const body = await req.json().catch(() => ({}));
        const { username, email } = body as { username?: string; email?: string };

        if (!username || !email) {
          return json({ error: "username and email are required" }, 400);
        }

        // สร้าง UUID ฝั่งแอป (ClickHouse ไม่มี auto-increment insertId แบบ MySQL)
        const user_id = crypto.randomUUID();

        // Insert แบบ JSONEachRow
        await ch.insert({
          table: "users",
          values: [{ user_id, username, email }],
          format: "JSONEachRow",
        });

        return json(
          { message: "User created successfully", user_id },
          201
        );
      } catch (error: any) {
        return json({ error: "Database error", detail: String(error?.message || error) }, 500);
      }
    }

    // GET /users/:id (id เป็น UUID)
    if (method === "GET" && path.startsWith("/users/")) {
      const parts = path.split("/").filter(Boolean); // ["users", ":id"]
      const id = parts[1];

      if (!id || !isUUID(id)) {
        return json({ error: "Invalid user_id (must be UUID)" }, 400);
      }

      try {
        const rs = await ch.query({
          query: `
            SELECT
              user_id,
              username,
              email
            FROM users
            WHERE user_id = {id:UUID}
            LIMIT 1
          `,
          format: "JSONEachRow",
          query_params: { id },
        });

        const rows = await rs.json<{ user_id: string; username: string; email: string }[]>();

        if (!rows.length) {
          return json({ error: "User not found" }, 404);
        }

        const row = rows[0];
        return json({ user_id: row.user_id, username: row.username, email: row.email }, 200);
      } catch (error: any) {
        return json({ error: "Database error", detail: String(error?.message || error) }, 500);
      }
    }

    // Not Found
    return json({ error: "Not Found" }, 404);
  },
});
