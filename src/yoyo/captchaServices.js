/**
 * 验证码解决服务
 * 作者: 小林
 * 功能: 提供多种验证码解决方案，包括2Captcha、AntiCaptcha和手动(Telegram)
 */
const { Solver } = require("@2captcha/captcha-solver");
const ac = require("@antiadmin/anticaptchaofficial");
const fs = require("fs");
const path = require("path");
const { logMessage } = require("./logger");
const { Telegraf } = require("telegraf");
const readline = require("readline");

// 尝试从index.js获取配置
let config;
try {
  const indexConfig = require("../../src/index").config;
  if (indexConfig) {
    config = indexConfig;
    logMessage(null, null, "从index.js获取配置成功", "success");
  } else {
    config = checkAndCreateConfig();
  }
} catch (error) {
  logMessage(null, null, `从index.js获取配置失败: ${error.message}，将使用本地配置`, "warning");
  config = checkAndCreateConfig();
}

/**
 * 检查并创建配置文件
 */
function checkAndCreateConfig() {
  const configPath = path.join(__dirname, "../../config.js");
  
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
    // 使用绝对路径加载配置文件
    return require(configPath);
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

module.exports = class captchaServices {
  /**
   * 构造函数 - 初始化Telegram机器人
   */
  constructor() {
    this.config = config; // 保存配置到实例变量
    this.botToken = config.telegramConfig.botToken;
    this.chatId = config.telegramConfig.chatId;
    try {
      this.bot = new Telegraf(this.botToken);
    } catch (error) {
      console.log("Telegram机器人初始化失败，将使用控制台输入解决验证码");
    }
  }

  /**
   * 从控制台获取用户输入
   * @param {String} question - 提示问题
   * @returns {Promise<String>} - 用户输入的内容
   */
  askQuestion(question) {
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
   * 将验证码图片保存到文件并在控制台显示路径
   * @param {String} base64 - 验证码图片的base64编码
   * @returns {String} - 保存的文件路径
   */
  saveCaptchaImage(base64) {
    const filePath = `./captcha_${Date.now()}.png`;
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  /**
   * 将验证码图片发送到Telegram进行手动解决
   * @param {String} base64 - 验证码图片的base64编码
   * @returns {Boolean} - 是否成功发送
   */
  async sendCaptchaToTelegram(base64) {
    try {
      // 将base64转换为图片文件
      const filePath = `./captcha_${Date.now()}.png`;
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(filePath, buffer);
      // 发送图片到Telegram
      await this.bot.telegram.sendPhoto(
        this.chatId,
        {
          source: fs.createReadStream(filePath),
        },
        {
          caption: "请解决验证码并发送答案。",
        }
      );

      // 删除临时文件
      fs.unlinkSync(filePath);

      return true;
    } catch (error) {
      console.error("发送验证码到Telegram失败:", error);
      return false;
    }
  }

  /**
   * 等待Telegram用户回复验证码答案
   * @returns {Promise<String>} - 验证码答案
   */
  async waitForCaptchaResponse() {
    return new Promise((resolve) => {
      this.bot.on("text", (ctx) => {
        const answer = ctx.message.text;
        resolve(answer);
      });
      this.bot.launch();
    });
  }

  /**
   * 从控制台获取验证码答案
   * @param {String} filePath - 验证码图片路径
   * @returns {Promise<String>} - 验证码答案
   */
  async getCaptchaFromConsole(filePath) {
    logMessage(null, null, `验证码图片已保存到: ${filePath}`, "info");
    logMessage(null, null, "请查看图片并输入验证码", "process");
    const answer = await this.askQuestion("请输入验证码: ");
    return answer;
  }

  /**
   * 手动解决验证码（通过Telegram或控制台）
   * @param {String} base64 - 验证码图片的base64编码
   * @returns {String|null} - 验证码答案或null
   */
  async solveCaptchaManually(base64) {
    try {
      // 检查是否配置了有效的Telegram机器人
      const isTelegramConfigValid = 
        this.botToken && 
        this.chatId && 
        this.botToken !== "your_bot_token" && 
        this.chatId !== "your_chat_id";
      
      if (isTelegramConfigValid) {
        // 使用Telegram解决验证码
        const sent = await this.sendCaptchaToTelegram(base64);
        if (!sent) {
          throw new Error("发送验证码到Telegram失败");
        }

        logMessage(null, null, "等待Telegram验证码回复...", "process");
        const answer = await this.waitForCaptchaResponse();
        this.bot.stop();

        return answer;
      } else {
        // 使用控制台解决验证码
        const filePath = this.saveCaptchaImage(base64);
        const answer = await this.getCaptchaFromConsole(filePath);
        return answer;
      }
    } catch (error) {
      console.error("手动解决验证码失败:", error);
      // 如果Telegram方式失败，尝试使用控制台
      try {
        const filePath = this.saveCaptchaImage(base64);
        const answer = await this.getCaptchaFromConsole(filePath);
        return answer;
      } catch (consoleError) {
        console.error("通过控制台解决验证码失败:", consoleError);
        return null;
      }
    }
  }

  async solveCaptcha(base64) {
    const captchaProvider = this.config.captchaServices.captchaUsing;
    logMessage(null, null, `当前验证码服务: ${captchaProvider}`, "info");

    if (captchaProvider === "manual") {
      logMessage(null, null, "使用手动模式解决验证码", "info");
      return await this.solveCaptchaManually(base64);
    } else if (captchaProvider === "2captcha") {
      logMessage(null, null, "使用2Captcha服务解决验证码", "info");
      const result = await this.solve2Captcha(base64);
      if (result) {
        return result;
      } else {
        logMessage(null, null, "2Captcha服务失败，切换到手动模式", "warning");
        return await this.solveCaptchaManually(base64);
      }
    } else if (captchaProvider === "antiCaptcha") {
      logMessage(null, null, "使用AntiCaptcha服务解决验证码", "info");
      const result = await this.antiCaptcha(base64);
      if (result) {
        return result;
      } else {
        logMessage(null, null, "AntiCaptcha服务失败，切换到手动模式", "warning");
        return await this.solveCaptchaManually(base64);
      }
    } else {
      logMessage(null, null, `未知的验证码服务: ${captchaProvider}，使用手动模式`, "error");
      return await this.solveCaptchaManually(base64);
    }
  }

  getRandomApiKey(service) {
    const keys = this.config.captchaServices[service];
    return keys ? keys[Math.floor(Math.random() * keys.length)] : null;
  }

  async antiCaptcha(Base64) {
    const apikey = this.getRandomApiKey("antiCaptcha");
    ac.setAPIKey(apikey);
    try {
      const response = await ac.solveImage(Base64, true);
      return response;
    } catch (error) {
      console.error("使用AntiCaptcha解决验证码失败", error);
      return null;
    }
  }

  async solve2Captcha(base64) {
    // 尝试从配置文件中获取API密钥
    let api2Captcha = "";
    try {
      const config = require("../../config");
      if (config && config.captchaServices && config.captchaServices.captcha2Apikey) {
        api2Captcha = config.captchaServices.captcha2Apikey[0];
      }
    } catch (error) {
      logMessage(null, null, `获取配置失败: ${error.message}，尝试使用实例配置`, "warning");
      // 如果无法从配置文件获取，则尝试使用实例配置
      api2Captcha = this.getRandomApiKey("captcha2Apikey");
    }
    
    logMessage(null, null, `正在使用2Captcha服务解决验证码，API密钥: ${api2Captcha ? api2Captcha.substring(0, 5) + "..." : "未设置"}`, "info");
    
    try {
      if (!api2Captcha || api2Captcha === "") {
        throw new Error("2Captcha API密钥为空");
      }
      
      logMessage(null, null, "正在发送验证码到2Captcha...", "process");
      const solver = new Solver(api2Captcha);
      const res = await solver.imageCaptcha({
        body: `data:image/png;base64,${base64}`,
        regsense: 1,
      });
      
      logMessage(null, null, `2Captcha解决验证码成功: ${res.data}`, "success");
      return res.data;
    } catch (error) {
      logMessage(null, null, `使用2Captcha解决验证码失败: ${error.message}`, "error");
      
      // 如果2Captcha失败，尝试使用手动方式
      logMessage(null, null, "将尝试使用手动方式解决验证码", "warning");
      return await this.solveCaptchaManually(base64);
    }
  }
};
