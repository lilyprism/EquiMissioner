// ==UserScript==
// @name         EquiMissioner
// @namespace    https://github.com/lilyprism/EquiMissioner
// @version      0.1
// @description  Best OpenSource Hero Zero Utility Extension
// @author       LilyPrism
// @match        https://*.herozerogame.com
// @icon         https://github.com/lilyprism/EquiMissioner/blob/main/equimissioner.jpg?raw=true
// @require      https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js
// @resource     IMPORTED_CSS https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const bs5css = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(bs5css);

    const MissionFocus = Object.freeze({
        XP: 'XP',
        COINS: 'COINS',
        COMBAT: 'COMBAT',
        TIME: 'TIME',
        MIN_ENERGY: 'MIN_ENERGY',
        HC: 'HC',
        EVENT_ITEM: 'EVENT_ITEM',
        SLOTMACHINE: 'SLOTMACHINE'
    });

    const QuestStages = Object.freeze({
        '1': "At Home in Humphreydale",
        '2': "Dirty Downtown",
        '3': "Center of Granbury",
        '4': "State Capitol",
        '5': "Switzerland",
        '6': "The Big Crumble",
        '7': "Yoyo Island",
        '8': "Gamble City",
        '9': "Sillycon Valley",
        '10': "Paris",
        '11': "Yollywood",
        '12': "Australia",
        '13': "Yokio",
        '14': "The Golden Desert"
    });

    let currentQuests = [];
    let currentMissionFocus = GM_getValue("mission-focus", MissionFocus.XP);
    let currentFPS = GM_getValue("fps", 30);
    const MAX_ENERGY_PER_QUEST = 20;

    function createScriptUI() {
        const mainDiv = document.createElement('div');
        mainDiv.id = "missioner";
        mainDiv.className = "fixed-top";
        mainDiv.innerHTML = `
            <div style="z-index: 1050">
                <button class="btn btn-primary position-absolute" style="z-index: 1050;padding: var(--bs-btn-padding-y) var(--bs-btn-padding-x)!important;" type="button" data-bs-toggle="collapse" data-bs-target="#missioner-cont" aria-expanded="false" aria-controls="missioner-cont">
                    M
                </button>
                <div class="position-absolute top-0" style="height: 100vh;background: #262626cc">
                    <div class="collapse collapse-horizontal" id="missioner-cont">
                        <div class="pt-5 px-5" style="width: 300px;">
                            <div class="card text-bg-dark mb-2">
                                <div class="card-body">
                                    <h5 class="card-title">Best Mission</h5>
                                    <p id="m-city" class="mb-0 card-text">City</p>
                                    <p id="m-xp" class="mb-0 card-text">XP: 0</p>
                                    <p id="m-coins" class="mb-0 card-text">Coins: 0</p>
                                    <p id="m-duration" class="mb-2 card-text">Duration: 0</p>
                                    <select class="form-select mb-2" id="quest-focus">
                                        <option value="XP">XP / Energy</option>
                                        <option value="COINS">Coins / Energy</option>
                                        <option value="COMBAT">Fighting Quests</option>
                                        <option value="TIME">Time Quests</option>
                                        <option value="MIN_ENERGY">Minimum Energy</option>
                                        <option value="HC">HeroCon Items</option>
                                        <option value="EVENT_ITEM">Event Items</option>
                                        <option value="SLOTMACHINE">Slotmachine Jetons</option>
                                    </select>
                                    <button id="mission-go" class="btn btn-success w-100" style="padding: var(--bs-btn-padding-y) var(--bs-btn-padding-x)!important;" type="button">Go</button>
                                </div>
                            </div>
                            <div class="card text-bg-dark">
                                <div class="card-body">
                                    <h5 class="card-title">FPS Unlock</h5>
                                    <label for="fps-input" class="form-label" id="fps-input-label">Current FPS: ${currentFPS}</label>
                                    <input type="range" class="form-range" min="30" max="160" step="10" id="fps-input" value="${currentFPS}">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(mainDiv);

        document.getElementById('quest-focus').value = currentMissionFocus;
        document.getElementById("fps-input").addEventListener("input", updateFPS);
        document.getElementById("mission-go").addEventListener("click", executeBestMission);
        document.getElementById("quest-focus").addEventListener("change", updateMissionFocus);
    }

    function updateMissionFocus(event) {
        currentMissionFocus = event.target.value;
        GM_setValue("mission-focus", currentMissionFocus);
        updateUIWithBestQuest(getBestQuest());
    }

    function updateFPS(event) {
        currentFPS = event.target.value;
        GM_setValue("fps", currentFPS);
        document.getElementById("fps-input-label").textContent = "Current FPS: " + currentFPS;
        setFPS();
    }

    function executeBestMission() {
        const bestQuest = getBestQuest();
        if (!bestQuest) return;

        unsafeWindow.stage.setStage(bestQuest.stage);

        setTimeout(() => {
            const questButtons = [
                unsafeWindow.quest._btnQuest1,
                unsafeWindow.quest._btnQuest2,
                unsafeWindow.quest._btnQuest3
            ];

            const targetButton = questButtons.find(button => button.get_tag()._data.id === bestQuest.id);
            if (targetButton) {
                unsafeWindow.quest.clickQuest(targetButton);
            } else {
                console.error("Failed to find quest");
            }
        }, 300);
    }

    function setFPS() {
        if (unsafeWindow.app && unsafeWindow.app.framePeriod) {
            unsafeWindow.app.framePeriod = Math.floor(1000 / currentFPS);
        }
    }

    function setupRequestProxy() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._method = method;
            this._url = url;
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (data) {
            const xhr = this;
            const originalOnReadyStateChange = xhr.onreadystatechange;

            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr._method === "POST" && xhr._url.includes("request.php")) {
                    if (xhr.responseText.includes("\"quests\":") && xhr.responseText.endsWith("\"error\":\"\"}")) {
                        const jsonResponse = JSON.parse(xhr.responseText);
                        if (Array.isArray(jsonResponse.data.quests)) {
                            handleQuestChange(jsonResponse.data.quests);
                        }
                    }
                }
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(xhr, arguments);
                }
            };
            return originalSend.apply(this, arguments);
        };
    }

    function handleQuestChange(quests) {
        currentQuests = quests.map(quest => ({ ...quest, rewards: JSON.parse(quest.rewards) }));
        updateUIWithBestQuest(getBestQuest());
    }

    function updateUIWithBestQuest(quest) {
        if (!quest) return;
        document.getElementById("m-city").textContent = QuestStages[quest.stage];
        document.getElementById("m-xp").textContent = "XP: " + (quest.rewards.xp || 0);
        document.getElementById("m-coins").textContent = "Coins: " + (quest.rewards.coins || 0);
        document.getElementById("m-duration").textContent = "Duration: " + (quest.duration / 60) + " Minutes";
    }

    function getBestQuest() {
        let availableQuests = [...currentQuests];

        if (availableQuests.length === 0) return null;

        availableQuests = sortQuestsByFocus(availableQuests);

        if (availableQuests.length > 0 && availableQuests[0].energy_cost > MAX_ENERGY_PER_QUEST) {
            availableQuests.sort((a, b) => a.energy_cost - b.energy_cost);
        }

        return availableQuests[0] || null;
    }

    function sortQuestsByFocus(quests) {
        switch (currentMissionFocus) {
            case MissionFocus.XP:
                return quests.sort((a, b) => (b.rewards.xp / b.energy_cost) - (a.rewards.xp / a.energy_cost));
            case MissionFocus.COINS:
                return quests.sort((a, b) => (b.rewards.coins / b.energy_cost) - (a.rewards.coins / a.energy_cost));
            case MissionFocus.COMBAT:
                return quests.filter(q => q.fight_difficulty !== 0).sort((a, b) => a.energy_cost - b.energy_cost);
            case MissionFocus.TIME:
                return quests.filter(q => q.fight_difficulty === 0).sort((a, b) => a.energy_cost - b.energy_cost);
            case MissionFocus.MIN_ENERGY:
                return quests.sort((a, b) => a.energy_cost - b.energy_cost);
            case MissionFocus.HC:
                return quests.sort((a, b) => b.rewards.hasOwnProperty("guild_competition_item") - a.rewards.hasOwnProperty("guild_competition_item") || a.energy_cost - b.energy_cost);
            case MissionFocus.EVENT_ITEM:
                return quests.sort((a, b) => b.rewards.hasOwnProperty("event_item") - a.rewards.hasOwnProperty("event_item") || a.energy_cost - b.energy_cost);
            case MissionFocus.SLOTMACHINE:
                return quests.sort((a, b) => b.rewards.hasOwnProperty("slotmachine_jetons") - a.rewards.hasOwnProperty("slotmachine_jetons") || a.energy_cost - b.energy_cost);
            default:
                return quests;
        }
    }

    function findScriptWithCode(targetCode) {
        return Array.from(document.querySelectorAll("script")).find(script => script.textContent.includes(targetCode)) || null;
    }

    document.addEventListener("DOMContentLoaded", () => {
        const embedScript = findScriptWithCode("function embedGame()");
        if (embedScript) embedScript.parentNode.removeChild(embedScript);

        const fixedEmbedCode = `
            var appWidth = 1120;
            var appHeight = 755;
            if (gameLoaded) {
                embedGame();
            }
            function embedGame() {
                let script = lime.$scripts["HeroZero.min"].toString();
                script = script.replace('this.gameDeviceCache', 'window.app=this;this.gameDeviceCache');
                script = script.replace('this._btnVideoAdvertisment=this._btnUseResource=this._btnSlotMachine', 'window.stage=this;this._btnVideoAdvertisment=this._btnUseResource=this._btnSlotMachine');
                script = script.replace('{this._leftSideButtons=null;', '{window.quest=this;this._leftSideButtons=null;');
                eval("window.lime_script = " + script);
                lime.$scripts["HeroZero.min"] = window.lime_script;
                lime.embed("HeroZero.min", "appClient", appWidth, appHeight, {
                    height: appHeight,
                    rootPath: "https://hz-static-2.akamaized.net/assets/html5",
                    parameters: clientVars
                });
                console.log("[Missioner] Game Fix Injected");
            }
        `;
        const fixScript = document.createElement("script");
        fixScript.textContent = fixedEmbedCode;
        document.head.appendChild(fixScript);

        createScriptUI();
        console.log("[Missioner] Setup complete!");
    });

    window.addEventListener("load", setFPS);

    setupRequestProxy();
})();
