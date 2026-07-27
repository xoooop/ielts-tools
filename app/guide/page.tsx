"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Copy, Check, ArrowRight, Key } from "lucide-react";
import { useState } from "react";

const steps = [
  {
    title: "注册 DeepSeek 账号",
    content: "访问 platform.deepseek.com，使用手机号或邮箱注册账号。",
    link: "https://platform.deepseek.com",
  },
  {
    title: "创建 API Key",
    content: "登录后点击左侧菜单「API Keys」→ 点击「创建 API Key」→ 输入名称（如 ielts-tools）→ 复制生成的密钥。",
    note: "密钥格式：sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n\n⚠️ 一定要在弹窗时点击复制密钥按钮，不然复制的密钥不完整！",
    warn: true,
  },
  {
    title: "在本站配置密钥",
    content: "返回本网站，进入「我的」页面，粘贴密钥并保存。密钥将 AES 加密存储在浏览器中。",
  },
  {
    title: "开始使用",
    content: "配置完成后，返回 AI 助手页面即可开始使用。每次调用消耗 DeepSeek 额度，费用很低。",
  },
];

export default function GuidePage() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold mb-2">获取 DeepSeek API 密钥</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          本网站免费使用，AI 功能由你的 DeepSeek API Key 驱动。按以下步骤获取密钥：
        </p>
      </motion.div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className="w-px flex-1 bg-[var(--border-color)] mt-1" />}
            </div>
            <div className="pb-6 flex-1">
              <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{step.content}</p>
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-400 hover:underline"
                >
                  打开链接 <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {step.note && (
                <p className={`mt-1.5 text-xs px-2 py-1 rounded-lg inline-block whitespace-pre-line ${(step as any).warn ? "text-red-500 bg-red-500/10 font-medium" : "text-amber-500 bg-amber-500/5"}`}>
                  {step.note}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick link to settings */}
      <Link
        href="/settings"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
      >
        <Key className="w-4 h-4" />
        去设置密钥
        <ArrowRight className="w-4 h-4" />
      </Link>

      <p className="text-xs text-[var(--text-muted)] text-center mt-4">
        配置完成后即可使用全部 AI 功能
      </p>
    </div>
  );
}
