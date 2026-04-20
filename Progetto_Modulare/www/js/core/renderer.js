// js/core/renderer.js
let _renderRequested = false;

export function forceUpdate() {
    _renderRequested = true;
}

export function consumeRenderFlag() {
    const val = _renderRequested;
    _renderRequested = false;
    return val;
}