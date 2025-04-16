// main.ts - 反向代理到Hacker News，加上登录页面和重定向，使用环境变量

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const usersEnv = Deno.env.get("USERS");  // 获取环境变量，格式如 '{"admin":"password123"}'
const USERS = usersEnv ? JSON.parse(usersEnv) : {};  // 解析成对象，如果没设，就空对象

const TARGET_URL = "https://news.ycombinator.com";  // 目标URL

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/login") {
    if (req.method === "GET") {
      const goto = url.searchParams.get("goto") || "/";
      return new Response(`
        <html>
          <body>
            <h1>Login, you fucker</h1>
            <form method="POST" action="/login?goto=${encodeURIComponent(goto)}">
              <label>Username: <input type="text" name="username"></label><br>
              <label>Password: <input type="password" name="password"></label><br>
              <button type="submit">Login</button>
            </form>
          </body>
        </html>
      `, {
        status: 200,
        headers: { "Content-Type": "text/html" }
      });
    } else if (req.method === "POST") {
      const formData = await req.formData();
      const username = formData.get("username")?.toString() || "";
      const password = formData.get("password")?.toString() || "";
      const goto = url.searchParams.get("goto") || "/";

      if (USERS[username] === password) {  // 用从环境变量得来的USERS检查
        const headers = new Headers();
        headers.set("Set-Cookie", `session=authenticated; Path=/; HttpOnly; Max-Age=3600`);
        headers.set("Location", goto);
        return new Response("Logged in, asshole. Redirecting...", { status: 302, headers });
      } else {
        return new Response("Login failed, wrong credentials, shithead.", { status: 401 });
      }
    }
  }

  // 对于其他路径，先检查Cookie认证
  const sessionCookie = req.headers.get("Cookie")?.includes("session=authenticated");
  if (!sessionCookie) {
    return new Response("Not logged in, go to /login, bitch.", {
      status: 401,
      headers: { "Location": "/login?goto=" + encodeURIComponent(url.pathname + url.search) }
    });
  }

  try {
    const targetPath = url.pathname + url.search;
    const fullTargetUrl = `${TARGET_URL}${targetPath}`;

    const proxyReq = new Request(fullTargetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      redirect: "follow",
    });

    const response = await fetch(proxyReq);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Fuck, error in proxy:", error.message);
    return new Response(`Something went wrong, asshole. Error: ${error.message}. Check logs.`, { status: 500 });
  }
}

// 启动服务器
serve(handler, { port: 8080 });
console.log("Reverse proxy with login via env vars running on http://localhost:8080. Set your USERS env var, you bastard!");
