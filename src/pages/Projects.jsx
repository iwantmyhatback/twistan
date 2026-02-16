import { motion } from 'motion/react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import AnimatedSection from '../components/AnimatedSection';
import ExplodingText from '../components/ExplodingText';
import { spawnRipple } from '../utils/ripple';
import { useState, useRef, useEffect, useCallback } from 'react';
import { marked } from 'marked';

/**
 * Escape a string for safe use inside HTML attribute values.
 * Covers &, <, >, ", and ' to prevent attribute breakout.
 */
function escapeAttr(s) {
	if (typeof s !== 'string') return '';
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

/**
 * Returns true if a URL is safe for href use (http/https, relative, or anchor).
 * Blocks javascript:, data:, vbscript: schemes.
 */
function isSafeUrl(href) {
	if (typeof href !== 'string') return false;
	const trimmed = href.trim().toLowerCase();
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
	if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return true;
	// Block known dangerous schemes
	if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) return false;
	// Allow relative URLs without explicit scheme
	if (!trimmed.includes(':')) return true;
	return false;
}

/** Module-scope cache — persists across navigations within the SPA */
const readmeCache = new Map();

/**
 * Custom marked renderer that handles heading classes, safe link attributes,
 * image URL validation, and raw HTML stripping (XSS prevention).
 */
