//

// #region: metadata

// ==UserScript==

// @name               Brackets Tuning

// @description:en     Brackets text styling — reducing size and opacity
// @description:ru     Стилизация текста в скобках — уменьшение размера и прозрачности

// @license            CC BY-NC-ND 4.0. Usage, modification and distribution are permitted only with the author's attribution and without commercial use. Any modifications without the author's consent are prohibited. Использование, изменение и распространение разрешены только с указанием авторства и без коммерческого использования. Запрещены любые модификации без согласия автора.

// @namespace          https://github.com/bezustally/pure_interfaces
// @downloadURL        https://github.com/bezustally/pure_interfaces/raw/main/brackets-tuning.user.js
// @updateURL          https://github.com/bezustally/pure_interfaces/raw/main/brackets-tuning.user.js

// @match              *://*/*

// @author             bezustally

// @version            2.3
// @updated            2025-09-07

// ==/UserScript==

// #endregion

//

(function () {
	"use strict";

	const IGNORE_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);

	// Add styles for text in brackets
	const style = document.createElement("style");

	style.textContent = `
		/* Styles for text in brackets */
		.brackets-text {
			font-size: 0.9em;
			opacity: 0.4;
			display: inline;
			vertical-align: baseline;
			position: relative;
			top: -0.05em;
		}

		/* Hide original brackets */
		.brackets-text::before,
		.brackets-text::after {
			content: '';
			display: none;
		}

		/* Add brackets through pseudo-elements */
		.brackets-text.round::before {
			content: '(';
			display: inline;
		}

		.brackets-text.round::after {
			content: ')';
			display: inline;
		}

		.brackets-text.square::before {
			content: '[';
			display: inline;
		}

		.brackets-text.square::after {
			content: ']';
			display: inline;
		}
	`;

	document.head.appendChild(style);

	// Function to process brackets in text node
	function processBracketsInTextNode(node) {
		if (node.parentNode && node.parentNode.classList && node.parentNode.classList.contains("brackets-text")) {
			return; // Don't process already wrapped
		}

		let text = node.nodeValue;

		// Wrap brackets
		const regex = /(\(.*?\)|\[.*?\])/g;
		let match,
			lastIndex = 0,
			fragments = [];

		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				fragments.push(document.createTextNode(text.slice(lastIndex, match.index)));
			}

			const span = document.createElement("span");
			span.className = "brackets-text " + (match[0][0] === "(" ? "round" : "square");
			span.textContent = match[0].slice(1, -1);
			fragments.push(span);

			lastIndex = regex.lastIndex;
		}

		if (fragments.length > 0) {
			if (lastIndex < text.length) {
				fragments.push(document.createTextNode(text.slice(lastIndex)));
			}

			const fragment = document.createDocumentFragment();
			fragments.forEach(f => fragment.appendChild(f));
			node.parentNode.replaceChild(fragment, node);
		}
	}

	function processNode(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			processBracketsInTextNode(node);
		} else if (!IGNORE_TAGS.has(node.nodeName) && !node.classList?.contains("brackets-text")) {
			for (let i = 0; i < node.childNodes.length; i++) {
				processNode(node.childNodes[i]);
			}
		}
	}

	// Function to preserve and restore scroll position
	function preserveScrollPosition(callback) {
		if ("scrollRestoration" in history) {
			history.scrollRestoration = "manual";
		}
		const scrollPosition = window.scrollY;
		const scrollX = window.scrollX;
		const hash = window.location.hash;
		callback();
		setTimeout(() => {
			if (hash) window.location.hash = hash;
			window.scrollTo({ top: scrollPosition, left: scrollX, behavior: "instant" });
		}, 100);
	}

	function processDocument() {
		processNode(document.body);
	}

	// For dynamic content
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType === Node.TEXT_NODE) {
					processBracketsInTextNode(node);
				} else if (node.nodeType === Node.ELEMENT_NODE && !IGNORE_TAGS.has(node.nodeName)) {
					processNode(node);
				}
			}
		}
	});

	window.addEventListener("DOMContentLoaded", () => {
		processDocument();
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});

	window.addEventListener("load", () => {
		processDocument();
	});

	setTimeout(() => {
		processDocument();
	}, 1000);

	window.addEventListener("hashchange", () => {
		preserveScrollPosition(() => {
			processDocument();
		});
	});
})();
