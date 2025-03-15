/**
 * 日志工具
 * 作者: 小林
 * 功能: 提供彩色日志输出，支持不同类型的日志信息
 */
const chalk = require("chalk");

/**
 * 输出格式化的日志信息
 * @param {Number|null} currentNum - 当前账户序号
 * @param {Number|null} total - 总账户数
 * @param {String} message - 日志消息
 * @param {String} messageType - 消息类型(success/error/process/debug/info)
 */
function logMessage(
  currentNum = null,
  total = null,
  message = "",
  messageType = "info"
) {
  // 获取当前时间并格式化
  const now = new Date();
  const timestamp = now
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\./g, ":")
    .replace(/, /g, " ");
  // 添加账户状态信息
  const accountStatus = currentNum && total ? `[${currentNum}/${total}] ` : "";

  // 根据消息类型设置不同颜色
  let logText;
  switch (messageType) {
    case "success":
      logText = chalk.green(`[✓] ${message}`);
      break;
    case "error":
      logText = chalk.red(`[-] ${message}`);
      break;
    case "process":
      logText = chalk.yellow(`[!] ${message}`);
      break;
    case "debug":
      logText = chalk.blue(`[~] ${message}`);
      break;
    default:
      logText = chalk.white(`[?] ${message}`);
  }

  // 输出格式化的日志
  console.log(
    `${chalk.white("[")}${chalk.dim(timestamp)}${chalk.white(
      "]"
    )} ${accountStatus}${logText}`
  );
}

module.exports = {
  logMessage,
};
