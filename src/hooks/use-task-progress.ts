import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useTaskStore, useUploadStore } from "@/stores";
import { getTaskResults } from "@/lib/api/tasks";

const TICK_MS = 500;
const STEP = 12;

/**
 * 工作台生成进度模拟器。
 *
 * 当 phase === "processing" 且存在 taskId 时，启动一个 500ms 的轮询定时器，
 * 每次推进进度（+12），并按比例推进 success / currentItem，通过 setProgress 写回 store。
 * 进度达到 100% 后清掉定时器，拉取 getTaskResults(taskId) 并调用 finishProcessing。
 *
 * 通过 startedRef 保证同一个 taskId 只会启动一次定时器；
 * 回到 idle 时重置标记，允许新任务再次启动。
 */
export function useTaskProgress() {
  const { phase, taskId, setProgress, finishProcessing } = useTaskStore(
    useShallow((s) => ({
      phase: s.phase,
      taskId: s.taskId,
      setProgress: s.setProgress,
      finishProcessing: s.finishProcessing,
    })),
  );

  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "processing" || taskId == null) return;
    // 同一个 taskId 只启动一次
    if (startedRef.current === taskId) return;
    startedRef.current = taskId;

    const initial = useTaskStore.getState().progress;
    const uploadCount = useUploadStore.getState().count();
    const total =
      initial && initial.total > 0
        ? initial.total
        : Math.max(1, uploadCount || 3);

    let currentProgress = initial?.progress ?? 0;
    let currentSuccess = initial?.success ?? 0;

    const interval = setInterval(() => {
      currentProgress = Math.min(100, currentProgress + STEP);
      currentSuccess = Math.min(
        total,
        Math.floor((currentProgress / 100) * total),
      );
      const currentItem = Math.min(total, currentSuccess);

      setProgress({
        status: "PROCESSING",
        total,
        success: currentSuccess,
        failed: 0,
        currentItem,
        progress: currentProgress,
      });

      if (currentProgress >= 100) {
        clearInterval(interval);
        getTaskResults(taskId)
          .then((results) => finishProcessing(results))
          .catch(() => {
            // 拉取结果失败时也结束流程，避免卡在生成中
            finishProcessing([]);
          });
      }
    }, TICK_MS);

    return () => {
      clearInterval(interval);
      // 允许同一 taskId 在 cleanup 后重新启动（StrictMode 重挂载 / 组件复用），
      // 同时仍能防止单次 effect 运行内重复启动。
      startedRef.current = null;
    };
  }, [phase, taskId, setProgress, finishProcessing]);
}
