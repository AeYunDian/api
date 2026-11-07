let geetestLogoObserver = null;

export function removeUselessTestLogo() {
    if (geetestLogoObserver) return;
    geetestLogoObserver = new MutationObserver(() => {
        const nodes = document.querySelectorAll(
            ".geetest_box_logo, .geetest_feedback",
        );
        if (!nodes.length) return;
        nodes.forEach((el) => {
            el.style.display = "none";
        });
        geetestLogoObserver.disconnect();
        geetestLogoObserver = null;
    });
    geetestLogoObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
