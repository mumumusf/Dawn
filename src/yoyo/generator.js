/**
 * 生成器工具
 * 作者: 小林
 * 功能: 生成Dawn验证器所需的各种ID和令牌
 */
module.exports = class generator {
  /**
   * 生成Dawn验证器应用ID
   * @returns {String} - 生成的应用ID
   */
  generateAppId() {
    // 可用的十六进制字符
    const hexDigits = "0123456789abcdefABCDEF";
    // 生成22位随机字符
    const randomPart = Array.from(
      { length: 22 },
      () => hexDigits[Math.floor(Math.random() * hexDigits.length)]
    )
      .join("")
      .toLowerCase();
    // 返回格式化的应用ID
    return `67${randomPart}`;
  }
};
