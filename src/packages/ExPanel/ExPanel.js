let ExPanel_anchorParent = null;
let ExPanel_anchorNextSibling = null;

function initPkg_ExPanel() {
    initPkg_ExPanel_insertDom();

    let exPanelDOM = document.querySelector(`.ex-panel`);
    exPanelDOM.addEventListener(`mouseenter`, () => {
        clearTimeout(exPanelTimer);
    });
    exPanelDOM.addEventListener(`mouseleave`, () => {
        clearTimeout(exPanelTimer);
        exPanelTimer = setTimeout(autoCloseExPanelHandle, 800);
    });
    const closeBtn = exPanelDOM.querySelector(".ex-panel__close");
    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            hideExPanel();
        });
    }
}

function ExPanel_getGiftBarAnchor() {
    return document.querySelector(".PlayerToolbar-ContentCell .PlayerToolbar-Wealth")
        || document.querySelector(".PlayerToolbar-ContentRow");
}

function ExPanel_isGiftBarHidden() {
    const row = document.getElementsByClassName("PlayerToolbar-ContentRow")[0];
    const hidden = !!(row && row.style.visibility === "hidden");
    console.log("[ExPanel] isGiftBarHidden:", hidden, "| row exists:", !!row, "| style.visibility:", row && row.style.visibility);
    return hidden;
}

function ExPanel_getFloatingHost() {
    // Use document.body to avoid CSS transform on player container
    // breaking position:fixed (transform creates a new containing block)
    return document.body;
}

function ExPanel_saveAnchor(panel) {
    if (!ExPanel_anchorParent) {
        ExPanel_anchorParent = panel.parentNode;
        ExPanel_anchorNextSibling = panel.nextSibling;
    }
}

function ExPanel_updateFloatingPosition() {
    const panel = document.querySelector(".ex-panel.ex-panel--floating");
    console.log("[ExPanel] updateFloatingPosition | panel found:", !!panel);
    if (!panel) {
        return;
    }
    const playerToolbar = document.getElementById("js-player-toolbar");
    const vtoolbarMenu = document.getElementById("ex-vtoolbar-menu");
    console.log("[ExPanel] updateFloatingPosition | playerToolbar:", !!playerToolbar, "| vtoolbarMenu:", !!vtoolbarMenu);

    const gap = 8;
    panel.style.position = "fixed";
    panel.style.top = "auto";

    // Vertical: use vtoolbarMenu (actual bottom control bar) as reference,
    // fall back to playerToolbar, then hardcoded value
    if (vtoolbarMenu) {
        const menuRect = vtoolbarMenu.getBoundingClientRect();
        console.log("[ExPanel] updateFloatingPosition | menuRect.top:", menuRect.top);
        panel.style.bottom = `${window.innerHeight - menuRect.top + gap}px`;
    } else if (playerToolbar) {
        const toolbarRect = playerToolbar.getBoundingClientRect();
        console.log("[ExPanel] updateFloatingPosition | toolbarRect.top:", toolbarRect.top);
        panel.style.bottom = `${window.innerHeight - toolbarRect.top + gap}px`;
    } else {
        console.log("[ExPanel] updateFloatingPosition | FALLBACK: bottom=72px right=12px");
        panel.style.bottom = "72px";
        panel.style.right = "12px";
        panel.style.left = "";
        return;
    }
    console.log("[ExPanel] updateFloatingPosition | innerHeight:", window.innerHeight, "| set bottom:", panel.style.bottom);

    // Horizontal: center on vtoolbarMenu if available, otherwise on toolbar
    if (vtoolbarMenu) {
        const menuRect = vtoolbarMenu.getBoundingClientRect();
        const panelWidth = panel.offsetWidth || panel.scrollWidth || 320;
        let left = menuRect.left + menuRect.width / 2 - panelWidth / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
        panel.style.left = `${left}px`;
        panel.style.right = "auto";
        console.log("[ExPanel] updateFloatingPosition | vtoolbarMenu mode | left:", left, "| panelWidth:", panelWidth);
    } else {
        const toolbarRect = playerToolbar.getBoundingClientRect();
        const panelWidth = panel.offsetWidth || panel.scrollWidth || 320;
        let left = toolbarRect.left + toolbarRect.width / 2 - panelWidth / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));
        panel.style.left = `${left}px`;
        panel.style.right = "auto";
        console.log("[ExPanel] updateFloatingPosition | toolbar mode | left:", left, "| panelWidth:", panelWidth);
    }
}

