# hackernews-proxy
<img width="1004" alt="image" src="https://github.com/user-attachments/assets/3ca1bba6-9cab-4af1-abcc-d214e005a9f3" />

1. `fork`本仓库
2. 来到 https://dash.deno.com ,选择`github-newproject`,选择`fork`的仓库
3. 填写内容：

| 属性                 | 填写值     |
| -------------------- | ---------- |
| **Framework Preset** | `Unknown`  |
| **Install Step**     |            |
| **Build Step**       |            |
| **Root directory**   | `/`        |
| **Include files**    | `/*` |
| **Exclude files**    | *.md       |
| **Entrypoint**       | `main.ts`  |
4. 新增变量`USERS`,内容自定义，按照这个格式：`{"admin":"password123"}`
5. deploy