const renderer = {
	heading({ text, depth }) {
		const tag = `h${depth}`;
		let cls = 'text-lg font-medium text-white mt-3 mb-2';
		if (depth === 1) cls = 'text-3xl md:text-4xl font-bold text-white mt-4 mb-2';
		else if (depth === 2) cls = 'text-2xl font-semibold text-white mt-4 mb-2';
		else if (depth === 3) cls = 'text-xl font-medium text-white mt-3 mb-2';
		return `<${tag} class="${cls}">${text}</${tag}>`;
	},
	link({ href, title, tokens }) {
		const text = this.parser.parseInline(tokens);
		if (!isSafeUrl(href)) return text;
		const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
		return `<a href="${escapeAttr(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
	},
	image({ href, title, text }) {
		if (!isSafeUrl(href)) return escapeAttr(text || '');
		const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
		const altAttr = text ? ` alt="${escapeAttr(text)}"` : ' alt=""';
		return `<img src="${escapeAttr(href)}"${altAttr}${titleAttr} />`;
	},
	hr() {
		return '\n<hr />\n';
	},
	// Strip raw HTML blocks to prevent XSS from README content
	html() {
		return '';
	},
};

marked.use({
	gfm: true,
	breaks: true,
	renderer,
});

const projects = [
	{
		title: 'python-wrapper',
		description:
			'Environment stability wrapper for general Python executions, with optional Docker integration.',
		tags: ['Shell', 'Python', 'Docker'],
		url: 'https://github.com/iwantmyhatback/python-wrapper',
	},
	{
		title: 'jellyfin.supplemental',
		description:
			'Send an email with an update about new movies and shows added in the past 7 days.',
		tags: ['Shell', 'Python', 'Jellyfin API', 'Gmail API'],
		url: 'https://github.com/iwantmyhatback/jellyfin.supplemental',
	},
	{
		title: 'twistan',
		description:
			'Personal website built with React, Vite, and Tailwind CSS. Deployed on Cloudflare Pages with serverless functions.',
		tags: ['React', 'Vite', 'Tailwind', 'Cloudflare'],
		url: 'https://github.com/iwantmyhatback/twistan',
	},
	{
		title: 'network-monitor',
		description:
			'LAN monitoring tool for tracking devices and network health.',
		tags: ['Shell', 'Python', 'Mikrotik API', 'Networking'],
		url: 'https://github.com/iwantmyhatback/network-monitor',
	},
	{
		title: 'shell-environment',
		description:
			'Dotfiles and shell configuration for a reproducible development environment across machines.',
		tags: ['Shell', 'Automation', 'macOS'],
		url: 'https://github.com/iwantmyhatback/shell-environment',
	},
	{
		title: 'ds_clean',
		description:
			'Recursively delete all the pesky .DS_Store files that macOS UI generates.',
		tags: ['Rust', 'macOS', 'CLI'],
		url: 'https://github.com/iwantmyhatback/ds_clean',
	},
];

/**
 * Extracts owner and repo from a GitHub URL.
 * @param {string} url - GitHub repository URL
 * @returns {{ owner: string, repo: string } | null}
 */
function parseRepoFromUrl(url) {
	try {
		const u = new URL(url);
		const parts = u.pathname.split('/').filter(Boolean);
		if (parts.length >= 2) {
			return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
		}
	} catch {
		// Invalid URL — fall through to return null
	}
	return null;
}

/**
 * Fetches raw README markdown from GitHub API, falling back to raw.githubusercontent.
 * @param {string} url - GitHub repository URL
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @returns {Promise<string>} Raw markdown content
 */
async function fetchReadmeFromGithub(url, signal) {
	const repo = parseRepoFromUrl(url);
	if (!repo) throw new Error('Invalid repository URL');

	// Try GitHub API with raw accept header (returns markdown body)
	const apiUrl = `https://api.github.com/repos/${repo.owner}/${repo.repo}/readme`;
	try {
		const res = await fetch(apiUrl, {
			headers: { Accept: 'application/vnd.github.v3.raw' },
			signal,
		});
		if (res.ok) return await res.text();
	} catch (e) {
		if (e.name === 'AbortError') throw e;
		// ignore and fall back
	}

	// Fallback: try raw.githubusercontent with common default branches
	const branches = ['main', 'master'];
	for (const b of branches) {
		try {
			const rawUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${b}/README.md`;
			const r2 = await fetch(rawUrl, { signal });
			if (r2.ok) return await r2.text();
		} catch (e) {
			if (e.name === 'AbortError') throw e;
			// continue
		}
	}

	throw new Error('README not found');
}

/**
 * Projects page — displays project cards with expandable README panels.
 * READMEs are fetched from GitHub, parsed with marked, and cached at module scope.
 */
function Projects() {

	const [openIndex, setOpenIndex] = useState(null);
	/** Set of project titles whose HTML is cached — used only as a render trigger */
	const [, setCachedTitles] = useState(() => new Set(readmeCache.keys()));
	const [loadingIndex, setLoadingIndex] = useState(null);
	const [errors, setErrors] = useState({});
	const abortRef = useRef(null);
	const tileRefs = useRef({});

	// Cancel any in-flight fetch on unmount
	useEffect(() => {
		return () => {
			if (abortRef.current) abortRef.current.abort();
		};
	}, []);

	const handleTileClick = useCallback(async (project, index) => {
		if (openIndex === index) {
			setOpenIndex(null);
			// Cancel in-flight fetch when closing
			if (abortRef.current) abortRef.current.abort();
			return;
		}
		setOpenIndex(index);

		// Scroll tile into view after expanding
		requestAnimationFrame(() => {
			const el = tileRefs.current[index];
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});

		// Already cached or already loading
		if (readmeCache.has(project.title) || loadingIndex === index) return;

		// Cancel any previous in-flight fetch
		if (abortRef.current) abortRef.current.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setLoadingIndex(index);
		setErrors((p) => { const c = { ...p }; delete c[project.title]; return c; });
		try {
			const md = await fetchReadmeFromGithub(project.url, controller.signal);
			let html;
			try {
				html = marked.parse(md);
			} catch {
				html = `<pre>${escapeAttr(md)}</pre>`;
			}
			// Prepend a small label above the README content
			const wrapped = `<div><div class="mb-2 text-sm font-mono text-neutral-400">Project's README.md :</div>${html}</div>`;
			readmeCache.set(project.title, wrapped);
			setCachedTitles(new Set(readmeCache.keys()));
		} catch (err) {
			if (err.name === 'AbortError') return;
			setErrors((p) => ({ ...p, [project.title]: err.message || 'Failed to load README' }));
		} finally {
			setLoadingIndex(null);
		}
	}, [openIndex, loadingIndex]);

	return (
		<div className="section-container py-24">
			<AnimatedSection>
				<ExplodingText text="Projects" className="heading-xl mb-3" />
			</AnimatedSection>
			<AnimatedSection delay={0.1}>
				<p className="text-body mb-16">Things I&rsquo;ve built or broken recently in my spare time</p>
			</AnimatedSection>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{projects.map((project, i) => (
					<AnimatedSection
						key={project.title}
						delay={i * 0.08}
						className={openIndex === i ? 'lg:col-span-2' : ''}
					>
							<motion.div
								ref={(el) => { tileRefs.current[i] = el; }}
								layout
								onClick={(e) => spawnRipple(e)}
								whileHover={{ scale: 1.01 }}
								transition={{ type: 'spring', stiffness: 300, damping: 20 }}
								className="card card-inner-highlight ripple-container h-full flex flex-col"
							>
							<div className="flex items-start justify-between gap-3 mb-3">
								<h3 className="text-lg font-semibold font-display">
									<a
										href={project.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-white project-title"
										onClick={(e) => e.stopPropagation()}
									>
										{project.title}
									</a>
								</h3>
								{project.url && (
									<a
										href={project.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-neutral-500 shrink-0"
										onClick={(e) => e.stopPropagation()}
										aria-label={`Open ${project.title}`}
									>
										<ArrowTopRightOnSquareIcon className="w-5 h-5" />
									</a>
								)}
							</div>
							<p className="text-sm text-neutral-400 mb-4 flex-1">
								{project.description}
							</p>
							{/* Expand/collapse button - styled like the tile and placed above tags */}
							<div className="mb-3">
								<button
									type="button"
									aria-expanded={openIndex === i}
									onClick={(e) => { e.stopPropagation(); handleTileClick(project, i); }}
									className="px-3 py-1.5 bg-surface-100 text-neutral-300 border border-surface-300 rounded-md text-sm font-mono hover:border-surface-400"
								>
									{openIndex === i ? 'Hide README' : "See project README"}
								</button>
							</div>

							<div className="flex flex-wrap gap-2">
								{project.tags.map((tag) => (
									<span
										key={tag}
										className="px-2.5 py-0.5 text-xs font-mono text-neutral-400
										           bg-surface-200 border border-surface-300 rounded-full"
									>
										{tag}
									</span>
								))}
							</div>

							{/* Expanded README area — mutually exclusive: loading → error → content */}
							{openIndex === i && (
								<div className="mt-4 prose max-h-96 overflow-auto p-4 bg-surface-50 rounded">
									{loadingIndex === i ? (
										<p className="text-sm text-neutral-400">Loading README…</p>
									) : errors[project.title] ? (
										<p className="text-sm text-red-400">{errors[project.title]}</p>
									) : readmeCache.has(project.title) ? (
										<div dangerouslySetInnerHTML={{ __html: readmeCache.get(project.title) }} />
									) : null}
								</div>
							)}
						</motion.div>
					</AnimatedSection>
				))}
			</div>
		</div>
	);
}

export default Projects;
