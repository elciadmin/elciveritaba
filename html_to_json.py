# Aynen bu kodu kopyalayın
from bs4 import BeautifulSoup
import json

html = open('sss.html').read()
soup = BeautifulSoup(html, 'html.parser')

sss_data = []
for item in soup.select('.accordion-item'):
    sss_data.append({
        "soru": item.select_one('h4').text.strip(),
        "cevap": item.select_one('.accordion-content').text.strip()
    })

open('sss.json', 'w').write(json.dumps(sss_data, indent=2, ensure_ascii=False))