function ExPanel_attachToFloatingHost() {
    const panel = document.querySelector(".ex-panel");
    console.log("[ExPanel] attachToFloatingHost | panel:", !!panel, "| already floating:", panel && panel.classList.contains("ex-panel--floating"), "| display:", panel && panel.style.display);
    if (!panel || panel.classList.contains("ex-panel--floating")) {
        ExPanel_updateFloatingPosition();
        return;
    }
    console.log("[ExPanel] attachToFloatingHost | moving panel to floating host");
    ExPanel_saveAnchor(panel);
    ExPanel_getFloatingHost().appendChild(panel);
    panel.classList.add("ex-panel--floating");
    ExPanel_updateFloatingPosition();
}

function ExPanel_restoreToGiftBar() {
    const panel = document.querySelector(".ex-panel");
    const anchor = ExPanel_getGiftBarAnchor();
    if (!panel || !anchor || !panel.classList.contains("ex-panel--floating")) {
        return;
    }
    if (ExPanel_anchorNextSibling && ExPanel_anchorNextSibling.parentNode === anchor) {
        anchor.insertBefore(panel, ExPanel_anchorNextSibling);
    } else {
        anchor.insertBefore(panel, anchor.childNodes[0]);
    }
    panel.classList.remove("ex-panel--floating");
    // Reset floating inline styles, restore gift-bar positioning
    panel.style.position = "";
    panel.style.top = "";
    panel.style.left = "";
    panel.style.right = "";
    const domPlayerToolbar = document.querySelector(".PlayerToolbar");
    panel.style.bottom = domPlayerToolbar ? domPlayerToolbar.offsetHeight + "px" : "76px";
}

function ExPanel_syncHost() {
    if (ExPanel_isGiftBarHidden()) {
        ExPanel_attachToFloatingHost();
    } else {
        ExPanel_restoreToGiftBar();
    }
}

function ExPanel_onGiftBarHide() {
    const panel = document.querySelector(".ex-panel");
    if (panel && panel.style.display === "block") {
        ExPanel_attachToFloatingHost();
        ExPanel_updateFloatingPosition();
    }
}

function ExPanel_onGiftBarShow() {
    ExPanel_restoreToGiftBar();
}

function initPkg_ExPanel_insertDom() {
	let a = document.createElement("div");
	a.className = "ex-panel";
	a.innerHTML = `<button type="button" class="ex-panel__close" title="关闭工具条" aria-label="关闭 DouyuEx 工具条">×</button><div class="ex-panel__wrap"></div>`;
	
    let b = ExPanel_getGiftBarAnchor();
    if (!b) {
        b = ExPanel_getFloatingHost();
        a.classList.add("ex-panel--floating");
    } else {
        const domPlayerToolbar = document.querySelector(".PlayerToolbar");
        if (domPlayerToolbar) {
            a.style.bottom = domPlayerToolbar.offsetHeight + "px";
        } else {
            a.style.bottom = "76px";
        }
    }
    b.insertBefore(a, b.childNodes[0]);
    ExPanel_saveAnchor(a);
    if (ExPanel_isGiftBarHidden()) {
        ExPanel_attachToFloatingHost();
    }
}

function hideExPanel() {
    const exPanelDOM = document.querySelector(".ex-panel");
    if (!exPanelDOM) {
        return;
    }
    clearTimeout(exPanelTimer);
    exPanelTimer = null;
    exPanelDOM.style.display = "none";
}

function autoCloseExPanelHandle() {
    hideExPanel();
}

function showExPanel() {
	let a = document.getElementsByClassName("ex-panel")[0];
    if (!a) {
        return;
    }
    console.log("[ExPanel] showExPanel | current display:", a.style.display, "| is floating:", a.classList.contains("ex-panel--floating"), "| parent:", a.parentNode && (a.parentNode.id || a.parentNode.className));
    ExPanel_syncHost();
    console.log("[ExPanel] showExPanel after syncHost | display:", a.style.display, "| is floating:", a.classList.contains("ex-panel--floating"), "| parent:", a.parentNode && (a.parentNode.id || a.parentNode.className));
	if (a.style.display !== 'block') {
        a.style.display = 'block';
        clearTimeout(exPanelTimer);
        if (a.classList.contains("ex-panel--floating")) {
            ExPanel_updateFloatingPosition();
        }
    } else {
        a.style.display = 'none';
        clearTimeout(exPanelTimer);
    }
}