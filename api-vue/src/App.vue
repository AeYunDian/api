<template>
  <main>
    <RouterView style="width: 100%;" />
  </main>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
}

#app {
  display: flex;
  flex-direction: column;
}

.vt-icon {
  margin-inline-end: 0.25em;
}

.vt-icon:not(i) {
  vertical-align: var(--icon-vertical-align, -0.125em);
}
</style>
