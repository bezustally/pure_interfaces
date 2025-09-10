//

// ==UserScript==

// @name                 Aflt Atlassian Products Extra Features

// @license              CC BY-NC-ND 4.0. Usage, modification and distribution are permitted only with the author's attribution and without commercial use. Any modifications without the author's consent are prohibited. Использование, изменение и распространение разрешены только с указанием авторства и без коммерческого использования. Запрещены любые модификации без согласия автора.

// @namespace            https://github.com/bezustally/pure_interfaces
// @updateURL            https://github.com/bezustally/pure_interfaces/raw/main/aflt-systems.ru.user.js
// @downloadURL          https://github.com/bezustally/pure_interfaces/raw/main/aflt-systems.ru.user.js

// @match                *://*.aflt-systems.ru/*

// @run-at               document-end

// @author               bezustally

// @version              4.1
// @updated              2025-01-27

// ==/UserScript==

//

// === Open issues in new tab ===
setTimeout(() => {
	document.querySelectorAll(".issue-link, #ghx-issues-in-epic-table .ghx-minimal a").forEach(link => {
		link.addEventListener("click", e => {
			e.preventDefault();
			window.open(link.href);
		});
	});

	try {
		document.querySelector("#rte-ellipsis-menu").removeAttribute("tabindex");
	} catch (error) {}
}, 3000);

// === Styles for quick time logging buttons ===
(function injectAfltTimeSpentStyles() {
	const style = document.createElement("style");
	style.textContent = `

		.aflt-timespent-buttons {
			margin-top: 9px;
			display: flex;
			flex-wrap: wrap;
			gap: 3px;
			row-gap: 8px;
		}

		.aflt-timespent-btn {
			background-color: var(--aui-badge-primary-bg-color);
			margin-right: 4px;
			border-radius: 7px;
			color: white;
			font-weight: bold;
			border: none;
			padding: 8px;
			cursor: pointer;
			transition: background-color 0.2s;
		}

		.aflt-timespent-btn:last-child {
			margin-right: 0;
		}

		.aflt-timespent-btn:hover {
			background-color: var(--aui-link-hover-color);
		}

		.aflt-timespent-additional {
			margin-right: 12px;
			display: flex;
			gap: 3px;
		}

		.aflt-timespent-additional .aflt-timespent-btn {
			opacity: 0.8;
		}

	`;
	document.head.appendChild(style);
})();

// === Add buttons for input#timeSpentSeconds ===
(function addTimeButtonsWithObserver() {
	// === Time parsing and calculation functions ===
	function parseTimeToMinutes(timeString) {
		if (!timeString || timeString.trim() === "") return 0;

		const timeStr = timeString.trim().toLowerCase();
		let totalMinutes = 0;

		// Parse hours (h)
		const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*h/);
		if (hourMatch) {
			totalMinutes += Math.floor(parseFloat(hourMatch[1]) * 60);
		}

		// Parse minutes (m)
		const minuteMatch = timeStr.match(/(\d+)\s*m/);
		if (minuteMatch) {
			totalMinutes += parseInt(minuteMatch[1]);
		}

		return totalMinutes;
	}

	function minutesToTimeString(minutes) {
		if (minutes <= 0) return "0m";

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours === 0) {
			return `${remainingMinutes}m`;
		} else if (remainingMinutes === 0) {
			return `${hours}h`;
		} else {
			return `${hours}h ${remainingMinutes}m`;
		}
	}

	function addTime(currentTime, minutesToAdd) {
		const currentMinutes = parseTimeToMinutes(currentTime);
		const newMinutes = Math.max(0, currentMinutes + minutesToAdd);
		return minutesToTimeString(newMinutes);
	}

	function subtractTime(currentTime, minutesToSubtract) {
		const currentMinutes = parseTimeToMinutes(currentTime);
		const newMinutes = Math.max(0, currentMinutes - minutesToSubtract);
		return minutesToTimeString(newMinutes);
	}

	const BUTTONS = [
		{ label: "15m", value: "15m" },
		{ label: "30m", value: "30m" },
		{ label: "45m", value: "45m" },
		{ label: "1h", value: "1h" },
		{ label: "1.5h", value: "1h 30m" },
		{ label: "2h", value: "2h" },
		{ label: "2.5h", value: "2h 30m" },
		{ label: "3h", value: "3h" },
		{ label: "4h", value: "4h" },
		{ label: "5h", value: "5h" },
		{ label: "6h", value: "6h" },
		{ label: "7h", value: "7h" },
		{ label: "8h", value: "8h" },
	];
	const BUTTONS_CLASS = "aflt-timespent-buttons";
	const BUTTON_CLASS = "aflt-timespent-btn";

	function addButtonsIfNeeded() {
		const input = document.getElementById("timeSpentSeconds");
		if (input && !input.parentNode.querySelector("." + BUTTONS_CLASS)) {
			// Create additional buttons container (+30m, -30m)
			const additionalContainer = document.createElement("span");
			additionalContainer.className = "aflt-timespent-additional";
			
			// +30m button
			const addButton = document.createElement("button");
			addButton.type = "button";
			addButton.textContent = "+30m";
			addButton.className = BUTTON_CLASS;
			addButton.addEventListener("click", () => {
				input.focus();
				const currentValue = input.value || '';
				const newValue = addTime(currentValue, 30);
				const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
				nativeInputValueSetter.call(input, newValue);
				input.dispatchEvent(new Event("input", { bubbles: true }));
				input.dispatchEvent(new Event("change", { bubbles: true }));
				input.blur();
				setTimeout(() => {
					const submitBtn = document.querySelector('button[name="submitWorklogButton"]');
					if (submitBtn && !submitBtn.disabled) {
						submitBtn.click();
					}
				}, 150);
			});
			additionalContainer.appendChild(addButton);
			
			// -30m button
			const subtractButton = document.createElement("button");
			subtractButton.type = "button";
			subtractButton.textContent = "-30m";
			subtractButton.className = BUTTON_CLASS;
			subtractButton.addEventListener("click", () => {
				input.focus();
				const currentValue = input.value || '';
				const newValue = subtractTime(currentValue, 30);
				const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
				nativeInputValueSetter.call(input, newValue);
				input.dispatchEvent(new Event("input", { bubbles: true }));
				input.dispatchEvent(new Event("change", { bubbles: true }));
				input.blur();
				setTimeout(() => {
					const submitBtn = document.querySelector('button[name="submitWorklogButton"]');
					if (submitBtn && !submitBtn.disabled) {
						submitBtn.click();
					}
				}, 150);
			});
			additionalContainer.appendChild(subtractButton);
			
			// Create main buttons container
			const container = document.createElement("div");
			container.className = BUTTONS_CLASS;
			BUTTONS.forEach(btn => {
				const button = document.createElement("button");
				button.type = "button";
				button.textContent = btn.label;
				button.className = BUTTON_CLASS;
				button.addEventListener("click", () => {
					input.focus();
					const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
					nativeInputValueSetter.call(input, btn.value);
					input.dispatchEvent(new Event("input", { bubbles: true }));
					input.dispatchEvent(new Event("change", { bubbles: true }));
					input.blur();
					setTimeout(() => {
						const submitBtn = document.querySelector('button[name="submitWorklogButton"]');
						if (submitBtn && !submitBtn.disabled) {
							submitBtn.click();
						}
					}, 150);
				});
				container.appendChild(button);
			});
			
			// Insert additional buttons first, then main buttons
			input.parentNode.insertBefore(additionalContainer, input.nextSibling);
			input.parentNode.insertBefore(container, input.nextSibling);
		}
	}

	// First run in case input already exists
	addButtonsIfNeeded();

	// MutationObserver for tracking changes in DOM
	const observer = new MutationObserver(() => {
		addButtonsIfNeeded();
	});
	observer.observe(document.body, { childList: true, subtree: true });
})();

