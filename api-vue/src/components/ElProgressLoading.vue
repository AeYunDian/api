<template>
  <div class="loading-progress">
    <el-progress :percentage="100" :indeterminate="true" :duration="1" />
  </div>
</template>

<style scoped>
.loading-progress .el-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
</style>
