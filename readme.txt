xrelay
======
nix binary cache relay on cloudflare workers
races all upstreams in parallel

config (wrangler.jsonc vars):
SUBSTITUTERS  space-separated upstream cache
PRIORITY      reported to nix clients, lower means higher priority
