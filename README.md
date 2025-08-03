# JCIKL 会计系统

一个现代化的会计管理系统，基于 Next.js 和 Firebase 构建，提供完整的财务管理和报表功能。

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 pnpm
- Firebase 项目

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 启动开发服务器
```bash
npm run dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📊 主要功能

### 总账模块 (General Ledger)
- **高级筛选**: 支持日期、金额、状态、类别、账户多条件筛选
- **多格式导出**: 支持 CSV、Excel、PDF 格式导出
- **权限控制**: 基于用户角色的访问控制
- **实时统计**: 完整的账户和交易统计

### 其他模块
- 银行交易管理
- 日记账分录
- 试算平衡表
- 损益表
- 资产负债表
- 项目账户管理

## 🔧 技术栈

- **前端**: Next.js 15.2.4, React 19, TypeScript
- **UI**: Radix UI, Tailwind CSS
- **后端**: Firebase (Firestore, Authentication)
- **导出**: xlsx, jsPDF, html2canvas
- **测试**: Jest, React Testing Library

## 📋 功能特性

### ✅ 已实现功能
- [x] 用户认证和权限管理
- [x] 总账高级筛选和导出
- [x] 响应式用户界面
- [x] 实时数据同步
- [x] 多格式报表导出
- [x] 权限控制

### 🔄 开发中功能
- [ ] 筛选条件保存
- [ ] 导出历史记录
- [ ] 批量操作
- [ ] 数据可视化

## 📖 文档

- [总账模块功能文档](./docs/general-ledger-features.md)
- [总账模块功能总结](./docs/general-ledger-summary.md)
- [Firebase设置指南](./docs/firebase-setup-guide.md)
- [自定义认证指南](./docs/custom-auth-guide.md)
- [快速Firebase设置](./docs/quick-firebase-setup.md)

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并监听变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 🚀 部署

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请查看文档或联系开发团队。 