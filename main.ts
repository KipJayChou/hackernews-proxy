// reverse_proxy.ts - 一个简单的Deno反向代理到Hacker News

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";  // 标准库导入
const TARGET_URL = "https://news.ycombinator.com";  // Hacker News的主页

async function handler(req: Request): Promise<Response> {
  try {
    // 构建请求：保持原样转发URL，但改成目标服务器
    const url = new URL(req.url);
    const targetPath = url.pathname + url.search;  // 保留路径和查询参数
    const fullTargetUrl = `${TARGET_URL}${targetPath}`;  // 组合成完整URL

    // 转发请求到Hacker News
    const proxyReq = new Request(fullTargetUrl, {
      method: req.method,
      headers: req.headers,  // 复制头信息
      body: req.body,  // 复制请求体
      redirect: "follow",
    });

    // 发送请求并获取响应
    const response = await fetch(proxyReq);
    
    // 返回响应给客户端
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,  // 复制头信息回来
    });
  } catch (error) {
    console.error("Fuck, error in proxy:", error);  // 错误日志
    return new Response("Something went wrong, asshole. Check logs.", { status: 500 });
  }
}

// 启动服务器
serve(handler, { port: 8080 });  // 监听8080端口
console.log("Reverse proxy running on http://localhost:8080. Go fuck around!");
