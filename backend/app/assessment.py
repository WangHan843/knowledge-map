from .question_bank import MODULES

def level_for(correct: int, total: int) -> str:
    if not total:
        return 'unassessed'
    # Compare integers: no rounding around the 40/60/80 percent boundaries.
    if correct * 5 < total * 2:
        return 'unskilled'
    if correct * 5 < total * 3:
        return 'understood'
    if correct * 5 < total * 4:
        return 'familiar'
    return 'mastered'

def module_levels(db, student_id):
    rows=db.execute('''SELECT a.module, SUM(a.is_correct) AS correct, COUNT(*) AS total
        FROM test_answers a JOIN test_attempts t ON t.id=a.attempt_id
        WHERE t.student_id=? AND t.status='submitted' GROUP BY a.module''',(student_id,)).fetchall()
    counts={r['module']:r for r in rows}
    return [{'node_id':module,'level':level_for(counts[module]['correct'],counts[module]['total'])
             if module in counts else 'unassessed'} for module in MODULES]
