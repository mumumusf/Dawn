/**
 * 代理管理工具
 * 作者: 小林
 * 功能: 管理HTTP和SOCKS代理，提供代理加载和随机选择功能
 */
const { HttpsProxyAgent } = require("https-proxy-agent");
const { SocksProxyAgent } = require("socks-proxy-agent");
const fs = require("fs");
const axios = require("axios");
const { logMessage } = require("../yoyo/logger");
const readline = require("readline");

let proxyList = [];
let axiosConfig = {};

/**
 * 创建readline接口用于控制台输入
 * @returns {Object} - readline接口
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 从控制台获取用户输入
 * @param {String} question - 提示问题
 * @returns {Promise<String>} - 用户输入的内容
 */
function askQuestion(question) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * 从控制台输入代理信息
 * @returns {Promise<String[]>} - 代理列表
 */
async function inputProxiesFromConsole() {
  logMessage(null, null, "请输入代理信息（支持多种格式）", "process");
  logMessage(null, null, "示例格式: 119.42.39.72:5700:YOYOZZLH:YOYOZZLH", "info");
  logMessage(null, null, "输入空行完成添加，直接按回车跳过代理设置", "info");
  
  const proxies = [];
  let inputting = true;
  
  while (inputting) {
    const proxy = await askQuestion("请输入代理 (留空完成): ");
    if (proxy.trim() === "") {
      inputting = false;
    } else {
      proxies.push(proxy.trim());
      logMessage(null, null, `已添加代理: ${proxy}`, "success");
    }
  }
  
  return proxies;
}

/**
 * 解析各种格式的代理字符串
 * @param {String} proxy - 代理字符串
 * @returns {String} - 格式化后的代理URL
 */
function parseProxy(proxy) {
  proxy = proxy.trim();
  
  // 已经是标准格式的代理URL
  if (proxy.includes("://")) {
    return proxy;
  }
  
  // 处理IP:端口:用户名:密码格式
  if (proxy.includes(":")) {
    const parts = proxy.split(":");
    
    // IP:端口:用户名:密码 格式 (例如 119.42.39.72:5700:YOYOZZLH:YOYOZZLH)
    if (parts.length === 4) {
      const [ip, port, username, password] = parts;
      return `http://${username}:${password}@${ip}:${port}`;
    }
    
    // IP:端口:用户名 格式
    else if (parts.length === 3) {
      const [ip, port, username] = parts;
      return `http://${username}@${ip}:${port}`;
    }
    
    // IP:端口 格式
    else if (parts.length === 2) {
      return `http://${proxy}`;
    }
  }
  
  // 默认返回原始代理字符串，添加http://前缀
  return `http://${proxy}`;
}

/**
 * 获取代理代理
 * @param {String} proxyUrl - 代理URL
 * @param {Number} index - 当前账户索引
 * @param {Number} total - 总账户数
 * @param {Object} options - 代理选项
 * @returns {Object|null} - 代理代理对象或null
 */
function getProxyAgent(proxyUrl, index, total, options = {}) {
  try {
    // 解析代理URL
    const formattedProxyUrl = parseProxy(proxyUrl);
    
    // 判断是否为SOCKS代理
    const isSocks = formattedProxyUrl.toLowerCase().startsWith("socks");
    const agentOptions = {
      rejectUnauthorized: false,
      ...options,
    };

    if (isSocks) {
      return new SocksProxyAgent(formattedProxyUrl, agentOptions);
    }

    return new HttpsProxyAgent(formattedProxyUrl, agentOptions);
  } catch (error) {
    logMessage(
      index,
      total,
      `创建代理代理失败: ${error.message}`,
      "error"
    );
    return null;
  }
}

/**
 * 加载代理列表
 * @param {Boolean} useConsoleInput - 是否使用控制台输入代理
 * @returns {Promise<Boolean>} - 是否成功加载代理
 */
async function loadProxies(useConsoleInput = false) {
  try {
    if (useConsoleInput) {
      // 从控制台输入代理
      proxyList = await inputProxiesFromConsole();
      if (proxyList.length > 0) {
        logMessage(
          null,
          null,
          `已从控制台加载 ${proxyList.length} 个代理`,
          "success"
        );
        return true;
      } else {
        logMessage(null, null, "未输入代理，将使用默认IP", "warning");
        return false;
      }
    } else {
      // 从proxy.txt文件读取代理列表
      try {
        const proxyFile = fs.readFileSync("proxy.txt", "utf8");
        proxyList = proxyFile
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#"))
          .map((proxy) => proxy.trim());

        if (proxyList.length === 0) {
          throw new Error("proxy.txt文件中未找到代理");
        }
        logMessage(
          null,
          null,
          `已从proxy.txt加载 ${proxyList.length} 个代理`,
          "success"
        );
        return true;
      } catch (error) {
        // 如果文件不存在或为空，尝试从控制台输入
        if (error.code === "ENOENT" || error.message.includes("未找到代理")) {
          logMessage(null, null, "proxy.txt文件不存在或为空，请从控制台输入代理", "warning");
          return await loadProxies(true);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    logMessage(null, null, `加载代理失败: ${error.message}`, "error");
    return false;
  }
}

async function checkIP(index, total) {
  try {
    const response = await axios.get(
      "https://api.ipify.org?format=json",
      axiosConfig
    );
    const ip = response.data.ip;
    logMessage(index, total, `当前使用的IP: ${ip}`, "success");
    return { success: true, ip: ip };
  } catch (error) {
    logMessage(index, total, `获取IP失败: ${error.message}`, "error");
    return false;
  }
}

async function getRandomProxy(index, total) {
  if (proxyList.length === 0) {
    axiosConfig = {};
    await checkIP(index, total);
    return null;
  }

  let proxyAttempt = 0;
  while (proxyAttempt < proxyList.length) {
    const proxy = proxyList[Math.floor(Math.random() * proxyList.length)];
    try {
      const agent = getProxyAgent(proxy, index, total);
      if (!agent) continue;

      axiosConfig.httpsAgent = agent;
      await checkIP(index, total);
      return proxy;
    } catch (error) {
      proxyAttempt++;
    }
  }

  logMessage(index, total, "使用默认IP", "warning");
  axiosConfig = {};
  await checkIP(index, total);
  return null;
}

module.exports = {
  getProxyAgent,
  loadProxies,
  getRandomProxy,
  inputProxiesFromConsole,
};
