// auth/version.js —— 客户端版本闸门
// 兼容旧版 X-SDK-VER 与新版 X-App-Ver；主版本 < 3 视为旧 SDK。
//
// 2027 截止按北京时间计算：
//   2027-01-01 00:00:00 Asia/Shanghai = 2026-12-31T16:00:00Z
export const LEGACY_CUTOFF_MS = Date.UTC(2026, 11, 31, 16, 0, 0);

export function parseClientVersion(request) {
  const raw =
    request.headers.get("X-App-Ver") ||
    request.headers.get("X-SDK-VER") ||
    "";
  const match = /^\s*(\d+)\.(\d+)(?:\.(\d+))?/.exec(raw);
  if (!match) {
    return {
      raw,
      major: 0,
      minor: 0,
      patch: 0,
      valid: false,
      isLegacy: true,
    };
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3] || 0);
  return {
    raw,
    major,
    minor,
    patch,
    valid: true,
    isLegacy: major < 3,
  };
}

export function isAfterLegacyCutoff(now = Date.now()) {
  return now >= LEGACY_CUTOFF_MS;
}
