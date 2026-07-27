"use client";

import { Shield, AlertTriangle, FileText, Mail } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">免责声明</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">使用本网站前请仔细阅读以下内容</p>
      </div>

      {/* 版权声明 */}
      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-lg font-semibold">版权声明</h2>
        </div>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>本网站为免费工具聚合平台，旨在帮助用户备考雅思考试</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>词汇由本网站归纳总结，仅作参考，用户可以自行寻找更好的词汇资源</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>AI 功能由用户自带的 DeepSeek API Key 驱动，本网站仅提供提示词和代理转发</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>本网站不提供任何充值服务，所有 Token 费用在 AI 厂商官方平台结算</span></li>
        </ul>
      </section>

      {/* 密钥安全说明 */}
      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-lg font-semibold">API 密钥安全说明</h2>
        </div>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>密钥在浏览器中使用 AES 加密后存储于 localStorage，不在服务器保存</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>每次 API 请求通过后端代理转发至 DeepSeek，服务器不记录、不存储任何密钥</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>请求完成后密钥信息立即丢弃，不留痕迹</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>建议使用独立的 API Key，并设置使用额度上限</span></li>
        </ul>
      </section>

      {/* 免责条款 */}
      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-lg font-semibold">免责条款</h2>
        </div>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>AI 生成内容仅供参考，不构成正式考试建议或培训指导</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>用户需自行承担使用本网站的一切风险</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>本网站不对 AI 输出的准确性、完整性或时效性做任何保证</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>因用户设备安全问题导致的 API 密钥泄露，本网站不承担责任</span></li>
          <li className="flex items-start gap-2"><span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" /><span>如怀疑密钥泄露，请立即前往 DeepSeek 后台删除该密钥并重新生成</span></li>
        </ul>
      </section>

      {/* 联系方式 */}
      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-lg font-semibold">联系方式</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          侵权投诉 / 合作请联系：<span className="text-[var(--foreground)] font-medium">3210174734@qq.com</span>
        </p>
      </section>
    </div>
  );
}
