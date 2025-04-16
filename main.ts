// reverse_proxy_with_login.ts - 反向代理到Hacker News，但加了登录检查

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const TARGET_URL = "https://news.ycombinator.com";  // 目标URL
const USERS = {  // 硬编码用户，别用生产环境！
  "admin": "password123"  // 用户名: 密码。改成你自己的！
};

async function isAuthenticated(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;  // 没头，就滚

  const base64Credentials = authHeader.split(' ')[1];  // 假设是Basic Auth: "Basic <base64>"
  if (!base64Credentials) return false;

  const credentials = atob(base64Credentials);  // Deno有atob
  const [username, password] = credentials.split(':');

  return USERS[username] === password;  // 检查用户名和密码
}

async function handler(req: Request): Promise<Response> {
  if (!await isAuthenticated(req)) {
    return new Response("Login failed, you piece of shit. Use Basic Auth with correct credentials.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' }  // 提示客户端登录
    });
  }

  try {
    const url = new URL(req.url);
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
    console.error("Fuck, error in proxy:", error.message);  // 详细日志
    return new Response(`Something went wrong, asshole. Error: ${error.message}. Check logs.`, { status: 500 });
  }
}

// 启动服务器
serve(handler, { port: 8080 });
console.log("Reverse proxy with login running on http://localhost:8080. Try to access it, bitch!");
