import os
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify, request
import requests
from bs4 import BeautifulSoup
import copy

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        xml_data = response.content
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return []
        
    try:
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(xml_data)
        
        parsed_items = []
        
        for entry in root.findall('atom:entry', ns):
            date_str = entry.find('atom:title', ns).text
            updated_str = entry.find('atom:updated', ns).text
            
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            link = link_elem.attrib['href'] if link_elem is not None else ""
            
            id_val = entry.find('atom:id', ns).text
            
            content_elem = entry.find('atom:content', ns)
            if content_elem is None or not content_elem.text:
                continue
                
            soup = BeautifulSoup(content_elem.text, 'html.parser')
            
            # Find all h3 tags to split items
            h3s = soup.find_all('h3')
            
            if not h3s:
                # No h3 tags, treat entire content as single item
                text_content = soup.get_text().strip()
                # Clean up multiple whitespaces
                text_content = " ".join(text_content.split())
                parsed_items.append({
                    'id': id_val,
                    'date': date_str,
                    'updated_at': updated_str,
                    'type': 'General',
                    'html': str(soup),
                    'text': text_content,
                    'link': link
                })
                continue
                
            for idx, h3 in enumerate(h3s):
                item_type = h3.get_text().strip()
                
                # Gather siblings until next h3
                siblings = []
                for sibling in h3.next_siblings:
                    if sibling.name == 'h3':
                        break
                    siblings.append(sibling)
                    
                # Build a snippet soup for this item
                item_soup = BeautifulSoup('', 'html.parser')
                for sib in siblings:
                    item_soup.append(copy.copy(sib))
                    
                item_html = str(item_soup).strip()
                item_text = item_soup.get_text().strip()
                # Clean up multiple whitespaces
                item_text = " ".join(item_text.split())
                
                # Unique ID for this specific note
                item_id = f"{id_val}#item-{idx}"
                
                parsed_items.append({
                    'id': item_id,
                    'date': date_str,
                    'updated_at': updated_str,
                    'type': item_type,
                    'html': item_html,
                    'text': item_text,
                    'link': link
                })
        return parsed_items
    except Exception as e:
        print(f"Error parsing feed: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    notes = fetch_and_parse_notes()
    if not notes:
        return jsonify({'error': 'Failed to retrieve or parse release notes.'}), 500
    return jsonify(notes)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
