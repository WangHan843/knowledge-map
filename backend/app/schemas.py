from typing import Literal
from pydantic import BaseModel, ConfigDict

NodeId = Literal['toa', 'tdoa', 'rss', 'aoa']
OptionId = Literal['A', 'B', 'C', 'D']


class Option(BaseModel):
    id: OptionId
    text: str


class PublicQuestion(BaseModel):
    id: str
    node_id: NodeId
    stem: str
    options: list[Option]
    is_demo: bool = True


class PracticeInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    question_id: str
    selected_option: OptionId


class SubmitInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    answers: dict[str, OptionId]
