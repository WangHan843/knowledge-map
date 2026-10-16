"""Phase 1 only: four fixed mock questions and ephemeral single-process attempts.

Never use this store for formal assessment. Phase 2 replaces it with SQLite,
reviewed content, randomized frozen question sets and authenticated participants.
"""
import secrets
from threading import Lock
from fastapi import APIRouter, Header, HTTPException
from .schemas import NodeId, PracticeInput, PublicQuestion, SubmitInput

router = APIRouter(prefix='/api/demo', tags=['phase-1-demo'])


def question(node_id, stem, options, correct, explanation):
    return dict(id=f'demo-{node_id}-1', node_id=node_id, stem=stem,
                options=[dict(id=key, text=text) for key, text in zip('ABCD', options)],
                correct_option=correct, explanation=explanation, is_demo=True)


QUESTIONS = [
    question('toa', '在 TOA 定位的概念示例中，哪一项是估计距离的重要依据？',
             ['接收设备的屏幕尺寸', '信号的传播时间', '网络中的设备名称', '设备的外壳颜色'], 'B',
             '模拟解析：TOA 利用传播时间与已知传播速度估计距离。实际测量还需考虑时钟与传播条件。本题待教师核验。'),
    question('tdoa', 'TDOA 方法关注同一信号到达多个参考点时的什么差异？',
             ['到达时间的差异', '接收设备颜色的差异', '题目编号的差异', '屏幕亮度的差异'], 'A',
             '模拟解析：到达时间差可转化为目标到参考点的距离差，参考点之间仍需同步。本题待教师核验。'),
    question('rss', '在 RSS 指纹定位的概念示例中，主要比较哪种位置特征？',
             ['设备外观照片', '用户的昵称长度', '多路接收信号的强度', '电池的生产日期'], 'C',
             '模拟解析：多个参考点的接收信号强度可组成 RSS 指纹，与预先采集的位置特征比较。本题待教师核验。'),
    question('aoa', 'AOA 定位主要利用信号的哪一种信息？',
             ['文件存储容量', '设备开机日期', '用户名的长度', '到达角度'], 'D',
             '模拟解析：AOA 估计信号的到达角度，结合多个参考点的方向信息推算位置。本题待教师核验。'),
]
BY_ID = {q['id']: q for q in QUESTIONS}
_attempts: dict[str, dict] = {}
_lock = Lock()


def public_questions(questions):
    return [PublicQuestion.model_validate(q).model_dump() for q in questions]


def feedback(q, selected):
    return dict(question_id=q['id'], node_id=q['node_id'], selected_option=selected,
                correct_option=q['correct_option'], is_correct=selected == q['correct_option'],
                explanation=q['explanation'], is_demo=True)


def authorized(attempt_id, authorization):
    attempt = _attempts.get(attempt_id)
    if not attempt or not secrets.compare_digest(authorization or '', f"Bearer {attempt['token']}"):
        raise HTTPException(404, '演示测试已失效，请重新开始。')
    return attempt


def attempt_view(attempt):
    return dict(id=attempt['id'], questions=public_questions(attempt['questions']),
                is_demo=True, result=attempt['result'])


@router.get('/questions', response_model=list[PublicQuestion])
def list_questions(node_id: NodeId | None = None):
    return [q for q in QUESTIONS if node_id is None or q['node_id'] == node_id]


@router.post('/practice/check')
def check_practice(body: PracticeInput):
    q = BY_ID.get(body.question_id)
    if not q:
        raise HTTPException(404, '找不到这道演示题。')
    return feedback(q, body.selected_option)


@router.post('/attempts')
def start_attempt():
    attempt = dict(id=secrets.token_urlsafe(18), token=secrets.token_urlsafe(32),
                   questions=list(QUESTIONS), result=None)
    with _lock:
        _attempts[attempt['id']] = attempt
    return {**attempt_view(attempt), 'token': attempt['token']}


@router.get('/attempts/{attempt_id}')
def get_attempt(attempt_id: str, authorization: str | None = Header(default=None)):
    with _lock:
        return attempt_view(authorized(attempt_id, authorization))


@router.post('/attempts/{attempt_id}/submit')
def submit_attempt(attempt_id: str, body: SubmitInput, authorization: str | None = Header(default=None)):
    with _lock:
        attempt = authorized(attempt_id, authorization)
        if attempt['result'] is not None:
            return attempt['result']
        if set(body.answers) != {q['id'] for q in attempt['questions']}:
            raise HTTPException(422, '请完成本次演示的全部题目后提交。')
        answers = [feedback(q, body.answers[q['id']]) for q in attempt['questions']]
        result = dict(attempt_id=attempt_id, is_demo=True, total=len(answers),
                      correct_count=sum(a['is_correct'] for a in answers), answers=answers,
                      nodes=[dict(node_id=q['node_id'], level='unassessed') for q in attempt['questions']])
        attempt['result'] = result
        return result
