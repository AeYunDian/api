import { ref } from "vue";
import { Snackbar, Dialog } from "@varlet/ui";
import { getFeedbackList, deleteFeedback } from "@/console/utils/api";

export function useFeedbackList() {
  const loading = ref(false);
  const refreshState = ref(false);
  const feedbacks = ref([]);
  const selectedStatus = ref("all");
  const counts = ref({ total: 0, pending: 0 });

  async function loadFeedbacks() {
    loading.value = true;
    try {
      const status = selectedStatus.value === "all" ? "" : selectedStatus.value;
      const data = await getFeedbackList(status);
      feedbacks.value = data.feedbacks || [];
    } catch (error) {
      Snackbar.error(error.message || "加载反馈列表失败");
    } finally {
      loading.value = false;
    }
  }

  async function fetchCounts() {
    try {
      const data = await getFeedbackList();
      const list = data.feedbacks || [];
      counts.value = {
        total: list.length,
        pending: list.filter(
          (f) => f.status === "pending" || f.status === "processing",
        ).length,
      };
    } catch (error) {
      console.error("获取反馈计数失败", error);
      Snackbar.error("获取反馈计数失败");
    }
  }

  async function handleDelete(feedbackId) {
    const action = await Dialog({
      title: "确认删除",
      message: "确定要删除这条反馈吗？",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消",
    });
    if (action !== "confirm") return;
    try {
      await deleteFeedback(feedbackId);
      Snackbar.success("已删除");
      await loadFeedbacks();
      await fetchCounts();
    } catch (error) {
      Snackbar.error(error.message || "删除失败");
    }
  }

  async function onPullRefresh() {
    try {
      await loadFeedbacks();
      await fetchCounts();
    } catch (error) {
      Snackbar.error(error.message || "刷新失败");
    } finally {
      refreshState.value = false;
    }
  }

  return {
    loading,
    refreshState,
    feedbacks,
    selectedStatus,
    counts,
    loadFeedbacks,
    fetchCounts,
    handleDelete,
    onPullRefresh,
  };
}
