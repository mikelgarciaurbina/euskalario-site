#!/usr/bin/env python3
"""Set the Astro public origin. Run npm run build afterwards; nothing is uploaded."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--origin', required=True, help='For example https://euskalario.overlayon.com')
args = parser.parse_args()
origin = args.origin.rstrip('/')
parts = urlsplit(origin)
try:
    port = parts.port
except ValueError:
    parser.error('The port is invalid.')
hostname = parts.hostname or ''
valid_hostname = all(re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?', label) for label in hostname.split('.'))
if (parts.scheme != 'https' or not valid_hostname or len(hostname) > 253
        or re.search(r'[\s<>\"\x27]', origin) or parts.path or parts.query
        or parts.fragment or parts.username or parts.password):
    parser.error('Use an HTTPS origin without a path, query or credentials.')
root = Path(__file__).resolve().parent
config_file = root / 'site.json'
config = json.loads(config_file.read_text())
config['origin'] = origin
config_file.write_text(json.dumps(config, indent=2) + '\n')
print(f'Public origin set to {origin}. Run npm run build. No files have been published.')
