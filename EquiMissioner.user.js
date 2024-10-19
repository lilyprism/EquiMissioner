// ==UserScript==
// @name         EquiMissioner
// @namespace    https://github.com/lilyprism/EquiMissioner
// @version      0.8
// @description  Best OpenSource Hero Zero Utility Extension
// @author       LilyPrism
// @license      GPL3.0
// @match        https://*.herozerogame.com
// @downloadURL  https://github.com/lilyprism/EquiMissioner/blob/main/EquiMissioner.user.js?raw=true
// @updateURL    https://github.com/lilyprism/EquiMissioner/blob/main/EquiMissioner.user.js?raw=true
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
        HEROBOOK: 'HEROBOOK_ITEM',
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
    let max_energy_per_quest = GM_getValue("max-energy-quest", 20);
    let auto_start_quest = GM_getValue("auto-start-quest", false);
    let auto_claim_quest = GM_getValue("quest-auto-claim", false);
    let auto_next_quest = GM_getValue("quest-auto-next", false);
    let quest_sense_booster_active = GM_getValue("sense-booster", false);
    let train_sense_booster_active = GM_getValue("train-sense-booster", false);

    function createScriptUI() {
        const mainDiv = document.createElement('div');
        mainDiv.id = "missioner";
        mainDiv.className = "fixed-top";
        mainDiv.innerHTML = `
            <div style="z-index: 1050">
                <button class="btn btn-primary position-absolute" style="z-index: 1050;" type="button" data-bs-toggle="collapse" data-bs-target="#missioner-cont" aria-expanded="false" aria-controls="missioner-cont">
                    <img src="https://github.com/lilyprism/EquiMissioner/blob/main/equimissioner.jpg?raw=true" alt="M" style="width: 32px;">
                </button>
                <div class="position-absolute top-0" style="height: 100vh;background: #262626cc;overflow-y: auto">
                    <div class="collapse collapse-horizontal" id="missioner-cont">
                        <div class="pt-5 px-3" style="width: 300px;">
                            <div class="card text-bg-dark mb-2">
                                <div class="card-body">
                                    <h5 class="card-title">Best Mission</h5>
                                    <p id="m-city" class="mb-0 card-text">City</p>
                                    <p id="m-xp" class="mb-0 card-text">XP: 0</p>
                                    <p id="m-coins" class="mb-0 card-text">Coins: 0</p>
                                    <p id="m-duration" class="mb-2 card-text">Duration: 0</p>
                                    <label class="form-label">Max Energy:</label>
                                    <input type="number" class="form-control mb-2" id="max-energy-quest" min="1" max="50" value="${max_energy_per_quest}">
                                    <label class="form-label">Quest Focus:</label>
                                    <select class="form-select mb-2" id="quest-focus">
                                        <option value="XP">XP / Energy</option>
                                        <option value="COINS">Coins / Energy</option>
                                        <option value="COMBAT">Fighting Quests</option>
                                        <option value="TIME">Time Quests</option>
                                        <option value="MIN_ENERGY">Minimum Energy</option>
                                        <option value="HC">HeroCon Items</option>
                                        <option value="HEROBOOK_ITEM">Herobook Items</option>
                                        <option value="EVENT_ITEM">Event Items</option>
                                        <option value="SLOTMACHINE">Slotmachine Jetons</option>
                                    </select>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="quest-auto-start">
                                        <label class="form-check-label" for="quest-auto-start">Start Quest on Go</label>
                                    </div>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="quest-auto-claim">
                                        <label class="form-check-label" for="quest-auto-claim">Auto Claim Quest Rewards</label>
                                    </div>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="quest-auto-next">
                                        <label class="form-check-label" for="quest-auto-next">Start Next After Claim</label>
                                    </div>
                                    <button id="mission-go" class="btn btn-success w-100" style="padding: var(--bs-btn-padding-y) var(--bs-btn-padding-x)!important;" type="button">Go</button>
                                </div>
                            </div>
                            <div class="card text-bg-dark mb-2">
                                <div class="card-body">
                                    <h5 class="card-title">FPS Unlock</h5>
                                    <label for="fps-input" class="form-label" id="fps-input-label">Current FPS: ${currentFPS}</label>
                                    <input type="range" class="form-range" min="30" max="160" step="10" id="fps-input" value="${currentFPS}">
                                </div>
                            </div>
                            <div class="card text-bg-dark">
                                <div class="card-body">
                                    <h5 class="card-title">Exploits</h5>

                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="quest-sense-booster">
                                        <label class="form-check-label" for="quest-sense-booster">Quest Sense Booster</label>
                                    </div>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="train-sense-booster">
                                        <label class="form-check-label" for="train-sense-booster">Train Sense Booster</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(mainDiv);

        document.getElementById('quest-focus').value = currentMissionFocus;
        document.getElementById('quest-sense-booster').checked = quest_sense_booster_active;
        document.getElementById('train-sense-booster').checked = train_sense_booster_active;
        document.getElementById('quest-auto-start').checked = auto_start_quest;
        document.getElementById('quest-auto-claim').checked = auto_claim_quest;
        document.getElementById('quest-auto-next').checked = auto_next_quest;
        document.getElementById("fps-input").addEventListener("input", updateFPS);
        document.getElementById("mission-go").addEventListener("click", executeBestMission);
        document.getElementById("quest-focus").addEventListener("change", updateMissionFocus);
        document.getElementById("max-energy-quest").addEventListener("change", updateMaxEnergyQuest);
        document.getElementById("quest-sense-booster").addEventListener("change", updateQuestSenseBooster);
        document.getElementById("train-sense-booster").addEventListener("change", updateTrainSenseBooster);
        document.getElementById("quest-auto-start").addEventListener("change", updateAutoStartQuest);
        document.getElementById("quest-auto-claim").addEventListener("change", updateAutoClaimQuest);
        document.getElementById("quest-auto-next").addEventListener("change", updateAutoNextQuest);
    }

    function updateAutoNextQuest(value) {
        auto_next_quest = value.target.checked;
        GM_setValue("quest-auto-next", auto_next_quest);
    }

    function updateAutoClaimQuest(value) {
        auto_claim_quest = value.target.checked;
        GM_setValue("quest-auto-claim", auto_claim_quest);
    }

    function updateAutoStartQuest(value) {
        auto_start_quest = value.target.checked;
        GM_setValue("auto-start-quest", auto_start_quest);
    }

    function updateTrainSenseBooster(value) {
        train_sense_booster_active = value.target.checked;
        GM_setValue("train-sense-booster", train_sense_booster_active);
    }

    function updateQuestSenseBooster(value) {
        quest_sense_booster_active = value.target.checked;
        GM_setValue("sense-booster", quest_sense_booster_active);
    }

    function updateMaxEnergyQuest(value) {
        max_energy_per_quest = value.target.value;
        GM_setValue("max-energy-quest", max_energy_per_quest);
        updateUIWithBestQuest(getBestQuest());
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

                setTimeout(() => {
                    if (auto_start_quest && unsafeWindow.dialog_quest) {
                        unsafeWindow.dialog_quest.onClickStartQuest();
                    }
                }, 200)
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

    setInterval(function() {
        if (!unsafeWindow.quest || !unsafeWindow.quest._btnSenseBooster)
            return;

        if (unsafeWindow.quest._btnSenseBooster.get_visible() === quest_sense_booster_active) {
            unsafeWindow.quest._btnSenseBooster.set_visible(!quest_sense_booster_active);
            unsafeWindow.quest._btnMostXPQuest.set_visible(quest_sense_booster_active);
            unsafeWindow.quest._btnMostGameCurrencyQuest.set_visible(quest_sense_booster_active);
        }
    }, 200);

    setInterval(function() {
        if (!unsafeWindow.train || !unsafeWindow.train._btnTrainingSenseBooster)
            return;

        if (unsafeWindow.train._btnTrainingSenseBooster.get_visible() === train_sense_booster_active) {
            unsafeWindow.train._btnTrainingSenseBooster.set_visible(!train_sense_booster_active);
            unsafeWindow.train._btnMostGameCurrencyTrainingQuest.set_visible(train_sense_booster_active);
            unsafeWindow.train._btnMostTrainingProgressTrainingQuest.set_visible(train_sense_booster_active);
            unsafeWindow.train._btnMostXPTrainingQuest.set_visible(train_sense_booster_active);
        }
    }, 200);

    setInterval(function() {
        if (!auto_claim_quest || !unsafeWindow.quest_complete || !unsafeWindow.quest_complete._btnClose)
            return;

        unsafeWindow.quest_complete.onClickClose();

        if (!auto_next_quest)
            return;

        setTimeout(function() {
            executeBestMission();
        }, 1000);
    }, 2000);

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
        currentQuests = quests.map(quest => ({...quest, rewards: JSON.parse(quest.rewards)}));
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

        if (availableQuests.length > 0 && availableQuests[0].energy_cost > max_energy_per_quest) {
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
            case MissionFocus.HEROBOOK:
                return quests.sort((a, b) => b.rewards.hasOwnProperty("herobook_item_epic") - a.rewards.hasOwnProperty("herobook_item_epic") || a.energy_cost - b.energy_cost);
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
                script = script.replace('this._timer=this._tooltipProgressStar1', 'window.train=this;this._timer=this._tooltipProgressStar1');
                script = script.replace('this._btnClose=this._btnStartQuest=this._b', 'window.dialog_quest=this;this._btnClose=this._btnStartQuest=this._b');
                script = script.replace('this._quest.get_isTimeQuest()', 'window.quest_complete=this;this._quest.get_isTimeQuest()');
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
