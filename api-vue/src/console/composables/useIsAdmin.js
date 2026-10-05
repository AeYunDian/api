import { inject, computed } from "vue";

export function useIsAdmin() {
  const user = inject("user");
  return computed(() => user?.value?.sub === 1);
}
