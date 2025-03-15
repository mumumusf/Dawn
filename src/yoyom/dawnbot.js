/**
 * Dawn验证器自动化工具 - 主类
 * 作者: 小林
 * 功能: 处理Dawn验证器的所有操作，包括登录、保活和积分获取
 */
const { getProxyAgent } = require("./proxy");
const UserAgent = require("user-agents");
const https = require("https");
const axios = require("axios");
const fs = require("fs");
const captchaServices = new (require("../yoyo/captchaServices"))();
const { logMessage } = require("../yoyo/logger");
const generator = new (require("../yoyo/generator"))();

module.exports = class dawnValidator {
  constructor(account, proxy = null, currentNum, total) {
    this.currentNum = currentNum;
    this.total = total;
    this.account = account;
    this.token = null;
    this.appid = null;
    this.proxy = proxy;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getProxyAgent(this.proxy) }),
      timeout: 120000,
    };
  }

  async makeRequest(method, url, config = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const userAgent = new UserAgent().toString();
        const headers = {
          "User-Agent": userAgent,
          ...config.headers,
        };
        const response = await axios({
          method,
          url,
          ...this.axiosConfig,
          ...config,
          headers,
        });

        if (response.status === 400) {
          throw new Error("400: Invalid token or request");
        }

        return response;
      } catch (error) {
        logMessage(
          this.currentNum,
          this.total,
          `请求失败 ${error.message}`,
          "error"
        );

        if (error.response && error.response.status === 400) {
          throw new Error("400: Invalid token or request");
        }

        logMessage(
          this.currentNum,
          this.total,
          `重试中... (${i + 1}/${retries})`,
          "process"
        );
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
    }
    return null;
  }

  async getPuzzledId() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: `chrome-extension://fpdkjdnhkakefebpekbdhillbhonfjjp`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    };

    try {
      const response = await this.makeRequest(
        "GET",
        `https://www.aeropres.in/chromeapi/dawn/v1/puzzle/get-puzzle?appid=${this.appid}`,
        {
          headers: headers,
        }
      );
      if (response.data.success === true) {
        logMessage(
          this.currentNum,
          this.total,
          `成功获取拼图ID: ${response.data.puzzle_id}`,
          "success"
        );
        return response.data.puzzle_id;
      }
      return null;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `获取拼图ID失败: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async getPuzzleImage(puzzleId) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: `chrome-extension://fpdkjdnhkakefebpekbdhillbhonfjjp`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    };

    try {
      const response = await this.makeRequest(
        "GET",
        `https://www.aeropres.in/chromeapi/dawn/v1/puzzle/get-puzzle-image?puzzle_id=${puzzleId}&appid=${this.appid}`,
        {
          headers: headers,
        }
      );
      if (response.data.success === true) {
        logMessage(
          this.currentNum,
          this.total,
          `成功获取拼图图片`,
          "success"
        );
        return response.data.imgBase64;
      }
      return null;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `获取拼图图片失败: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async loginUser(puzzle_id, captcha) {
    logMessage(this.currentNum, this.total, "尝试登录用户...", "process");
    const current_datetime = new Date().toISOString();
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: `chrome-extension://fpdkjdnhkakefebpekbdhillbhonfjjp`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    };

    const payload = {
      username: this.account.email,
      password: this.account.password,
      logindata: {
        _v: { version: "1.1.3" },
        datetime: current_datetime,
      },
      puzzle_id: puzzle_id,
      ans: captcha,
      appid: this.appid,
    };

    try {
      const response = await this.makeRequest(
        "POST",
        `https://www.aeropres.in/chromeapi/dawn/v1/user/login/v2?appid=${this.appid}`,
        {
          headers: headers,
          data: payload,
        }
      );
      if (response.data.status == true) {
        logMessage(
          this.currentNum,
          this.total,
          `登录用户成功`,
          "success"
        );
        return response.data.data.token;
      }
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `登录用户失败: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  async getPoints() {
    logMessage(
      this.currentNum,
      this.total,
      "尝试获取积分...",
      "process"
    );
    const headers = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: `chrome-extension://fpdkjdnhkakefebpekbdhillbhonfjjp`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    };

    try {
      const response = await this.makeRequest(
        "GET",
        `https://www.aeropres.in/api/atom/v1/userreferral/getpoint?appid=${this.appid}`,
        {
          headers: headers,
        }
      );

      if (response.data.status === true) {
        const { rewardPoint, referralPoint } = response.data.data;
        const totalPoints =
          (rewardPoint.points || 0) +
          (rewardPoint.registerpoints || 0) +
          (rewardPoint.signinpoints || 0) +
          (rewardPoint.twitter_x_id_points || 0) +
          (rewardPoint.discordid_points || 0) +
          (rewardPoint.telegramid_points || 0) +
          (rewardPoint.bonus_points || 0) +
          (referralPoint.commission || 0);
        logMessage(
          this.currentNum,
          this.total,
          `获取积分成功`,
          "success"
        );
        return totalPoints;
      }
      logMessage(this.currentNum, this.total, `获取积分失败`, "error");
      return null;
    } catch (error) {
      if (error.message.includes("400")) {
        await this.handleInvalidToken();
        return await this.getPoints();
      } else {
        logMessage(
          this.currentNum,
          this.total,
          `获取积分失败: ${error.message}`,
          "error"
        );
        return null;
      }
    }
  }

  async keepAliveRequest() {
    logMessage(this.currentNum, this.total, "尝试保活...", "process");

    const headers = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: `chrome-extension://fpdkjdnhkakefebpekbdhillbhonfjjp`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    };

    const payload = {
      username: this.account.email,
      extensionid: "fpdkjdnhkakefebpekbdhillbhonfjjp",
      numberoftabs: 0,
      _v: "1.1.3",
    };
    const ignoreSslAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    try {
      const response = await this.makeRequest(
        "POST",
        `https://www.aeropres.in/chromeapi/dawn/v1/userreward/keepalive?appid=${this.appid}`,
        { headers: headers, data: payload, httpsAgent: ignoreSslAgent }
      );

      if (response.data.success === true) {
        logMessage(
          this.currentNum,
          this.total,
          `保活成功`,
          "success"
        );
        return true;
      }
      logMessage(
        this.currentNum,
        this.total,
        `保活失败: ${response.data.message}`,
        "error"
      );
      return false;
    } catch (error) {
      if (error.message.includes("400")) {
        await this.handleInvalidToken();
        return await this.keepAliveRequest();
      } else {
        logMessage(
          this.currentNum,
          this.total,
          `保活失败: ${error.message}`,
          "error"
        );
        return false;
      }
    }
  }

  async ensureAppidAndToken() {
    if (!this.account.data.appid || !this.account.data.token) {
      logMessage(
        this.currentNum,
        this.total,
        "AppID或Token缺失，正在生成新的...",
        "process"
      );
      const success = await this.generateAppidAndToken();
      if (success) {
        try {
          // 检查accounts.json文件是否存在
          let accounts = [];
          if (fs.existsSync("accounts.json")) {
            accounts = JSON.parse(fs.readFileSync("accounts.json", "utf8"));
          }
          
          // 查找当前账号是否已存在
          let accountExists = false;
          const updatedAccounts = accounts.map((acc) => {
            if (acc.email === this.account.email) {
              accountExists = true;
              acc.data.appid = this.appid;
              acc.data.token = this.token;
            }
            return acc;
          });
          
          // 如果账号不存在，添加到列表中
          if (!accountExists) {
            updatedAccounts.push({
              email: this.account.email,
              password: this.account.password,
              data: {
                appid: this.appid,
                token: this.token
              }
            });
          }
          
          fs.writeFileSync(
            "accounts.json",
            JSON.stringify(updatedAccounts, null, 2)
          );
          logMessage(
            this.currentNum,
            this.total,
            "AppID和Token已更新到accounts.json",
            "success"
          );
        } catch (error) {
          logMessage(
            this.currentNum,
            this.total,
            `更新accounts.json失败: ${error.message}`,
            "warning"
          );
        }
      } else {
        throw new Error("生成AppID和Token失败");
      }
    } else {
      this.appid = this.account.data.appid;
      this.token = this.account.data.token;
    }
  }

  async handleInvalidToken() {
    logMessage(
      this.currentNum,
      this.total,
      "Token无效，尝试生成新的...",
      "process"
    );
    const success = await this.generateAppidAndToken();
    if (success) {
      try {
        // 检查accounts.json文件是否存在
        let accounts = [];
        if (fs.existsSync("accounts.json")) {
          accounts = JSON.parse(fs.readFileSync("accounts.json", "utf8"));
        }
        
        // 查找当前账号是否已存在
        let accountExists = false;
        const updatedAccounts = accounts.map((acc) => {
          if (acc.email === this.account.email) {
            accountExists = true;
            acc.data.token = this.token;
          }
          return acc;
        });
        
        // 如果账号不存在，添加到列表中
        if (!accountExists) {
          updatedAccounts.push({
            email: this.account.email,
            password: this.account.password,
            data: {
              appid: this.appid,
              token: this.token
            }
          });
        }
        
        fs.writeFileSync(
          "accounts.json",
          JSON.stringify(updatedAccounts, null, 2)
        );
        logMessage(
          this.currentNum,
          this.total,
          "Token已更新到accounts.json",
          "success"
        );
      } catch (error) {
        logMessage(
          this.currentNum,
          this.total,
          `更新accounts.json失败: ${error.message}`,
          "warning"
        );
      }
    } else {
      throw new Error("生成新Token失败");
    }
  }

  async generateAppidAndToken() {
    try {
      this.appid = generator.generateAppId();
      const puzzle_id = await this.getPuzzledId();
      const puzzle_image = await this.getPuzzleImage(puzzle_id);
      
      logMessage(
        this.currentNum,
        this.total,
        "正在使用验证码服务解决验证码...",
        "process"
      );
      
      // 直接使用2Captcha服务
      let captcha;
      try {
        logMessage(
          this.currentNum,
          this.total,
          "尝试使用2Captcha服务解决验证码...",
          "info"
        );
        
        // 从配置中获取API密钥
        let apiKey = "";
        try {
          const config = require("../../config");
          if (config && config.captchaServices && config.captchaServices.captcha2Apikey) {
            apiKey = config.captchaServices.captcha2Apikey[0];
            logMessage(
              this.currentNum,
              this.total,
              `已获取2Captcha API密钥: ${apiKey.substring(0, 5)}...`,
              "info"
            );
          }
        } catch (configError) {
          logMessage(
            this.currentNum,
            this.total,
            `获取配置失败: ${configError.message}`,
            "warning"
          );
        }
        
        if (!apiKey) {
          throw new Error("2Captcha API密钥为空");
        }
        
        captcha = await captchaServices.solve2Captcha(puzzle_image);
      } catch (captchaError) {
        logMessage(
          this.currentNum,
          this.total,
          `2Captcha服务失败: ${captchaError.message}，将使用手动模式`,
          "warning"
        );
        captcha = await captchaServices.solveCaptchaManually(puzzle_image);
      }
      
      if (!captcha) {
        throw new Error("验证码解决失败");
      }
      
      logMessage(
        this.currentNum,
        this.total,
        `验证码解决成功: ${captcha}`,
        "success"
      );
      
      const login = await this.loginUser(puzzle_id, captcha);
      this.token = login;
      return true;
    } catch (error) {
      logMessage(
        this.currentNum,
        this.total,
        `生成AppID和Token失败 ${error.message}`,
        "error"
      );
    }
  }

  async processKeepAlive() {
    try {
      await this.ensureAppidAndToken();
      const getPoint = await this.getPoints();
      const keepAlive = await this.keepAliveRequest();

      return {
        email: this.account.email,
        points: getPoint,
        keepAlive: keepAlive,
      };
    } catch (error) {
      if (error.message.includes("400")) {
        await this.handleInvalidToken();
        return await this.processKeepAlive();
      } else {
        logMessage(
          this.currentNum,
          this.total,
          `处理账户失败: ${error.message}`,
          "error"
        );
        throw error;
      }
    }
  }
};
