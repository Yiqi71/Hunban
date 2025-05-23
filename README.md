# 魂蛋小原交互界面

## 技术选型

- **HTML / CSS / JavaScript**：搭建页面结构与基本交互。
- **Three.js**：实现3D模型加载、渲染、动画控制。
- **GLTFLoader**：加载 `.glb` 格式的3D模型资源。
- **音频播放**：通过浏览器 `Audio` API 播放互动音效。


## 目录结构

```
/assets/
  /fonts/
    AlibabaSans-Regular.otf         # 页面字体
  hunban-body.glb                   # 身体模型
  hunban-head.glb                   # 头部模型
  default.png                       # 默认表情贴图
  wink.png                          # 眨眼表情
  smile.png                         # 微笑表情
  laugh.png                         # 笑脸表情
  logo-yellow.png                   # 页面logo
  giggling-6799.mp3                 # 挠痒时播放的笑声
  buttonBG.png                       # 按钮背景图片

index.html                          # 主页面结构
style.css                           # 页面样式文件
main.js                             # 页面功能逻辑
```

## 启动方式

项目已部署在 Vercel，直接访问体验
👉 [https://hunban.vercel.app/](https://hunban.vercel.app/)

## 已实现要点

- **基础交互**：
  - 点击按钮触发角色动作（打招呼、开心、伤心、思考、跳跃）。
  - 按住屏幕可控制头部朝向鼠标位置。
  - 点击角色身体或头部并长按，触发“挠痒痒”特效与笑声。

- **自然动画**：
  - 身体随时间有自然呼吸动作。
  - 角色自动眨眼，模拟自然行为。
  - 动作间有归零过渡，避免突变。

- **视觉体验**：
  - 表情切换与缩放动画丰富情绪表达。
  - 移动端适配，鼠标和手指都能进行交互，按钮和字体根据屏幕大小调整。
  - 鼠标或手指按住空白区域时，激活光标闪烁动画，提升交互感知。


- **性能优化**：
  - 动画过渡使用平滑插值（smoothStep）。
  - 资源加载统一通过 Three.js 和浏览器API管理。
  - 使用 requestAnimationFrame 进行高效动画刷新。


## 未实现或可改进之处

- **资源加载优化**：
  - 目前没有预加载提示或loading界面，初次打开时可能资源加载稍慢。

- **动画扩展**：
  - 当前表情与动作数量有限，未来可增加更多细致动作和表情变化。欢呼跳跃的动画还需改进。

- **模块封装**：
  - 后续可以进一步将各功能封装成类或模块，提升代码可维护性与复用性。

### 音效来源：Pixabay 音效库
