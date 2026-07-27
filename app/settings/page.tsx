"use client";

import { useState, useEffect, useCallback } from "react";
import {
  encryptAndStore,
  getDecryptedKey,
  removeKey,
  hasApiKey,
  maskKey,
} from "@/lib/crypto";
import {
  Key,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  ExternalLink,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const [inputValue, setInputValue] = useState("");
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "failure" | null>(
    null
  );
  const [initialized, setInitialized] = useState(false);

  // Load existing key on mount
  useEffect(() => {
    if (hasApiKey()) {
      const key = getDecryptedKey();
      if (key) {
        setStoredKey(key);
      }
    }
    setInitialized(true);
  }, []);

  // Save key with encryption
  const handleSave = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error("请输入 API 密钥");
      return;
    }
    if (!trimmed.startsWith("sk-")) {
      toast.error("密钥格式不正确，应以 sk- 开头");
      return;
    }
    if (trimmed.length < 20) {
      toast.error("密钥长度不足，请检查是否完整复制");
      return;
    }
    encryptAndStore(trimmed);
    setStoredKey(trimmed);
    setInputValue("");
    setShowKey(false);
    setTestResult(null);
    toast.success("密钥已加密保存到浏览器");
  }, [inputValue]);

  // Delete stored key
  const handleDelete = useCallback(() => {
    removeKey();
    setStoredKey(null);
    setInputValue("");
    setTestResult(null);
    toast.success("密钥已删除");
  }, []);

  // Test API connection
  const handleTest = useCallback(async () => {
    const key = storedKey || inputValue.trim();
    if (!key) {
      toast.error("请先设置或输入 API 密钥");
      return;
    }
    if (!key.startsWith("sk-") || key.length < 20) {
      toast.error("密钥格式无效，请检查");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "hi" }],
          mode: "chat",
          apiKey: key,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        // Consume a tiny bit of the stream to verify it works
        const reader = res.body?.getReader();
        if (reader) {
          const { done } = await reader.read();
          reader.cancel();
          if (!done) {
            setTestResult("success");
            toast.success("连接成功！API 密钥有效，服务正常工作");
            return;
          }
        }
        setTestResult("success");
        toast.success("连接成功！API 密钥有效");
      } else {
        let errorMsg = "连接失败，请检查密钥是否正确";
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {
          // Response may not be JSON (e.g. streaming error)
        }
        setTestResult("failure");
        toast.error(errorMsg);
      }
    } catch (err: any) {
      setTestResult("failure");
      if (err?.name === "AbortError") {
        toast.error("连接超时，请检查网络后重试");
      } else {
        toast.error("网络错误，无法连接到服务");
      }
    } finally {
      setTesting(false);
    }
  }, [storedKey, inputValue]);

  // Avoid hydration mismatch
  if (!initialized) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-[var(--surface-alt)] rounded" />
          <div className="h-24 bg-[var(--surface-alt)] rounded-xl" />
          <div className="h-12 bg-[var(--surface-alt)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <Toaster position="top-center" richColors />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API 密钥设置</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          配置你的 DeepSeek API 密钥以使用 AI 功能
        </p>
      </div>

      {/* Current Key Status */}
      {storedKey && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">当前密钥</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              已配置
            </span>
          </div>
          <code className="text-sm font-mono text-[var(--text-muted)] select-all">
            {maskKey(storedKey)}
          </code>
        </div>
      )}

      {/* API Key Input */}
      <div className="space-y-2">
        <label htmlFor="api-key-input" className="text-sm font-medium">
          DeepSeek API 密钥
        </label>
        <div className="relative">
          <input
            id="api-key-input"
            type={showKey ? "text" : "password"}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setTestResult(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 pr-12 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-alt)] transition"
            aria-label={showKey ? "隐藏密钥" : "显示密钥"}
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          密钥将以 AES 加密形式存储在浏览器中
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!inputValue.trim()}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition"
        >
          保存密钥
        </button>
        {storedKey && (
          <button
            onClick={handleDelete}
            className="rounded-xl border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.98] transition flex items-center gap-2 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        )}
      </div>

      {/* Test Connection */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">连接测试</h3>
          {testResult === "success" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              连接正常
            </span>
          )}
          {testResult === "failure" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              连接失败
            </span>
          )}
        </div>
        <button
          onClick={handleTest}
          disabled={
            testing || (!storedKey && !inputValue.trim())
          }
          className="w-full rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--surface-alt)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition"
        >
          {testing ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
              测试中...
            </span>
          ) : (
            "测试连接"
          )}
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          发送一条简短测试消息验证密钥是否有效
        </p>
      </div>

      {/* Security Explanation */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
          <h2 className="text-lg font-semibold">🔒 你的密钥安全吗？</h2>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>
              你的密钥在浏览器中使用{" "}
              <strong className="text-[var(--foreground)] font-medium">
                AES 加密
              </strong>{" "}
              后存储在 localStorage 中，不会以明文形式保存
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>
              服务器仅在 API 调用时临时接收密钥用于转发请求，{" "}
              <strong className="text-[var(--foreground)] font-medium">
                绝不记录或存储
              </strong>
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>
              每次请求是独立的，密钥在响应完成后{" "}
              <strong className="text-[var(--foreground)] font-medium">
                立即被丢弃
              </strong>
              ，不在服务器留下任何痕迹
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>
              建议使用{" "}
              <strong className="text-[var(--foreground)] font-medium">
                专用 API 密钥
              </strong>
              ，并在 DeepSeek 后台设置使用量上限和额度告警
            </span>
          </li>
        </ul>
      </div>

      {/* Footer Links */}
      <div className="space-y-2 pt-2">
        <Link
          href="/guide"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          如何获取 API 密钥？
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <br />
        <Link
          href="/disclaimer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:underline mt-2"
        >
          免责声明
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
