//

// ==UserScript==

// @name                 Hiding 5 stars reviews

// @license              CC BY-NC-ND 4.0. Usage, modification and distribution are permitted only with the author's attribution and without commercial use. Any modifications without the author's consent are prohibited. Использование, изменение и распространение разрешены только с указанием авторства и без коммерческого использования. Запрещены любые модификации без согласия автора.

// @namespace            https://github.com/bezustally/pure_interfaces
// @updateURL            https://github.com/bezustally/pure_interfaces/raw/main/irecommend.ru.user.js
// @downloadURL          https://github.com/bezustally/pure_interfaces/raw/main/irecommend.ru.user.js

// @match                *://*.irecommend.ru/*

// @run-at               document-start

// @author               bezustally

// @version              1.5
// @updated              2025-07-20

// ==/UserScript==

//

(function () {
	"use strict";

	// === Immediately hiding 5 stars reviews through CSS ===
	// (Удалено: injectHide5StarsCSS и всё, что связано с irec-hide-5stars)

	// Add or remove class to hide 5 stars reviews
	function set5StarsHidden(hidden) {
		if (hidden) {
			RatingFilter.apply();
		} else {
			RatingFilter.remove();
		}
	}

	// Instead of mark5StarsImmediately:
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			set5StarsHidden(localStorage.getItem("irecommend-filter-enabled") !== "false");
		});
	} else {
		set5StarsHidden(localStorage.getItem("irecommend-filter-enabled") !== "false");
	}

	// === Cancel CSS-hiding when filter is disabled ===
	// (Удалено: show-5stars-override)

	// ============================================================================
	// Constants and configuration
	// ============================================================================

	const CONFIG = {
		DEBUG_ENABLED: false,
		STORAGE_KEY: "irecommend-filter-enabled",
		SELECTORS: {
			ITEM: "li.item",
			STARS_CONTAINER: ".starsRating",
			STAR: ".star",
			FILLED_STAR: ".on",
		},
		CSS_CLASSES: {
			HIDDEN: "item-hidden",
			TOGGLE_ACTIVE: "active",
		},
		POSITIONS: {
			TOGGLE: {
				BOTTOM: "75px",
				LEFT: "25px",
			},
			DEBUG: {
				TOP: "10px",
				LEFT: "10px",
			},
		},
	};

	// ============================================================================
	// Immediately loading CSS
	// ============================================================================

	// Create and add CSS styles immediately
	(function createStylesImmediately() {
		const style = document.createElement("style");
		style.textContent = `
			/* Styles for the toggle */
			#star-rating-toggle {
				position: fixed;
				bottom: ${CONFIG.POSITIONS.TOGGLE.BOTTOM};
				left: ${CONFIG.POSITIONS.TOGGLE.LEFT};
				z-index: 10000;
				opacity: 0;
				transition: opacity 0.3s ease;
				cursor: pointer;
			}

			#star-rating-toggle:hover {
				opacity: 1;
			}

			.toggle-button {
				width: 40px;
				height: 40px;
				background: rgba(0, 0, 0, 0.7);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
				transition: all 0.3s ease;
			}

			.toggle-button:hover {
				background: rgba(0, 0, 0, 0.9);
				transform: scale(1.1);
			}

			.toggle-icon {
				font-size: 20px;
				color: white;
			}

			.toggle-button.${CONFIG.CSS_CLASSES.TOGGLE_ACTIVE} {
				background: rgba(255, 215, 0, 0.8);
			}

			.toggle-button.${CONFIG.CSS_CLASSES.TOGGLE_ACTIVE} .toggle-icon {
				color: #333;
			}

			.${CONFIG.CSS_CLASSES.HIDDEN} {
				display: none !important;
			}

			/* Debug information */
			.debug-info {
				position: fixed;
				top: ${CONFIG.POSITIONS.DEBUG.TOP};
				left: ${CONFIG.POSITIONS.DEBUG.LEFT};
				background: rgba(0, 0, 0, 0.8);
				color: white;
				padding: 10px;
				border-radius: 5px;
				font-size: 12px;
				z-index: 10001;
				max-width: 300px;
			}
		`;

		// Add styles to head as soon as possible
		if (document.head) {
			document.head.appendChild(style);
		} else {
			// If head is not ready, wait for it
			document.addEventListener("DOMContentLoaded", () => {
				document.head.appendChild(style);
			});
		}
	})();

	// ============================================================================
	// Application state
	// ============================================================================

	const AppState = {
		filterEnabled: false,

		load() {
			const savedState = localStorage.getItem(CONFIG.STORAGE_KEY);
			this.filterEnabled = savedState === "true";
			return this.filterEnabled;
		},

		save(enabled) {
			this.filterEnabled = enabled;
			localStorage.setItem(CONFIG.STORAGE_KEY, enabled.toString());
		},

		toggle() {
			this.filterEnabled = !this.filterEnabled;
			this.save(this.filterEnabled);
			return this.filterEnabled;
		},
	};

	// ============================================================================
	// Utilities
	// ============================================================================

	const Utils = {
		debug(message) {
			if (!CONFIG.DEBUG_ENABLED) return;

			const debugStatus = document.getElementById("debug-status");
			if (debugStatus) {
				debugStatus.textContent = message;
			}
		},

		waitForElements(selector, timeout = 5000) {
			return new Promise(resolve => {
				const elements = document.querySelectorAll(selector);
				if (elements.length > 0) {
					resolve(elements);
					return;
				}

				const observer = new MutationObserver(() => {
					const elements = document.querySelectorAll(selector);
					if (elements.length > 0) {
						observer.disconnect();
						resolve(elements);
					}
				});

				observer.observe(document.body, {
					childList: true,
					subtree: true,
				});

				setTimeout(() => {
					observer.disconnect();
					resolve(document.querySelectorAll(selector));
				}, timeout);
			});
		},
	};

	// ============================================================================
	// Rating logic
	// ============================================================================

	const RatingFilter = {
		/**
		 * Checks if the element has a 5-star rating
		 * @param {Element} element - DOM element to check
		 * @returns {boolean} - true if the element has 5 stars
		 */
		hasFiveStars(element) {
			const starsContainer = element.querySelector(CONFIG.SELECTORS.STARS_CONTAINER);
			if (!starsContainer) return false;

			const stars = starsContainer.querySelectorAll(CONFIG.SELECTORS.STAR);
			if (stars.length !== 5) return false;

			let filledStars = 0;
			stars.forEach(star => {
				if (star.querySelector(CONFIG.SELECTORS.FILLED_STAR)) {
					filledStars++;
				}
			});

			if (CONFIG.DEBUG_ENABLED) {
				Utils.debug(`Найдено звезд: ${stars.length}, заполненных: ${filledStars}`);
			}

			return filledStars === 5;
		},

		/**
		 * Applies the filter - hides elements with 5 stars
		 */
		apply() {
			if (CONFIG.DEBUG_ENABLED) {
				Utils.debug("Applying filter...");
			}

			const items = document.querySelectorAll(CONFIG.SELECTORS.ITEM);
			if (!items || items.length === 0) {
				if (CONFIG.DEBUG_ENABLED) {
					Utils.debug("Elements not found");
				}
				return;
			}

			let hiddenCount = 0;
			items.forEach(item => {
				if (this.hasFiveStars(item)) {
					item.classList.add(CONFIG.CSS_CLASSES.HIDDEN);
					hiddenCount++;
				}
			});

			if (CONFIG.DEBUG_ENABLED) {
				Utils.debug(`Hidden elements: ${hiddenCount} of ${items.length}`);
			}
		},

		/**
		 * Removes the filter - shows all elements
		 */
		remove() {
			if (CONFIG.DEBUG_ENABLED) {
				Utils.debug("Removing filter...");
			}

			const items = document.querySelectorAll(`.${CONFIG.CSS_CLASSES.HIDDEN}`);
			items.forEach(item => {
				item.classList.remove(CONFIG.CSS_CLASSES.HIDDEN);
			});

			if (CONFIG.DEBUG_ENABLED) {
				Utils.debug(`Shown elements: ${items.length}`);
			}
		},
	};

	// ============================================================================
	// UI components
	// ============================================================================

	const UI = {
		/**
		 * Creates a toggle button for the filter
		 */
		createToggle() {
			const toggle = document.createElement("div");
			toggle.id = "star-rating-toggle";
			toggle.innerHTML = `
				<div class="toggle-button">
					<span class="toggle-icon">⭐</span>
				</div>
			`;

			// Restore visual state
			if (AppState.filterEnabled) {
				toggle.querySelector(".toggle-button").classList.add(CONFIG.CSS_CLASSES.TOGGLE_ACTIVE);
			}

			// Click handler
			toggle.addEventListener("click", () => {
				const isEnabled = AppState.toggle();
				const button = toggle.querySelector(".toggle-button");

				if (isEnabled) {
					button.classList.add(CONFIG.CSS_CLASSES.TOGGLE_ACTIVE);
					set5StarsHidden(true);
				} else {
					button.classList.remove(CONFIG.CSS_CLASSES.TOGGLE_ACTIVE);
					set5StarsHidden(false);
				}
			});

			document.body.appendChild(toggle);
			return toggle;
		},

		/**
		 * Creates a debug panel
		 */
		createDebugPanel() {
			if (!CONFIG.DEBUG_ENABLED) return;

			const debugPanel = document.createElement("div");
			debugPanel.className = "debug-info";
			debugPanel.id = "debug-panel";
			debugPanel.innerHTML = "Debug: <span id='debug-status'>Inactive</span>";
			document.body.appendChild(debugPanel);
			return debugPanel;
		},
	};

	// ============================================================================
	// DOM observer
	// ============================================================================

	const DOMObserver = {
		observer: null,

		/**
		 * Creates a DOM observer
		 */
		create() {
			this.observer = new MutationObserver(mutations => {
				if (!AppState.filterEnabled) return;

				let newItems = [];
				mutations.forEach(mutation => {
					mutation.addedNodes.forEach(node => {
						if (node.nodeType !== 1) return; // Only elements

						// Check the node itself
						if (node.classList?.contains("item")) {
							newItems.push(node);
						}

						// Check child elements
						const childItems = node.querySelectorAll?.(CONFIG.SELECTORS.ITEM) || [];
						childItems.forEach(item => {
							newItems.push(item);
						});
					});
				});

				if (newItems.length > 0) {
					newItems.forEach(item => {
						if (RatingFilter.hasFiveStars(item)) {
							item.classList.add(CONFIG.CSS_CLASSES.HIDDEN);
						}
					});
					if (CONFIG.DEBUG_ENABLED) {
						Utils.debug(`New hidden elements: ${newItems.length}`);
					}
				}
			});

			this.observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		},

		/**
		 * Stops the observer
		 */
		destroy() {
			if (this.observer) {
				this.observer.disconnect();
				this.observer = null;
			}
		},
	};

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	const App = {
		/**
		 * Initializes the application
		 */
		init() {
			// Load the state
			AppState.load();

			// Create UI
			UI.createToggle();
			UI.createDebugPanel();

			// Create the observer
			DOMObserver.create();

			// Apply the filter if needed
			if (AppState.filterEnabled) {
				set5StarsHidden(true);
				if (CONFIG.DEBUG_ENABLED) {
					Utils.debug("Filter restored from localStorage");
				}
			}
		},
	};

	// ============================================================================
	// RUN
	// ============================================================================

	// Run after DOM is loaded
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", App.init);
	} else {
		App.init();
	}
})();
