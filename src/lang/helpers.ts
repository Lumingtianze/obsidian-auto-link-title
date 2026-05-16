import { moment } from "obsidian";
import en from "./locale/en.json";
import zh_cn from "./locale/zh_cn.json";

const LANGS: Record<string, any> = {
  en,
  zh_cn
};

export function t(key: keyof typeof en): string {
  // 获取当前语言并将横杠转为下划线 (例如 zh-cn -> zh_cn)
  const locale = moment.locale().replace("-", "_");
  
  const dict = LANGS[locale] || LANGS["en"];
  
  // 返回对应的文本，如果字典里没有这个键，则返回英文版，再没有则返回键名本身
  return dict[key] || en[key] || key;
}