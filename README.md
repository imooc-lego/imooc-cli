# 慕课网前端统一研发脚手架

## About

慕课网前端架构师课程专属脚手架

## Getting Started

### 安装：

```bash
npm install -g @imooc-cli/core
```

### 创建项目

项目/组件初始化

```bash
imooc-cli init 
```

强制清空当前文件夹

```bash
imooc-cli init --force
```

### 发布项目

发布项目/组件

```bash
imooc-cli publish
```

强制更新所有缓存

```bash
imooc-cli publish --force
```

正式发布

```bash
imooc-cli publish --prod
```

手动指定build命令

```bash
imooc-cli publish --buildCmd "npm run build:test"
```


## More

清空本地缓存：

```bash
imooc-cli clean
```

DEBUG 模式：

```bash
imooc-cli --debug
```

调试本地包：

```bash
imooc-cli init --packagePath /Users/sam/Desktop/imooc-cli/packages/init/
```
