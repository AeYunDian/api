export const FEEDBACK_STATUS_OPTIONS = [
  { label: "待处理", value: "pending" },
  { label: "处理中", value: "processing" },
  { label: "已解决", value: "resolved" },
  { label: "已关闭", value: "closed" },
];

const STATUS_LABEL = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  closed: "已关闭",
};

const STATUS_TYPE = {
  pending: "warning",
  processing: "info",
  resolved: "success",
  closed: "default",
};

export const getStatusLabel = (status) => STATUS_LABEL[status] || status;
export const getStatusType = (status) => STATUS_TYPE[status] || "default";
