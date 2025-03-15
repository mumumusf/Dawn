/**
 * Dawn验证器自动化工具 - 主入口文件
 * 作者: 小林
 * 功能: 自动化Dawn验证器账户保活，赚取积分
 */
const dawnValidator = require("./yoyom/dawnbot");
const chalk = require("chalk");
const { getRandomProxy, loadProxies } = require("./yoyom/proxy");
const fs = require("fs");
const { logMessage } = require("./yoyo/logger");
const readline = require("readline");
const path = require("path");
const displayBanner = require("./yoyo/banner");

/**
 * 检查并创建配置文件
 */
function checkAndCreateConfig() {
  const configPath = path.join(__dirname, "../config.js");
  
  // 检查配置文件是否存在
  if (!fs.existsSync(configPath)) {
    logMessage(null, null, "配置文件不存在，正在创建默认配置...", "info");
    
    // 创建默认配置
    const defaultConfig = {
      captchaServices: {
        captchaUsing: "manual", // 默认使用手动模式
        captcha2Apikey: [""],   // 空API密钥
        antiCaptcha: [""],      // 空API密钥
      },
      telegramConfig: {
        botToken: "",
        chatId: "",
      },
    };
    
    // 写入配置文件
    fs.writeFileSync(configPath, `/**
 * Dawn验证器自动化工具 - 配置文件
 * 作者: 小林
 * 功能: 配置验证码服务和Telegram机器人
 */
module.exports = ${JSON.stringify(defaultConfig, null, 2)};`);
    
    logMessage(null, null, "已创建默认配置文件", "success");
    return defaultConfig;
  }
  
  // 如果配置文件存在，尝试加载它
  try {
    return require("../config");
  } catch (error) {
    logMessage(null, null, `加载配置文件失败: ${error.message}，将使用默认配置`, "error");
    return {
      captchaServices: {
        captchaUsing: "manual",
        captcha2Apikey: [""],
        antiCaptcha: [""],
      },
      telegramConfig: {
        botToken: "",
        chatId: "",
      },
    };
  }
}

// 初始化配置
const config = checkAndCreateConfig();

// 导出配置对象，以便其他模块可以使用
module.exports.config = config;

/**
 * 从控制台获取用户输入
 * @param {String} question - 提示问题
 * @returns {Promise<String>} - 用户输入的内容
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * 配置验证码服务
 * @returns {Promise<void>}
 */
async function configureCaptchaService() {
  logMessage(null, null, "验证码服务配置", "process");
  
  const captchaService = await askQuestion("请选择验证码服务 (1: 2captcha, 2: antiCaptcha, 3: manual): ");
  
  let serviceType = "manual";
  if (captchaService === "1") {
    serviceType = "2captcha";
    const apiKey = await askQuestion("请输入2Captcha API密钥: ");
    config.captchaServices.captcha2Apikey = [apiKey];
  } else if (captchaService === "2") {
    serviceType = "antiCaptcha";
    const apiKey = await askQuestion("请输入AntiCaptcha API密钥: ");
    config.captchaServices.antiCaptcha = [apiKey];
  } else {
    logMessage(null, null, "将使用手动模式解决验证码", "info");
    const useTelegram = await askQuestion("是否使用Telegram解决验证码? (y/n): ");
    if (useTelegram.toLowerCase() === "y") {
      const botToken = await askQuestion("请输入Telegram机器人令牌: ");
      const chatId = await askQuestion("请输入Telegram聊天ID: ");
      config.telegramConfig.botToken = botToken;
      config.telegramConfig.chatId = chatId;
    }
  }
  
  config.captchaServices.captchaUsing = serviceType;
  
  // 保存配置到文件
  fs.writeFileSync("config.js", `/**
 * Dawn验证器自动化工具 - 配置文件
 * 作者: 小林
 * 功能: 配置验证码服务和Telegram机器人
 */
module.exports = ${JSON.stringify(config, null, 2)};`);
  
  logMessage(null, null, `验证码服务已配置为: ${serviceType}`, "success");
}

/**
 * 从文本文件加载账号和代理
 * @param {String} filePath - 文件路径
 * @returns {Object} - 包含账号和代理的对象
 */
function loadAccountsAndProxiesFromFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => {
      const trimmedLine = line.trim();
      return trimmedLine && !trimmedLine.startsWith('#');
    });
    
    const accounts = [];
    const proxies = [];
    const accountProxyMap = new Map(); // 用于存储账号和代理的映射关系
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 只支持"邮箱----密码----代理地址"格式
      if (trimmedLine.includes('----')) {
        const parts = trimmedLine.split('----');
        if (parts.length >= 3) {
          const email = parts[0].trim();
          const password = parts[1].trim();
          const proxy = parts[2].trim();
          
          if (email && password && proxy) {
            const account = {
              email: email,
              password: password,
              data: {
                appid: "",
                token: ""
              }
            };
            accounts.push(account);
            
            // 将代理与账号关联
            proxies.push(proxy);
            accountProxyMap.set(email, proxy);
            
            logMessage(null, null, `已加载账号: ${email} 及其对应代理`, "info");
          } else {
            logMessage(null, null, `跳过无效行: ${trimmedLine}`, "warning");
          }
        } else {
          logMessage(null, null, `格式错误，应为"邮箱----密码----代理地址": ${trimmedLine}`, "warning");
        }
      } else {
        logMessage(null, null, `格式错误，应为"邮箱----密码----代理地址": ${trimmedLine}`, "warning");
      }
    }
    
    return { accounts, proxies, accountProxyMap };
  } catch (error) {
    logMessage(null, null, `读取文件失败: ${error.message}`, "error");
    return { accounts: [], proxies: [], accountProxyMap: new Map() };
  }
}

/**
 * 保存账号信息到文件
 * @param {Array} accounts - 账号列表
 */
function saveAccountsToFile(accounts) {
  try {
    fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 2));
    logMessage(null, null, `已保存 ${accounts.length} 个账户到accounts.json`, "success");
  } catch (error) {
    logMessage(null, null, `保存账户失败: ${error.message}`, "error");
  }
}

/**
 * 主函数 - 程序入口点
 */
