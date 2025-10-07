from flask import Flask, render_template, abort, url_for
import pathlib, yaml, frontmatter
from markdown import markdown

BASE = pathlib.Path(__file__).parent
PAGES = BASE / "content" / "pages"
COLL  = BASE / "content" / "collections"
NAVY  = BASE / "content" / "nav.yaml"

app = Flask(__name__)

def nav_items():
    return yaml.safe_load(NAVY.read_text(encoding="utf-8"))

def load_md(file: pathlib.Path):
    post = frontmatter.loads(file.read_text(encoding="utf-8"))
    html = markdown(post.content, extensions=["extra", "admonition", "tables", "toc"])
    meta = post.metadata or {}
    return meta, html

def list_items(kind: str):
    # kind: "works" or "articles" etc.
    folder = COLL / kind
    if not folder.exists(): return []
    items = []
    for f in sorted(folder.glob("*.md")):
        meta, _ = load_md(f)
        slug = f.stem
        title = meta.get("title", slug)
        date  = meta.get("date")
        items.append({"slug": slug, "title": title, "date": date})
    # 新しい順に
    items.sort(key=lambda x: (x["date"] or ""), reverse=True)
    return items

@app.route("/")
def root():
    return page("main")

@app.route("/<slug>")
def page(slug):
    file = (PAGES / f"{slug}.md")
    if not file.exists():
        # 一覧ページにマップ（/works, /articlesなど）
        if (COLL / slug).exists():
            items = list_items(slug)
            return render_template("list.html", nav=nav_items(), title=slug, kind=slug, items=items)
        return render_template("not_found.html", slug=slug, nav=nav_items(), title="404"), 404
    meta, html = load_md(file)
    return render_template("page.html", nav=nav_items(), title=meta.get("title", slug), html=html)

@app.route("/<kind>/<slug>")
def item(kind, slug):
    file = COLL / kind / f"{slug}.md"
    if not file.exists():
        abort(404)
    meta, html = load_md(file)
    return render_template("item.html", nav=nav_items(), title=meta.get("title", slug), html=html, meta=meta, kind=kind, slug=slug)

# --- 旧URLの救済（簡易リダイレクト） ---
import yaml
REDIR = {}
redir_file = BASE / "redirects.yaml"
if redir_file.exists():
    REDIR = yaml.safe_load(redir_file.read_text(encoding="utf-8")) or {}

@app.route("/<path:legacy>.html")
def legacy_redirect(legacy):
    # 例: main.html → /main
    new = REDIR.get(f"/{legacy}.html")
    if not new:
        abort(404)
    # メタリフレッシュで静的化に優しい簡易リダイレクト
    html = f'<meta http-equiv="refresh" content="0;url={new}">'
    return html, 301

if __name__ == "__main__":
    app.run(debug=True)
