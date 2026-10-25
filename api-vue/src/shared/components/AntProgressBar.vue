<template>
    <div class="ant-progress" role="progressbar">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
    </div>
</template>
<style lang="css" scoped>
.ant-progress {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    overflow: hidden;
}

.ant-progress>div {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: #0067b8;
    opacity: 0;
    animation: progressDot 2s infinite;
}

.ant-progress>div:nth-child(1) {
    animation-delay: 0.05s;
}

.ant-progress>div:nth-child(2) {
    animation-delay: 0.2s;
}

.ant-progress>div:nth-child(3) {
    animation-delay: 0.35s;
}

.ant-progress>div:nth-child(4) {
    animation-delay: 0.5s;
}

.ant-progress>div:nth-child(5) {
    animation-delay: 0.65s;
}

@keyframes progressDot {

    0%,
    20% {
        left: 0;
        opacity: 0;
        animation-timing-function: ease-out;
    }

    25% {
        opacity: 1;
    }

    35% {
        left: 45%;
        animation-timing-function: linear;
    }

    65% {
        left: 60%;
        animation-timing-function: ease-in;
    }

    75% {
        opacity: 1;
    }

    80%,
    100% {
        left: 100%;
        opacity: 0;
    }
}
</style>