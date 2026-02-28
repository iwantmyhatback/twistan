import { useEffect } from 'react';

const BASE_TITLE = 'Twistan';

/**
 * Sets document.title on mount; restores base title on unmount.
 * @param {string} title - Page-specific title segment (e.g. "About")
 */
export function usePageTitle(title) {
	useEffect(() => {
		document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
		return () => { document.title = BASE_TITLE; };
	}, [title]);
}
