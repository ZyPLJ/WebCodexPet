# CodexPet Embed SDK

把 Codex 桌面宠物嵌进**任意 HTML 网页**的轻量脚本。现有预览页（`index.html` / `app.js`）不受影响。

## 文件

| 文件 | 说明 |
|---|---|
| `codex-pet.js` | 唯一需要引入的 SDK（无依赖） |
| `example.html` | 三种接入方式的可运行示例 |
| `README.md` | 本文档 |

宠物资源仍使用仓库根目录下的包：

```
firefly/  fufu-sticker/  ganyu-pet-v2/  rich-paimon/
  pet.json
  spritesheet.webp
```

## 快速开始

### 1. 拷贝脚本

把 `embed/codex-pet.js` 放到你的站点静态目录，例如 `/static/codex-pet.js`。

### 2. 托管宠物包

任选其一：

- **整包目录**：`/pets/firefly/pet.json` + `/pets/firefly/spritesheet.webp`
- **仅图片 URL**：CDN 上的 `spritesheet.webp`（可选再给 `pet.json`）

### 3. 在任务页接入

**最简（data 属性）：**

```html
<div
  data-codex-pet
  data-pet-json="/pets/firefly/pet.json"
  data-spritesheet="/pets/firefly/spritesheet.webp"
  data-position="bottom-right"
  data-mode="fixed"
  data-scale="1"
></div>
<script src="/static/codex-pet.js"></script>
```

**可配置（JS API，适合后台下发参数）：**

```html
<div id="task-pet"></div>
<script src="/static/codex-pet.js"></script>
<script>
  const config = {
    // 两个独立路径
    petJson: "/pets/firefly/pet.json",
    spritesheet: "/pets/firefly/spritesheet.webp",
    // 远程也可以：
    // petJson: "https://cdn.example.com/pets/firefly/pet.json",
    // spritesheet: "https://cdn.example.com/pets/firefly/spritesheet.webp",
    state: "idle",
    scale: 1,
    speed: 100,
    mode: "fixed",
    position: "bottom-right",
    draggable: true,
    clickCycle: true,
  };

  window.taskPet = CodexPet.mount("#task-pet", config);
</script>
```

> 兼容旧写法：仍可只配 `src: "/pets/firefly/"`，会自动拼 `pet.json` 与 `spritesheet.webp`。

## 本地预览示例

在仓库根目录：

```bash
python -m http.server 8765
```

打开：http://localhost:8765/embed/example.html

## 配置项

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `petJson` | string \| object | `""` | **路径 1**：pet.json 的 URL/路径，或对象 |
| `spritesheet` | string | `""` | **路径 2**：雪碧图完整 URL/路径 |
| `src` | string | `""` | （兼容）目录 URL，自动拼上面两个文件 |
| `state` | string | `"idle"` | 初始动画 |
| `scale` | number | `1` | 显示倍率 |
| `speed` | number | `100` | 毫秒/帧 |
| `position` | string \| `{x,y}` | `"bottom-right"` | 角落名或像素坐标 |
| `mode` | string | `"fixed"` | `fixed` 浮整页 / `absolute` 容器内 / `inline` 文档流 |
| `draggable` | boolean | `true` | 拖拽 |
| `clickCycle` | boolean | `true` | 单击切动画 |
| `dragAnim` | boolean | `true` | 拖动时左右跑 |
| `releaseState` | string \| null | `"idle"` | 松手回落状态 |
| `zIndex` | number | `2147483000` | 层级 |
| `margin` | number | `16` | 角落边距 |
| `visible` | boolean | `true` | 显示 |
| `paused` | boolean | `false` | 暂停 |
| `flip` | boolean | `false` | 水平镜像 |
| `onReady` | fn | — | `(instance) => {}` |
| `onError` | fn | — | `(error, instance) => {}` |
| `onStateChange` | fn | — | `(state, instance) => {}` |

`data-*` 属性与上表一一对应（驼峰变短横线，如 `clickCycle` → `data-click-cycle`）。

## 实例 API

```js
pet.setState('waving')
pet.getState()
pet.listStates()
pet.nextState()
pet.setScale(1.2)
pet.setSpeed(80)
pet.pause() / pet.resume()
pet.show() / pet.hide()
pet.setPosition('bottom-left')  // 或 setPosition(x, y)
pet.getPosition()
pet.getMeta()
await pet.load({ src: '/pets/ganyu-pet-v2/' })
pet.destroy()
```

## 跨域注意

- 远程 `spritesheet` 必须允许 CORS（`Access-Control-Allow-Origin`），否则 canvas 无法裁切。
- 同域静态资源最省事。
- 不要用 `file://` 直接打开示例页。

## 与预览页的关系

| | 预览台 `index.html` | 嵌入 SDK `embed/codex-pet.js` |
|---|---|---|
| 用途 | 本地挑选 / 调试宠物 | 给任意业务页复用 |
| 依赖 | 本仓库目录结构 | 只依赖一个 js + 资源 URL |
| 是否改动 | 保持原样 | 新增，互不影响 |
