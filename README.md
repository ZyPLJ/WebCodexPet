# WebCodexPet

OpenAI Codex 桌面宠物（Desktop Pet）的**网页预览**与**嵌入 SDK**资源包。

每个宠物是一套 chibi 精灵图动画，可在网页中拖拽互动、切换状态，也可一键嵌入任意业务页面。

## 功能

- **网页预览台**：本地挑选宠物、切换动画、调节速度/尺寸、桌面悬浮模式
- **Embed SDK**：零依赖脚本，把宠物挂到任意 HTML 页面
- **标准宠物包**：`pet.json` + `spritesheet.webp`（WebP 无损 + 透明）

## 仓库结构

```
WebCodexPet/
├── index.html / app.js / styles.css   # 网页预览台
├── embed/
│   ├── codex-pet.js                   # 嵌入 SDK（无依赖）
│   ├── example.html                   # 接入示例
│   └── README.md                      # SDK 详细文档
├── firefly/                           # 流萤
├── fufu-sticker/                      # 芙芙 Sticker
├── ganyu-pet-v2/                      # 甘雨
└── rich-paimon/                       # 财神派蒙
```

每个宠物包：

```
<pet-id>/
  pet.json          # 元数据（及可选动画 atlas）
  spritesheet.webp  # 1536×1872 精灵图
```

## 内置宠物

| ID | 显示名 | 说明 |
|---|---|---|
| `firefly` | 流萤 | 银白短发、翠绿眼眸的机甲风 chibi |
| `fufu-sticker` | 芙芙 Sticker | 白蓝短发、贴纸风 |
| `ganyu-pet-v2` | 甘雨 | 桌面小羊 |
| `rich-paimon` | 财神派蒙 | 来自 [codex-pet.org](https://codex-pet.org/zh/#gallery) 的财神派蒙 |

## 精灵图约定

所有宠物共用同一网格：

| 属性 | 值 |
|---|---|
| 尺寸 | 1536 × 1872 |
| 网格 | 8 列 × 9 行 |
| 单帧 | 192 × 208 |
| 格式 | WebP 无损 + Alpha |

| 行 | 状态 | 帧数 | 用途 |
|---|---|---|---|
| 0 | `idle` | 6 | 待机 / 呼吸眨眼 |
| 1 | `running-right` | 8 | 向右移动 |
| 2 | `running-left` | 8 | 向左移动 |
| 3 | `waving` | 4 | 打招呼 |
| 4 | `jumping` | 5 | 跳跃 / 悬浮 |
| 5 | `failed` | 8 | 失败 / 取消 |
| 6 | `waiting` | 6 | 等待确认 |
| 7 | `running` | 6 | 工作中 |
| 8 | `review` | 6 | 完成审视 |

## 本地预览

不要用 `file://` 直接打开（浏览器会拦截本地图片请求）。请起一个静态服务器：

```bash
# 在仓库根目录
python -m http.server 8765
```

然后打开：

- 预览台：http://localhost:8765/
- Embed 示例：http://localhost:8765/embed/example.html

## 嵌入任意网页

```html
<script src="/path/to/codex-pet.js"></script>
<script>
  CodexPet.mount('#el', {
    petJson: '/pets/firefly/pet.json',
    spritesheet: '/pets/firefly/spritesheet.webp',
    mode: 'fixed',
    position: 'bottom-right',
    scale: 1,
    state: 'idle',
  });
</script>
```

也支持声明式挂载：

```html
<div
  data-codex-pet
  data-pet-json="/pets/firefly/pet.json"
  data-spritesheet="/pets/firefly/spritesheet.webp"
  data-position="bottom-right"
></div>
<script src="/path/to/codex-pet.js"></script>
```

完整配置与实例 API 见 [embed/README.md](embed/README.md)。

跨域精灵图需要目标服务器开启 CORS；推荐同域托管资源。

## 新增宠物

1. 在仓库根目录新建文件夹，名称使用 kebab-case 英文 slug（如 `my-pet`）
2. 放入 `spritesheet.webp`（建议 1536×1872、WebP 无损 + 透明）
3. 编写 `pet.json`（`id` 与文件夹名一致），推荐包含完整 atlas（参考 `firefly/pet.json`）
4. 若要在预览台中出现，在 `app.js` 的 `PET_CATALOG` 中追加条目

## 许可与来源

- 预览台与 Embed SDK 采用 [MIT License](LICENSE)
- 部分宠物素材可能来自社区（如 `rich-paimon` 标注来源 [codex-pet.org](https://codex-pet.org/zh/#gallery)）；使用时请自行确认素材版权

## 相关

- 博客：[blog.pljzy.top](https://blog.pljzy.top/)
- 宠物资源站：[codex-pet.org 图鉴](https://codex-pet.org/zh/#gallery)
- OpenAI Codex 桌面宠物生态
