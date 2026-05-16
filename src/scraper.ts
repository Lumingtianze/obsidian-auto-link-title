import { requestUrl } from 'obsidian';

const electronPkg = (window as any).require ? (window as any).require("electron") : null;

function blank(text: string | null | undefined): boolean {
  return text === undefined || text === null || text === "";
}

function notBlank(text: string | null | undefined): boolean {
  return !blank(text);
}

/**
 * 支持自动编码检测的抓取函数
 */
async function robustGetPageTitle(url: string): Promise<string> {
  try {
    // 使用 requestUrl 获取原始二进制数据
    const response = await requestUrl({ url });
    if (!response.headers['content-type']?.includes('text/html')) {
      return getUrlFinalSegment(url);
    }

    const buffer = response.arrayBuffer;
    let charset = 'utf-8';

    // 1. 探测编码：先看响应头
    const contentType = response.headers['content-type'] || '';
    const headerMatch = contentType.match(/charset=([\w-]+)/i);
    if (headerMatch) {
      charset = headerMatch[1];
    } else {
      // 2. 探测编码：预览前 1024 字节看 meta 标签
      const preview = new TextDecoder('utf-8').decode(buffer.slice(0, 1024));
      const metaMatch = preview.match(/<meta.*?charset=["']?([\w-]+)["']?/i) || 
                        preview.match(/<meta.*?content=["'].*?charset=([\w-]+)["']/i);
      if (metaMatch) charset = metaMatch[1];
    }

    // 使用正确的编码解码
    const html = new TextDecoder(charset).decode(buffer);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('title');

    if (!title || blank(title.innerText)) {
      const noTitle = title?.getAttribute('no-title');
      return notBlank(noTitle) ? (noTitle as string) : url;
    }

    return title.innerText.trim();
  } catch (ex) {
    console.error("Robust scrape failed:", ex);
    return "";
  }
}

/**
 * Electron 抓取：利用浏览器内核，天然支持编码转换和 JS 渲染
 */
async function electronGetPageTitle(url: string): Promise<string> {
  if (!electronPkg) return "";
  const { remote } = electronPkg;
  const { BrowserWindow } = remote;

  try {
    const window = new BrowserWindow({
      width: 1000, height: 600, show: false,
      webPreferences: { webSecurity: false, images: false }
    });
    window.webContents.setAudioMuted(true);

    return new Promise((resolve) => {
      window.webContents.on("did-finish-load", () => {
        const title = window.webContents.getTitle();
        window.destroy();
        resolve(notBlank(title) ? title : url);
      });
      window.webContents.on("did-fail-load", () => {
        window.destroy();
        resolve("");
      });
      window.loadURL(url);
    });
  } catch (ex) {
    return "";
  }
}

function getUrlFinalSegment(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/');
    const last = segments.pop() || segments.pop();
    return last || "File";
  } catch (_) {
    return "File";
  }
}

/**
 * 统一出口：根据环境和设置自动选择最佳方案
 */
export default async function getPageTitle(url: string, useElectronFallback: boolean = false): Promise<string> {
  if (!(url.startsWith('http'))) url = 'https://' + url;

  // 1. 首先尝试更轻量、支持编码检测的 robust 方案 (跨平台)
  let title = await robustGetPageTitle(url);

  // 2. 如果失败且在桌面端，回退到 Electron (支持 JS 渲染标题)
  if (blank(title) && electronPkg != null && useElectronFallback) {
    title = await electronGetPageTitle(url);
  }

  return title || url;
}