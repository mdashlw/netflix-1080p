const debugEnabled = false;
const clickOverrideButton = true;
const hideMenu = true;

const log = debugEnabled ? console.log : null;

function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function maxbitrate_set() {
    log?.('[maxbitrate_set]')
    window.dispatchEvent(new KeyboardEvent('keydown', {
        keyCode: 83,
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
    }));

    const VIDEO_SELECT = getElementByXPath("//div[text()='Video Bitrate']");
    const AUDIO_SELECT = getElementByXPath("//div[text()='Audio Bitrate']");
    const BUTTON = getElementByXPath("//button[text()='Override']");

    if (!(VIDEO_SELECT && AUDIO_SELECT && BUTTON)){
        log?.('[maxbitrate_set] return(false) |', 'VIDEO_SELECT', VIDEO_SELECT, 'AUDIO_SELECT', AUDIO_SELECT, 'BUTTON', BUTTON)
        return false;
    }

    log?.('[maxbitrate_set]', 'VIDEO_SELECT', VIDEO_SELECT, 'AUDIO_SELECT', AUDIO_SELECT, 'BUTTON', BUTTON)

    let was_set = 0;

    [VIDEO_SELECT, AUDIO_SELECT].forEach(el => {
        let parent = el.parentElement;

        let options = parent.querySelectorAll('select > option');

        log?.('[maxbitrate_set]', 'el', el, 'options', options)

        for (let i = 0; i < options.length - 1; i++) {
            options[i].removeAttribute('selected');
        }

        if (options.length > 0) {
            options[options.length - 1].setAttribute('selected', 'selected');
            log?.('[maxbitrate_set]', 'el', el, 'selected option', options[options.length - 1])
            was_set += 1;
        }
    });

    log?.(`[maxbitrate_set]`, 'was_set', was_set)
    if (was_set != 2) return false;

    if (clickOverrideButton) {
        BUTTON.click();
    }

    if (document.querySelector('.player-loading-background-image')) {
        log?.('[maxbitrate_set] return(false); video is still loading')
        return false;
    }

    maxbitrate_finish();

    log?.('[maxbitrate_set] return(true)')
    return true;
}

function maxbitrate_run() {
    log?.("[maxbitrate_run]");
    if (!maxbitrate_set()) {
        log?.('[maxbitrate_run] maxbitrate_set was false; retrying in 100ms')
        setTimeout(maxbitrate_run, 100);
    }
}

function maxbitrate_start() {
    log?.('[maxbitrate_start]')
    const styleNode = document.createElement("style");
    styleNode.textContent = `
        .player-streams {
            display: none;
        }
    `;
    styleNode.id = "maxbitrate-hide-menu-style";

    if (hideMenu) {
        document.head.appendChild(styleNode);
    }

    maxbitrate_run();
}

function maxbitrate_finish() {
    log?.('[maxbitrate_finish]')
    const styleNode = document.querySelector("#maxbitrate-hide-menu-style");

    if (styleNode && hideMenu) {
        styleNode.parentNode.removeChild(styleNode);
    }
}

const WATCH_REGEXP = /netflix\.com\/watch\/.*/;

let oldLocation;

if(globalOptions.setMaxBitrate) {
    log?.("netflix_max_bitrate.js enabled");
    setInterval(function () {
        let newLocation = window.location.toString();

        if (newLocation !== oldLocation) {
            log?.("detected navigation");

            oldLocation = newLocation;
            if (WATCH_REGEXP.test(newLocation)) {
                maxbitrate_start();
            }
        }
    }, 500);
}
