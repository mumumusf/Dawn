# DAWN Validator Automation Tool

<div align="center">

[中文](README.md) | [English](README_EN.md)
  
![DAWN Validator](https://raw.githubusercontent.com/mumumusf/Dawn/main/assets/logo.png)

**Automate DAWN Validator account maintenance and easily earn points**

</div>

## 📝 Project Introduction

The DAWN Validator Automation Tool is a script that helps users automatically complete daily tasks for the DAWN Validator, keeping accounts active and earning points through automated operations. This tool supports multi-account management, proxy configuration, and various CAPTCHA services, making your DAWN Validator experience more convenient.

## ✨ Main Features

- 🔄 Automatic account maintenance
- 💰 Automatic point earning
- 👥 Multi-account management support
- 🔒 Support for multiple CAPTCHA services (2Captcha, AntiCaptcha, manual mode)
- 🌐 Proxy configuration support
- 📊 Detailed operation logs and status reports

## 🚀 Beginner's Guide

### 1️⃣ Register a DAWN Validator Account

1. Visit the Chrome Web Store to download the [DAWN Validator Chrome Extension](https://chromewebstore.google.com/detail/dawn-validator-chrome-ext/fpdkjdnhkakefebpekbdhillbhonfjjp)
2. After installing the extension, register an account using your email
3. Enter the invitation code: `yzl8wkwl` during registration (using an invitation code provides additional rewards)

### 2️⃣ Register for a CAPTCHA Service

To automatically solve CAPTCHAs, you need to register for a CAPTCHA service:

1. Visit the [2Captcha official website](https://2captcha.com/enterpage) to register an account
2. After registration, deposit funds and obtain an API key (used for automatic CAPTCHA solving)

### 3️⃣ Install Node.js Environment

#### Windows Users:

1. Visit the [Node.js official website](https://nodejs.org/) to download and install the latest LTS version

#### Linux/Mac Users:

1. Install NVM (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

2. Run one of the following commands based on your shell environment:
```bash
source ~/.bashrc   # If using bash
source ~/.zshrc    # If using zsh
```

3. Install Node.js 22
```bash
nvm install 22
nvm list
```

4. Set Node.js 22 as the default version
```bash
nvm use 22
nvm alias default 22
```

5. Verify the installation
```bash
node -v   # Expected output: v22.13.1
nvm current # Expected output: v22.13.1
npm -v    # Expected output: 10.9.2
```

### 4️⃣ Download and Configure the DAWN Validator Automation Tool

1. Clone the repository
```bash
git clone https://github.com/mumumusf/Dawn.git
cd Dawn
```

2. Install dependencies
```bash
npm install
```

3. Configure account information
   - Create an `accounts.txt` file and add your account information in the following format:
   ```
   email----password----proxy_address
   ```
   - Example:
   ```
   example@gmail.com----yourpassword----127.0.0.1:8080:username:password
   ```
   - If you're not using a proxy, you can leave the proxy part empty:
   ```
   example@gmail.com----yourpassword----
   ```

### 5️⃣ Run the Program

```bash
node .
```

When running for the first time, the program will prompt you to configure the CAPTCHA service:
1. Select the CAPTCHA service type (2captcha, antiCaptcha, manual)
2. Enter the corresponding API key
3. Choose the running mode (single account manual input or text file configuration)

### 6️⃣ Using Screen Session Management (Recommended)

When running on a server or VPS, it's recommended to use the Screen session management tool to keep the program running in the background, even if the SSH connection is closed.

#### Install Screen

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install screen

# CentOS/RHEL
sudo yum install screen
```

#### Create a New Screen Session

```bash
# Create a new session named "dawn"
screen -S dawn
```

#### Run the Program in the Screen Session

```bash
cd Dawn  # Enter the project directory
node .   # Run the program
```

#### Detach from the Screen Session

After running the program, press the key combination `Ctrl+A` and then press `D` to detach from the session and keep the program running in the background.

#### Reconnect to the Screen Session

```bash
# List all sessions
screen -ls

# Reconnect to the session named "dawn"
screen -r dawn
```

#### Terminate the Screen Session

```bash
# Type exit or press Ctrl+D in the session
exit

# Or terminate the session from outside
screen -X -S dawn quit
```

## 📋 Configuration Instructions

### CAPTCHA Service Configuration

The program supports three CAPTCHA solving solutions:
- **2Captcha**: Paid service, automatically solves CAPTCHAs
- **AntiCaptcha**: Paid service, automatically solves CAPTCHAs
- **Manual Mode**: Manually input CAPTCHAs via console or Telegram

### Account Configuration Format

In the `accounts.txt` file, one account per line, in the format:
```
email----password----proxy_address
```

### Proxy Configuration Format

The proxy format is:
```
IP:port:username:password
```
or
```
IP:port
```

## 🔧 Common Issues

1. **CAPTCHA service not working?**
   - Check if the API key is correct
   - Ensure the account has sufficient balance

2. **Proxy connection failed?**
   - Check if the proxy format is correct
   - Confirm if the proxy is available

3. **Login failed?**
   - Check if the account and password are correct
   - Confirm if the account has been banned

## 📞 Contact Information

If you have any questions or suggestions, please contact the author through:

- Twitter: [@YOYOMYOYOA](https://x.com/YOYOMYOYOA)
- Telegram: [@YOYOZKS](https://t.me/YOYOZKS)

## ⚖️ Disclaimer

1. This program is for learning and communication purposes only
2. Commercial use is prohibited
3. Users bear all consequences resulting from the use of this program

---
Made with ❤️ by [@YOYOMYOYOA](https://x.com/YOYOMYOYOA) 