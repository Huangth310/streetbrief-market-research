---
domain: nlp
tags:
  - market-research
  - retail
datasets:
models:
license: Apache License 2.0
---

# 街研

面向小额餐饮创业者的周边市场调研 MVP。输入一个经营位置和可选的目标品类，查看直接竞品、公开证据、客群场景、机会类型与经营建议。

## 本地运行

```bash
pnpm install
pnpm dev
```

默认地址：`http://localhost:4173`

当前为可部署的演示版本，不需要地图或大模型密钥。演示样本在报告中明确标记，不代表真实商户信息。

默认 `VITE_DEMO_MODE` 为空时使用内置演示数据。若要启用真实数据链路，在
`.env.local` 中设置 `VITE_DEMO_MODE=false`，并由服务端配置高德 Web 服务
密钥；Tavily 与兼容 OpenAI 协议的模型服务是可选项，未配置时会回退到规则
分析。实时接口失败或超过 75 秒时，页面会显示失败原因并提供“查看演示报告”
入口，不会在用户不知情时把演示样本冒充成实时结果。

## 在线部署

仓库已提供 `render.yaml`，推荐在 Render 上使用一个 Node Web Service 同时托管
前端和 `/api`。生产构建会读取 `.env.production`，强制关闭演示模式，并以同源
方式调用后端，因此不需要配置跨域或前端 API 地址。

1. 在高德开放平台创建“Web 服务”类型的 Key。本项目不调用高德 JS API。
2. 点击下方按钮，授权 Render 读取本仓库并创建服务。
3. 在 Render 的 Environment 中填写 `AMAP_WEB_SERVICE_KEY`。模型与搜索服务可选；
   未配置模型时会使用确定性规则分析，未配置 Tavily 时仍会使用高德 POI 数据。
4. 部署完成后访问 `/api/health`，确认 `services.amap` 和 `ready` 均为 `true`。
5. 用非珠海地址发起一次调研，确认报告标记为“实时分析”而非“演示缓存”。

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Huangth310/streetbrief-market-research)

高德密钥、模型密钥和搜索密钥只能填在服务端环境变量中，不能写入任何
`VITE_` 变量。免费实例长时间无访问后会休眠，黑客松正式展示前建议提前访问
一次，或升级为常驻实例。项目也包含 `Dockerfile`，可部署到 Railway、Zeabur
或其他支持容器或 Node.js 的平台。

## 当前能力

- 指定品类与开放品类两个入口；
- 最近位置历史，可选择或删除单条记录；
- 2D 地图、直接竞品标记与列表联动，支持按钮缩放和动态范围圈；
- 竞品距离、资料完整度筛选；
- 证据抽屉与事实/推断标签；
- 五级开店潜力、经营策略与具体观察指标；
- 一页摘要与浏览器打印；
- 桌面与移动端响应式布局。

## 后续接入

服务端真实数据链路位于 `server/`，前端通过 `POST /api/analyze` 消费同一份
`Report` 数据契约。接入新数据源时，必须继续保留证据编号、采集时间、数据
模式和事实/代理/推断/建议分层。

## 质量检查

```bash
pnpm test
pnpm build
```

测试会检查指定品类不被切换、低覆盖样本不生成价格、事实/推断分层，以及
报告中的所有证据引用都能在证据台账中找到。
