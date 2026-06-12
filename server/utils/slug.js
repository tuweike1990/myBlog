/**
 * 将中文标题转换为 URL slug
 * 简单方案：提取英文部分 + 用时间戳保证唯一性
 */
function generateSlug(title) {
  // 提取英文和数字
  const englishPart = title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  // 添加时间戳后缀保证唯一
  const timestamp = Date.now().toString(36);

  if (englishPart) {
    return `${englishPart}-${timestamp}`;
  }

  // 纯中文标题，直接用时间戳
  return `post-${timestamp}`;
}

module.exports = { generateSlug };