async function main() {
  // 显示程序横幅
  displayBanner();

  try {
    // 检查验证码服务配置
    const captchaService = config.captchaServices.captchaUsing;
    const needConfig = captchaService === "manual" && 
                      (!config.telegramConfig.botToken || !config.telegramConfig.chatId) ||
                      captchaService === "2captcha" && 
                      (!config.captchaServices.captcha2Apikey[0]) ||
                      captchaService === "antiCaptcha" && 
                      (!config.captchaServices.antiCaptcha[0]);
    
    // 如果需要配置验证码服务
    if (needConfig) {
      logMessage(null, null, "检测到验证码服务未配置", "warning");
      const configCaptcha = await askQuestion("是否配置验证码服务? (y/n): ");
      if (configCaptcha.toLowerCase() === "y") {
        await configureCaptchaService();
      }
    } else {
      logMessage(null, null, `当前验证码服务: ${config.captchaServices.captchaUsing}`, "info");
    }
    
    // 选择运行模式
    const runMode = await askQuestion("请选择运行模式 (1: 单账号手动输入, 2: 文本文件配置): ");
    
    let accounts = [];
    let singleAccount = null;
    let singleProxy = null;
    let proxiesLoaded = false;
    let accountProxyMap = new Map(); // 账号和代理的映射关系
    
    if (runMode === "1") {
      // 单账号手动输入模式，支持多账号
      logMessage(null, null, "手动输入模式（支持多账号）", "process");
      
      let continueAdding = true;
      let accountCount = 0;
      
      while (continueAdding) {
        accountCount++;
        logMessage(null, null, `正在配置第 ${accountCount} 个账号`, "info");
        
        const email = await askQuestion("请输入邮箱: ");
        const password = await askQuestion("请输入密码: ");
        
        const account = {
          email: email,
          password: password,
          data: {
            appid: "",
            token: ""
          }
        };
        
        // 询问是否使用代理
        const useProxy = await askQuestion("是否使用代理? (y/n): ");
        let proxy = null;
        if (useProxy.toLowerCase() === "y") {
          proxy = await askQuestion("请输入代理 (格式: IP:端口:用户名:密码): ");
        }
        
        // 将账号添加到账号列表
        accounts.push(account);
        
        // 如果使用代理，建立账号和代理的映射关系
        if (proxy) {
          accountProxyMap.set(email, proxy);
        }
        
        logMessage(null, null, `已配置账号: ${email}`, "success");
        
        // 询问是否继续添加账号
        const addMore = await askQuestion("是否继续添加账号? (y/n): ");
        if (addMore.toLowerCase() !== "y") {
          continueAdding = false;
        }
      }
      
      // 保存账号到accounts.json以便后续使用
      if (accounts.length > 0) {
        saveAccountsToFile(accounts);
        logMessage(null, null, `已配置 ${accounts.length} 个账号`, "success");
        
        // 如果有账号和代理的映射关系
        if (accountProxyMap.size > 0) {
          logMessage(null, null, `已配置 ${accountProxyMap.size} 个账号与代理的映射关系`, "success");
        }
      }
    } 
    else {
      // 文本文件配置模式
      logMessage(null, null, "文本文件配置模式", "process");
      
      const filePath = await askQuestion("请输入配置文件路径 (默认: accounts.txt): ");
      const actualFilePath = filePath.trim() || "accounts.txt";
      
      try {
        // 从文本文件加载账号和代理
        const { accounts: loadedAccounts, proxies: loadedProxies, accountProxyMap: loadedMap } = loadAccountsAndProxiesFromFile(actualFilePath);
        
        if (loadedAccounts.length === 0) {
          logMessage(null, null, "未在文件中找到有效账号", "error");
          process.exit(1);
        }
        
        accounts = loadedAccounts;
        accountProxyMap = loadedMap;
        logMessage(null, null, `已从文件加载 ${accounts.length} 个账号`, "success");
        
        // 保存账号到accounts.json以便后续使用
        saveAccountsToFile(accounts);
        
        // 如果找到代理，将它们保存到proxy.txt
        if (loadedProxies.length > 0) {
          fs.writeFileSync("proxy.txt", loadedProxies.join('\n'));
          logMessage(null, null, `已从文件加载 ${loadedProxies.length} 个代理`, "success");
          proxiesLoaded = true;
          
          // 如果有账号和代理的映射关系
          if (loadedMap.size > 0) {
            logMessage(null, null, `已加载 ${loadedMap.size} 个账号与代理的映射关系`, "success");
          }
        }
      } catch (error) {
        logMessage(null, null, `加载配置文件失败: ${error.message}`, "error");
        process.exit(1);
      }
    }
    
    // 无限循环，持续运行保活任务
    while (true) {
      logMessage(null, null, "开始新的处理流程，请稍候...", "debug");
      const results = [];
      
      if (runMode === "1" && accounts.length > 0) {
        // 多账号手动输入模式
        const count = accounts.length;
        // 遍历所有账户
        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];
          try {
            console.log(chalk.white("-".repeat(85)));
            // 获取指定代理或默认IP
            let currentProxy = null;
            if (accountProxyMap.has(account.email)) {
              // 如果有为此账号指定的代理，使用指定代理
              currentProxy = accountProxyMap.get(account.email);
              logMessage(i + 1, count, `使用指定代理: ${currentProxy}`, "info");
            }
            
            // 创建Dawn验证器实例
            const dawn = new dawnValidator(account, currentProxy, i + 1, count);
            // 执行保活流程
            const data = await dawn.processKeepAlive();
            // 记录结果
            results.push({
              email: data.email,
              points: data.points || 0,
              keepAlive: data.keepAlive || false,
              proxy: currentProxy || "默认IP",
            });
          } catch (error) {
            logMessage(
              i + 1,
              count,
              `处理账户失败: ${error.message}`,
              "error"
            );
            results.push({
              email: account.email,
              points: 0,
              keepAlive: false,
              proxy: accountProxyMap.has(account.email) ? accountProxyMap.get(account.email) : "默认IP",
            });
          }
        }
      } else if (runMode === "1" && accounts.length === 0) {
        // 如果没有配置账号，提示错误
        logMessage(null, null, "未配置任何账号，请重新运行程序并配置账号", "error");
        process.exit(1);
      } else {
        // 批量账号模式
        const count = accounts.length;
        // 遍历所有账户
        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];
          try {
            console.log(chalk.white("-".repeat(85)));
            // 获取随机代理或指定代理
            let currentProxy;
            if (accountProxyMap.has(account.email)) {
              // 如果有为此账号指定的代理，使用指定代理
              currentProxy = accountProxyMap.get(account.email);
            } else {
              // 否则获取随机代理
              currentProxy = await getRandomProxy(i + 1, count);
            }
            // 创建Dawn验证器实例
            const dawn = new dawnValidator(account, currentProxy, i + 1, count);
            // 执行保活流程
            const data = await dawn.processKeepAlive();
            // 记录结果
            results.push({
              email: data.email,
              points: data.points || 0,
              keepAlive: data.keepAlive || false,
              proxy: currentProxy,
            });
          } catch (error) {
            logMessage(
              null,
              null,
              `处理账户失败: ${error.message}`,
              "error"
            );
            results.push({
              email: "N/A",
              points: 0,
              keepAlive: false,
              proxy: "N/A",
            });
          }
        }
      }
      
      // 显示所有账户的处理结果
      console.log("\n" + "═".repeat(70));
      results.forEach((result) => {
        logMessage(null, null, `账户: ${result.email}`, "success");
        logMessage(null, null, `总积分: ${result.points}`, "success");
        const keepAliveStatus = result.keepAlive
          ? chalk.green("✔ 保活成功")
          : chalk.red("✖ 保活失败");
        logMessage(null, null, `保活状态: ${keepAliveStatus}`, "success");
        logMessage(null, null, `代理: ${result.proxy}`, "success");
        console.log("─".repeat(70));
      });

      logMessage(
        null,
        null,
        "处理完成，将在10分钟后开始新的处理流程",
        "success"
      );

      // 等待10分钟后再次执行
      await new Promise((resolve) => setTimeout(resolve, 60000 * 10));
    }
  } catch (error) {
    logMessage(null, null, `主程序失败: ${error.message}`, "error");
  }
}

main();