// === Toggle for hiding completed tasks in epic ===
(function () {
	const STORAGE_KEY = "aflt-hide-completed-epic";
	const SELECTOR = "#ghx-issues-in-epic-table .issuerow";
	const COMPLETED_CLASS = "jira-issue-status-lozenge-success";
	const HIDDEN_CLASS = "aflt-hide-completed-epic";
	const TOGGLE_ID = "aflt-epic-toggle";

	// --- Styles for toggle ---
	const style = document.createElement("style");
	style.textContent = `
		.${HIDDEN_CLASS} { display: none !important; }
		#${TOGGLE_ID} {
			position: fixed;
			bottom: 60px;
			left: 30px;
			z-index: 10000;
			background: #222;
			color: #fff;
			padding: 10px;
			border-radius: 50%;
			cursor: pointer;
			opacity: 0;
			transition: background 0.3s, opacity 0.3s;
			user-select: none;
		}
		#${TOGGLE_ID}:hover, #${TOGGLE_ID}:focus {
			opacity: 1;
		}
		#${TOGGLE_ID}.active {
			background: #ffd700;
			color: #222;
		}
	`;
	document.head.appendChild(style);

	function applyFilter() {
		document.querySelectorAll(SELECTOR).forEach(row => {
			const completed = row.querySelector(`.${COMPLETED_CLASS}`);
			if (completed) row.classList.add(HIDDEN_CLASS);
		});
	}
	function removeFilter() {
		document.querySelectorAll(SELECTOR).forEach(row => {
			row.classList.remove(HIDDEN_CLASS);
		});
	}
	function setFilterState(enabled) {
		if (enabled) {
			applyFilter();
		} else {
			removeFilter();
		}
	}

	function createToggle() {
		const toggle = document.createElement("div");
		toggle.id = TOGGLE_ID;
		toggle.tabIndex = 0;
		toggle.textContent = "✔️";
		toggle.title = "Hide/show completed tasks in epic";
		toggle.style.pointerEvents = "auto";
		toggle.style.opacity = "0";

		toggle.addEventListener("mouseenter", () => {
			toggle.style.opacity = "1";
		});
		toggle.addEventListener("mouseleave", () => {
			toggle.style.opacity = "0";
		});
		toggle.addEventListener("focus", () => {
			toggle.style.opacity = "1";
		});
		toggle.addEventListener("blur", () => {
			toggle.style.opacity = "0";
		});

		toggle.onclick = function () {
			const enabled = localStorage.getItem(STORAGE_KEY) !== "false";
			if (enabled) {
				localStorage.setItem(STORAGE_KEY, "false");
				removeFilter();
				toggle.classList.remove("active");
			} else {
				localStorage.setItem(STORAGE_KEY, "true");
				applyFilter();
				toggle.classList.add("active");
			}
		};

		document.body.appendChild(toggle);

		if (localStorage.getItem(STORAGE_KEY) !== "false") {
			applyFilter();
			toggle.classList.add("active");
		}

		setTimeout(() => {
			toggle.style.pointerEvents = "auto";
		}, 100);
	}

	function init() {
		createToggle();
		setFilterState(localStorage.getItem(STORAGE_KEY) !== "false");
	}

	const observer = new MutationObserver(() => {
		if (localStorage.getItem(STORAGE_KEY) !== "false") {
			applyFilter();
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
