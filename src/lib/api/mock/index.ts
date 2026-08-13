import MockAdapter from "axios-mock-adapter";
import { http } from "../http";
import {
  mockAdminTasks,
  mockAdminUser,
  mockAdminUsers,
  mockCurrentUser,
  mockDashboard,
  mockHistoryImages,
  mockStyles,
} from "./data";
import type {
  Task,
  TaskItem,
  TaskItemStatus,
  TaskResultImage,
} from "@/types";

// 仅在 NEXT_PUBLIC_USE_MOCK=true 时注册 mock
if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
  const mock = new MockAdapter(http, { delayResponse: 300 });

  // --- 公共只读 ---
  mock.onGet(/\/styles$/).reply(200, mockStyles);

  mock.onGet(/\/history\/images$/).reply(200, {
    list: mockHistoryImages,
    total: mockHistoryImages.length,
    page: 1,
    size: 50,
  });

  mock.onGet(/\/users\/me$/).reply(200, mockCurrentUser);

  // --- 任务相关 ---
  mock.onGet(/\/tasks\/current$/).reply(200, null);

  mock.onGet(/\/tasks\/\d+\/results$/).reply((): [number, TaskResultImage[]] => {
    const results: TaskResultImage[] = mockStyles.slice(0, 3).map((s, i) => ({
      id: i + 1,
      seq: i + 1,
      fileKey: `results/${s.id}/${i + 1}.jpg`,
      previewUrl: s.coverUrl,
      fileName: `IMG_${String(i + 1).padStart(4, "0")}.jpg`,
    }));
    return [200, results];
  });

  mock.onGet(/\/tasks\/\d+$/).reply((config) => {
    const idMatch = config.url?.match(/\/tasks\/(\d+)/);
    const id = idMatch ? parseInt(idMatch[1], 10) : 1;
    const count = Number(
      config.params?.imageCount ?? config.params?.count ?? 3,
    );
    const itemStatuses: TaskItemStatus[] = [
      "SUCCESS",
      "PROCESSING",
      "FAILED",
      "PENDING",
      "CANCELED",
    ];
    const items: TaskItem[] = Array.from({ length: count }, (_, i) => {
      const status =
        itemStatuses[Math.floor(Math.random() * itemStatuses.length)]!;
      return {
        id: id * 100 + i + 1,
        taskId: id,
        seq: i + 1,
        status,
        retryCount: 0,
      };
    });
    const success = items.filter((i) => i.status === "SUCCESS").length;
    const failed = items.filter((i) => i.status === "FAILED").length;
    const hasProcessing = items.some(
      (i) => i.status === "PROCESSING" || i.status === "PENDING",
    );
    const taskStatus: Task["status"] = hasProcessing
      ? "PROCESSING"
      : failed === count
        ? "FAILED"
        : "SUCCESS";
    const task: Task = {
      id,
      taskNo: `T${Date.now()}`,
      userId: 1,
      styleId: 1,
      styleName: "油画",
      imageCount: count,
      status: taskStatus,
      successCount: success,
      failCount: failed,
      createdAt: new Date().toISOString(),
      items,
    };
    return [200, task];
  });

  // --- Admin 只读 ---
  mock.onGet(/\/admin\/users$/).reply(200, {
    list: mockAdminUsers,
    total: mockAdminUsers.length,
    page: 1,
    size: 20,
  });

  mock.onGet(/\/admin\/tasks$/).reply(200, {
    list: mockAdminTasks,
    total: mockAdminTasks.length,
    page: 1,
    size: 20,
  });

  mock.onGet(/\/admin\/dashboard$/).reply(200, mockDashboard);

  // --- Auth ---
  // 联调用：登录邮箱包含 "admin" 时返回管理员账号，可访问 /admin/*
  mock.onPost(/\/auth\/login$/).reply((config) => {
    const { email } = JSON.parse(config.data || "{}");
    const user =
      email && String(email).toLowerCase().includes("admin")
        ? mockAdminUser
        : mockCurrentUser;
    return [
      200,
      {
        accessToken: "mock-token",
        refreshToken: "mock-refresh",
        user,
      },
    ];
  });

  mock.onPost(/\/auth\/register$/).reply(200, {
    accessToken: "mock-token",
    refreshToken: "mock-refresh",
    user: mockCurrentUser,
  });

  mock.onPost(/\/auth\/send-code$/).reply(200, { expireIn: 600 });

  mock.onPost(/\/auth\/logout$/).reply(200);

  // --- 图片上传 ---
  mock.onPost(/\/images\/upload$/).reply(() => [
    200,
    {
      fileKey: `temp/mock/${Date.now()}.jpg`,
      previewUrl: "/style-cover-oil.jpg",
    },
  ]);

  // --- 创建任务 ---
  mock.onPost(/\/tasks$/).reply(() => [
    200,
    {
      taskId: 20001,
      taskNo: `T${Date.now()}`,
      status: "PENDING",
    },
  ]);

  // --- 历史写操作 ---
  mock.onDelete(/\/history\/images\/\d+$/).reply(200);
  mock.onPost(/\/history\/images\/batch-delete$/).reply(200);

  // --- 用户修改密码 ---
  mock.onPut(/\/users\/me\/password$/).reply(200);

  // --- Admin 写操作（兜底 200） ---
  mock.onPost(/\/admin\//).reply(200);
  mock.onPut(/\/admin\//).reply(200);

  // --- 未匹配请求 passThrough，避免阻断 ---
  mock.onAny().passThrough();
}
