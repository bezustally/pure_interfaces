//

// ==UserScript==

// @name                 OZON Handy Features

// @description          Улучшение опыта пользования OZON: исправление навигации по товарам, автоматическая установка полезных сортировок (по рейтингу в поиске, по оценке на страницах товаров)

// @license              CC BY-NC-ND 4.0. Usage, modification and distribution are permitted only with the author's attribution and without commercial use. Any modifications without the author's consent are prohibited. Использование, изменение и распространение разрешены только с указанием авторства и без коммерческого использования. Запрещены любые модификации без согласия автора.

// @namespace            https://github.com/bezustally/pure_interfaces
// @updateURL            https://github.com/bezustally/pure_interfaces/raw/main/ozon.ru.user.js
// @downloadURL          https://github.com/bezustally/pure_interfaces/raw/main/ozon.ru.user.js

// @match                *://*.ozon.ru/*

// @author               bezustally

// @version              2.0
// @updated              2025-09-08

// @run-at              document-end

// ==/UserScript==

//

const PRODUCT_PAGE_REGEX = /\/product\//;
const PRODUCT_PAGE_PARAMS = { sort: "score_asc", reviewsVariantMode: "1" };
const CATEGORY_PAGE_REGEX = /\/category\//;
const CATEGORY_PAGE_PARAMS = { sorting: "rating" };

/**
 * Universal function to ensure URL parameters are present on specific pages.
 * @param {RegExp} pathRegex - regex to check the path
 * @param {Object} params - object with parameters that should be in the URL
 */
const ensureUrlParams = (pathRegex, params) => {
	const isTargetPage = pathRegex.test(window.location.pathname);
	const url = new URL(window.location.href);
	let changed = false;
	for (const [key, value] of Object.entries(params)) {
		if (key === "sorting" && url.searchParams.has("sorting")) continue; // don't touch if sorting already exists (even empty)
		if (url.searchParams.get(key) !== value) {
			url.searchParams.set(key, value);
			changed = true;
		}
	}
	if (isTargetPage && changed) {
		window.location.replace(url.toString());
	}
};

/**
 * All product links open in the same window, not in a new one.
 */
const forceProductLinksToSelf = () => {
	const productLinks = document.querySelectorAll('a[href^="/product/"]');
	productLinks.forEach(link => {
		link.setAttribute("target", "_self");
		link.addEventListener(
			"click",
			event => {
				event.preventDefault();
				event.stopImmediatePropagation(); // Block all third-party handlers
				window.location.href = link.href;
			},
			true
		);
	});
};

/**
 * Click on product card copies its selector
 */
const addProductCardClickHandlers = () => {
	const productCards = document.querySelectorAll(".tile-root > div");
	productCards.forEach(card => {
		card.addEventListener("click", event => {
			let link = event.target.querySelector(".tile-clickable-element");
			if (!link) {
				link = event.target.closest(".tile-clickable-element");
			}
			if (!link) return;

			const href = link.getAttribute("href");
			if (!href) return;

			const productUrlWithoutTracking = href.split("?")[0];
			const blockingSelector = `\t[href*=\"${productUrlWithoutTracking}\"],\n`;

			event.preventDefault();
			navigator.clipboard.writeText(blockingSelector);
		});
	});
};

// Initialization
setTimeout(() => {
	// Ensure parameters on product page
	ensureUrlParams(PRODUCT_PAGE_REGEX, PRODUCT_PAGE_PARAMS);
	// Ensure sorting on category page
	ensureUrlParams(CATEGORY_PAGE_REGEX, CATEGORY_PAGE_PARAMS);
	addProductCardClickHandlers();
	forceProductLinksToSelf();

	// Watch for DOM changes and re-attach handlers
	const observer = new MutationObserver(() => {
		addProductCardClickHandlers();
		forceProductLinksToSelf();
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}, 2000);
