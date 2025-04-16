// main.ts - 反向代理到Hacker News，加上登录页面和重定向，使用环境变量

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const usersEnv = Deno.env.get("USERS");
const USERS = usersEnv ? JSON.parse(usersEnv) : {};  // 解析成对象，如果没设，就空对象

const TARGET_URL = "https://news.ycombinator.com";  // 目标URL

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/login") {
    if (req.method === "GET") {
      const goto = url.searchParams.get("goto") || "/";
      return new Response(`
<html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login to Proxy</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f3f4f6;  /* 轻灰背景，像Hugging Face */
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .login-container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);  /* 阴影效果 */
          width: 300px;
          text-align: center;
        }
        .avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;  /* 圆形头像 */
          margin-bottom: 1rem;
        }
        h1 {
          color: #1a202c;  /* 深灰标题 */
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        input[type="text"], input[type="password"] {
          width: 100%;
          padding: 0.5rem;
          margin: 0.5rem 0;
          border: 1px solid #cbd5e0;  /* 边框像输入框 */
          border-radius: 4px;
        }
        button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4299e1;  /* 蓝按钮 */
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover {
          background-color: #2b6cb0;  /* hover效果 */
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <img src="https://img20.360buyimg.com/openfeedback/jfs/t1/282817/18/20383/1934/67ff7de8Fc0b8b049/62aa800199f9ceb5.webp" alt="Avatar" class="avatar">  <!-- 这里是自定义头像 -->
        <h1>登录Hackerwnews</h1>  <!-- 保持点儿脏话风味 -->
        <form method="POST" action="/login?goto=${encodeURIComponent(goto)}">
          <label for="username">用户名：</label><br>
          <input type="text" id="username" name="username" required><br>
          <label for="password">密码：</label><br>
          <input type="password" id="password" name="password" required><br>
          <button type="submit">Login</button>
          <a>Power by deno.land & jxufe.icu</a>
        </form>
      </div>
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
        return new Response("Logged in. Redirecting...", { status: 302, headers });
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
    return new Response(`Something went wrong. Error: ${error.message}. Check logs.`, { status: 500 });
  }
}

// 启动服务器
serve(handler, { port: 8080 });
console.log("Reverse proxy with login via env vars running on http://localhost:8080. Set your USERS env var, you bastard!");
