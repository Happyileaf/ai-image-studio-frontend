"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ---------- helpers ---------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-foreground">{label}</Label>
      {children}
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SettingsCard({
  title,
  description,
  onSave,
  children,
}: {
  title: string;
  description: string;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4" />
          保存
        </Button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminSettingsPage() {
  const { toast } = useToast();

  // AI 模型
  const [defaultModel, setDefaultModel] = useState("stable-diffusion-xl");
  const [concurrency, setConcurrency] = useState(4);
  const [singleTimeout, setSingleTimeout] = useState(60);
  const [gpuQueueLimit, setGpuQueueLimit] = useState(16);

  // 用户与额度
  const [initialQuota, setInitialQuota] = useState(50);
  const [dailyFreeQuota, setDailyFreeQuota] = useState(10);
  const [planConfig, setPlanConfig] = useState(
    "免费版=50, 专业版=2000, 团队版=10000",
  );
  const [quotaExpireDays, setQuotaExpireDays] = useState(30);

  // 文件与存储
  const [maxImageSize, setMaxImageSize] = useState(10);
  const [historyRetentionDays, setHistoryRetentionDays] = useState(7);
  const [minioBucket, setMinioBucket] = useState("ai-image-studio");
  const [cdnDomain, setCdnDomain] = useState("cdn.studio.local");

  // 邮件与限流
  const [smtpServer, setSmtpServer] = useState("smtp.example.com");
  const [senderEmail, setSenderEmail] = useState("noreply@studio.local");
  const [codeTtl, setCodeTtl] = useState(600);
  const [rateLimitPerMin, setRateLimitPerMin] = useState(5);

  const handleSave = () => {
    toast({ title: "设置已保存" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">系统配置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理 AI 模型、用户额度、文件存储与邮件限流等全局参数，修改后点击对应卡片的保存按钮生效。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. AI 模型 */}
        <SettingsCard
          title="AI 模型"
          description="推理模型与并发、超时等运行参数"
          onSave={handleSave}
        >
          <Field label="默认模型">
            <Input
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="stable-diffusion-xl"
            />
          </Field>
          <Field label="并发数" hint="同时处理的任务数">
            <Input
              type="number"
              min={1}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
            />
          </Field>
          <Field label="单图超时(秒)">
            <Input
              type="number"
              min={1}
              value={singleTimeout}
              onChange={(e) => setSingleTimeout(Number(e.target.value))}
            />
          </Field>
          <Field label="GPU 队列上限">
            <Input
              type="number"
              min={1}
              value={gpuQueueLimit}
              onChange={(e) => setGpuQueueLimit(Number(e.target.value))}
            />
          </Field>
        </SettingsCard>

        {/* 2. 用户与额度 */}
        <SettingsCard
          title="用户与额度"
          description="新用户额度、每日免费额度与套餐配置"
          onSave={handleSave}
        >
          <Field label="新用户初始额度">
            <Input
              type="number"
              min={0}
              value={initialQuota}
              onChange={(e) => setInitialQuota(Number(e.target.value))}
            />
          </Field>
          <Field label="每日免费额度">
            <Input
              type="number"
              min={0}
              value={dailyFreeQuota}
              onChange={(e) => setDailyFreeQuota(Number(e.target.value))}
            />
          </Field>
          <Field
            label="套餐配置"
            hint="格式：套餐名=额度，多个用英文逗号分隔"
          >
            <textarea
              value={planConfig}
              onChange={(e) => setPlanConfig(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="免费版=50, 专业版=2000, 团队版=10000"
            />
          </Field>
          <Field label="额度过期天数">
            <Input
              type="number"
              min={1}
              value={quotaExpireDays}
              onChange={(e) => setQuotaExpireDays(Number(e.target.value))}
            />
          </Field>
        </SettingsCard>

        {/* 3. 文件与存储 */}
        <SettingsCard
          title="文件与存储"
          description="上传限制、历史保留与对象存储配置"
          onSave={handleSave}
        >
          <Field label="单图大小上限(MB)">
            <Input
              type="number"
              min={1}
              value={maxImageSize}
              onChange={(e) => setMaxImageSize(Number(e.target.value))}
            />
          </Field>
          <Field label="历史保留天数">
            <Input
              type="number"
              min={1}
              value={historyRetentionDays}
              onChange={(e) => setHistoryRetentionDays(Number(e.target.value))}
            />
          </Field>
          <Field label="MinIO 桶名">
            <Input
              value={minioBucket}
              onChange={(e) => setMinioBucket(e.target.value)}
              placeholder="ai-image-studio"
            />
          </Field>
          <Field label="CDN 域名">
            <Input
              value={cdnDomain}
              onChange={(e) => setCdnDomain(e.target.value)}
              placeholder="cdn.studio.local"
            />
          </Field>
        </SettingsCard>

        {/* 4. 邮件与限流 */}
        <SettingsCard
          title="邮件与限流"
          description="SMTP 配置、验证码时效与接口限流"
          onSave={handleSave}
        >
          <Field label="SMTP 服务器">
            <Input
              value={smtpServer}
              onChange={(e) => setSmtpServer(e.target.value)}
              placeholder="smtp.example.com"
            />
          </Field>
          <Field label="发件邮箱">
            <Input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="noreply@studio.local"
            />
          </Field>
          <Field label="验证码有效时长(秒)">
            <Input
              type="number"
              min={1}
              value={codeTtl}
              onChange={(e) => setCodeTtl(Number(e.target.value))}
            />
          </Field>
          <Field label="每分钟限流(次)">
            <Input
              type="number"
              min={1}
              value={rateLimitPerMin}
              onChange={(e) => setRateLimitPerMin(Number(e.target.value))}
            />
          </Field>
        </SettingsCard>
      </div>
    </div>
  );
}
