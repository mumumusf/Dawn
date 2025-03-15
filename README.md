# DAWN验证器自动化工具

<div align="center">

[中文](README.md) | [English](README_EN.md)
  
![DAWN验证器](https://raw.githubusercontent.com/mumumusf/Dawn/main/assets/logo.png)

**自动化DAWN验证器账户保活，轻松赚取积分**

</div>

## 📝 项目介绍

DAWN验证器自动化工具是一个帮助用户自动完成DAWN验证器日常任务的脚本，通过自动化操作保持账户活跃并赚取积分。该工具支持多账户管理、代理配置以及多种验证码服务，让您的DAWN验证器体验更加便捷。

## ✨ 主要功能

- 🔄 自动保活账户
- 💰 自动赚取积分
- 👥 支持多账户管理
- 🔒 支持多种验证码服务（2Captcha、AntiCaptcha、手动模式）
- 🌐 支持代理配置
- 📊 详细的运行日志和状态报告

## 🚀 新手使用教程

### 1️⃣ 注册DAWN验证器账号

1. 访问Chrome网上应用店下载[DAWN验证器Chrome扩展](https://chromewebstore.google.com/detail/dawn-validator-chrome-ext/fpdkjdnhkakefebpekbdhillbhonfjjp)
2. 安装扩展后，使用您的邮箱注册账号
3. 注册时填写邀请码: `yzl8wkwl`（使用邀请码可获得额外奖励）

### 2️⃣ 注册验证码服务

为了自动解决验证码，您需要注册一个验证码服务：

1. 访问[2Captcha官网](https://2captcha.com/enterpage)注册账号
2. 注册完成后充值并获取API密钥（用于自动解决验证码）

### 3️⃣ 安装Node.js环境

#### Windows用户:

1. 访问[Node.js官网](https://nodejs.org/)下载并安装最新的LTS版本

#### Linux/Mac用户:

1. 安装NVM (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

2. 根据您的Shell环境，运行以下命令之一:
```bash
source ~/.bashrc   # 如果使用 bash
source ~/.zshrc    # 如果使用 zsh
```

3. 安装Node.js 22
```bash
nvm install 22
nvm list
```

4. 设置Node.js 22为默认版本
```bash
nvm use 22
nvm alias default 22
```

5. 验证安装
```bash
node -v   # 预期输出: v22.13.1
nvm current # 预期输出: v22.13.1
npm -v    # 预期输出: 10.9.2
```

### 4️⃣ 下载并配置DAWN验证器自动化工具

1. 克隆项目仓库
```bash
git clone https://github.com/mumumusf/Dawn.git
cd Dawn
```

2. 安装依赖
```bash
npm install
```

3. 配置账号信息
   - 创建`accounts.txt`文件，按照以下格式添加您的账号信息:
   ```
   邮箱----密码----代理地址
   ```
   - 示例:
   ```
   example@gmail.com----yourpassword----127.0.0.1:8080:username:password
   ```
   - 如果不使用代理，可以留空代理部分:
   ```
   example@gmail.com----yourpassword----
   ```

### 5️⃣ 运行程序

```bash
node .
```

首次运行时，程序会提示您配置验证码服务:
1. 选择验证码服务类型 (2captcha, antiCaptcha, manual)
2. 输入对应的API密钥
3. 选择运行模式 (单账号手动输入或文本文件配置)

### 6️⃣ 使用Screen会话管理（推荐）

在服务器或VPS上运行时，建议使用Screen会话管理工具，使程序在后台持续运行，即使关闭SSH连接也不会中断。

#### 安装Screen

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install screen

# CentOS/RHEL
sudo yum install screen
```

#### 创建新的Screen会话

```bash
# 创建一个名为"dawn"的新会话
screen -S dawn
```

#### 在Screen会话中运行程序

```bash
cd Dawn  # 进入项目目录
node .   # 运行程序
```

#### 分离Screen会话

运行程序后，按下组合键 `Ctrl+A` 然后按 `D`，即可分离会话并保持程序在后台运行。

#### 重新连接Screen会话

```bash
# 列出所有会话
screen -ls

# 重新连接到名为"dawn"的会话
screen -r dawn
```

#### 终止Screen会话

```bash
# 在会话中输入exit或按Ctrl+D
exit

# 或从外部终止会话
screen -X -S dawn quit
```

## 📋 配置说明

### 验证码服务配置

程序支持三种验证码解决方案:
- **2Captcha**: 付费服务，自动解决验证码
- **AntiCaptcha**: 付费服务，自动解决验证码
- **手动模式**: 通过控制台或Telegram手动输入验证码

### 账号配置格式

在`accounts.txt`文件中，每行一个账号，格式为:
```
邮箱----密码----代理地址
```

### 代理配置格式

代理格式为:
```
IP:端口:用户名:密码
```
或
```
IP:端口
```

## 🔧 常见问题

1. **验证码服务无法工作?**
   - 检查API密钥是否正确
   - 确保账户余额充足

2. **代理连接失败?**
   - 检查代理格式是否正确
   - 确认代理是否可用

3. **登录失败?**
   - 检查账号密码是否正确
   - 确认账号是否被封禁

## 📞 联系方式

如有任何问题或建议，欢迎通过以下方式联系作者:

- Twitter：[@YOYOMYOYOA](https://x.com/YOYOMYOYOA)
- Telegram：[@YOYOZKS](https://t.me/YOYOZKS)

## ⚖️ 免责声明

1. 本程序仅供学习交流使用
2. 禁止用于商业用途
3. 使用本程序产生的任何后果由用户自行承担

---
Made with ❤️ by [@YOYOMYOYOA](https://x.com/YOYOMYOYOA)