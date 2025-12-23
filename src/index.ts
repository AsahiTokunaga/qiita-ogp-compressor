/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request): Promise<Response> {
		const url = new URL(request.url);
		const res = await fetch(`https://qiita.com${url.pathname}`, { redirect: 'follow' });
		switch (res.status) {
			case 400:
				return new Response('Bad Request', { status: res.status });
			case 401:
				return new Response('Unauthorized', { status: res.status });
			case 403:
				return new Response('Forbidden', { status: res.status });
			case 404:
				return new Response('Not Found', { status: res.status });
			default:
				if (!res.ok) return new Response(null, { status: res.status });
		}

		let ogType: string | null = null;
		let ogTitle: string | null = null;
		let ogDescription: string | null = null;
		let themeColor: string | null = null;
		await new HTMLRewriter()
			.on('meta[property="og:type"]', {
				element(element) {
					ogType = element.getAttribute('content');
				}
			})
			.on('meta[property="og:title"]', {
				element(element) {
					ogTitle = element.getAttribute('content');
				}
			})
			.on('meta[property="og:description"]', {
				element(element) {
					ogDescription = element.getAttribute('content');
				}
			})
			.on('meta[name="theme-color"]', {
				element(element) {
					themeColor = element.getAttribute('content');
				}
			})
			.transform(res)
			.text();
		if (!ogType || !ogTitle || !ogDescription || !themeColor) return new Response('Not Found', { status: 404 });

		const response = `
			<!DOCTYPE html>
			<head>
				<meta name="theme-color" content="${themeColor}">
				<meta name="twitter:card" content="summary_large_image">
				<meta property="og:site_name" content="Qiita">
				<meta property="og:type" content="${ogType}">
				<meta property="og:title" content="${ogTitle}">
				<meta property="og:description" content="${ogDescription}">
				<meta property="og:url" content="https://qiita.com${url.pathname}">
				<meta property="og:image" content="https://qiita-ogpimage-getter.hihimamu.workers.dev${url.pathname}">
			</head>
			<body>
				<p>Redirecting...</p>
				<script>
					window.location.href = "https://qiita.com${url.pathname}";
				</script>
			</body>
			</html>
		`;
		return new Response(response, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
		});
	},
} satisfies ExportedHandler<Env>;

