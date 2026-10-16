from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .demo import router
from contextlib import asynccontextmanager
from .identity import router as identity_router
from .storage.database import initialize_database
from .learning import router as learning_router

@asynccontextmanager
async def lifespan(app):
    initialize_database()
    yield

app = FastAPI(title='定位方法 · 课堂学习', version='0.2.0', lifespan=lifespan, docs_url='/api/docs', redoc_url=None, openapi_url='/api/openapi.json')
app.include_router(router)
app.include_router(identity_router)
app.include_router(learning_router)
DIST = Path(__file__).resolve().parents[2] / 'frontend' / 'dist-server'


@app.get('/api/health')
def health():
    return {'status': 'ok', 'phase': 2, 'is_demo': False, 'storage': 'sqlite', 'formal_assessment': True}


if (DIST / 'assets').is_dir():
    app.mount('/assets', StaticFiles(directory=DIST / 'assets'), name='assets')


@app.get('/favicon.svg', include_in_schema=False)
def favicon():
    if not (DIST / 'favicon.svg').is_file():
        raise HTTPException(404)
    return FileResponse(DIST / 'favicon.svg')


@app.get('/{path:path}', include_in_schema=False)
def frontend(path: str):
    # Allowlist frontend routes. Never expose the workspace, PDF or database.
    parts = path.strip('/').split('/')
    valid = path in ('', 'practice', 'test', 'mistakes', 'teacher') or (
        len(parts) == 2 and parts[0] in ('learn', 'practice') and parts[1] in ('toa', 'tdoa', 'rss', 'aoa'))
    if not valid:
        raise HTTPException(404, '页面不存在。')
    if not (DIST / 'index.html').is_file():
        raise HTTPException(503, '请先运行前端 npm run build，或使用 Vite 开发服务。')
    return FileResponse(DIST / 'index.html', headers={'Cache-Control': 'no-cache'})
