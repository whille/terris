# 技术上下文

## 技术栈

### 前端技术
- **HTML5**: 语义化标记，Canvas API
- **CSS3**: 现代样式，Flexbox/Grid布局，动画
- **JavaScript (ES6+)**: 原生JavaScript，现代语法特性

### 开发工具
- **代码编辑器**: 任何支持Web开发的编辑器
- **浏览器**: Chrome、Firefox、Safari、Edge（现代版本）
- **调试工具**: 浏览器开发者工具

## 技术要求

### 浏览器兼容性
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### JavaScript特性使用
- ES6 Classes
- Arrow Functions
- Template Literals
- Destructuring Assignment
- Modules (如果需要)

### Canvas API使用
- 2D渲染上下文
- 路径绘制
- 填充和描边
- 变换操作

## 性能考虑

### 渲染优化
- 使用requestAnimationFrame
- 只在需要时重绘canvas
- 避免不必要的DOM操作

### 内存管理
- 及时清理事件监听器
- 避免内存泄漏
- 合理使用对象池模式

### 响应式设计
- CSS媒体查询
- 可缩放的Canvas
- 触摸设备支持

## 部署要求

### 静态资源
- 所有资源为静态文件
- 无需服务器端处理
- 支持CDN部署

### 文件大小
- 总体积控制在500KB以内
- 优化图片和音频资源
- 代码压缩和混淆

## 开发约束

### 无外部依赖
- 不使用jQuery、React等框架
- 不依赖外部CSS框架
- 纯原生Web技术实现

### 代码质量
- 遵循JavaScript最佳实践
- 使用一致的代码风格
- 添加必要的注释和文档
